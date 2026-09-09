// Package otlp implements a minimal OTLP/HTTP receiver — the wire format
// every OpenTelemetry SDK speaks by default, so any instrumented app can
// point its OTLP exporter at botobs with no botobs-specific integration.
//
// v1 scope (see botobs/README.md's roadmap for what's deliberately deferred):
// metrics Gauge and Sum (the two point-in-time/counter shapes almost every
// app actually emits) and traces, both over the standard
// "/v1/metrics"/"/v1/traces" HTTP paths with a protobuf body
// (Content-Type: application/x-protobuf, the default for every OTel SDK's
// OTLP/HTTP exporter). Histogram/ExponentialHistogram/Summary metric types
// and OTLP/JSON bodies are not handled yet — an unrecognized metric type is
// skipped, not an error, so a mixed batch still gets the points it can use.
package otlp

import (
	"context"
	"encoding/hex"
	"io"
	"net/http"
	"strconv"
	"time"

	"google.golang.org/protobuf/proto"

	collectormetrics "go.opentelemetry.io/proto/otlp/collector/metrics/v1"
	collectortrace "go.opentelemetry.io/proto/otlp/collector/trace/v1"
	commonpb "go.opentelemetry.io/proto/otlp/common/v1"
	metricspb "go.opentelemetry.io/proto/otlp/metrics/v1"
	resourcepb "go.opentelemetry.io/proto/otlp/resource/v1"
	tracepb "go.opentelemetry.io/proto/otlp/trace/v1"

	"github.com/marcfs31/fors-observability-design-system/botobs/internal/model"
)

// MetricSink and SpanSink are the write sides of store.Store — declared here
// (not imported from store) so this package doesn't need to know about the
// rest of the storage interface, only what it writes.
type MetricSink interface {
	WriteMetrics(ctx context.Context, metrics []model.Metric) error
}

type SpanSink interface {
	WriteSpans(ctx context.Context, spans []model.Span) error
}

// Handler serves the OTLP/HTTP metrics and traces endpoints.
type Handler struct {
	metrics MetricSink
	spans   SpanSink
}

func NewHandler(metrics MetricSink, spans SpanSink) *Handler {
	return &Handler{metrics: metrics, spans: spans}
}

// Register mounts the standard OTLP/HTTP paths on mux.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/metrics", h.handleMetrics)
	mux.HandleFunc("POST /v1/traces", h.handleTraces)
}

func (h *Handler) handleMetrics(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 32<<20)) // 32MiB cap
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}
	var req collectormetrics.ExportMetricsServiceRequest
	if err := proto.Unmarshal(body, &req); err != nil {
		http.Error(w, "invalid OTLP metrics payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	metrics := metricsFromOTLP(&req)
	if err := h.metrics.WriteMetrics(r.Context(), metrics); err != nil {
		http.Error(w, "failed to store metrics", http.StatusInternalServerError)
		return
	}
	writeEmptyProtoResponse(w)
}

func (h *Handler) handleTraces(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 32<<20))
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}
	var req collectortrace.ExportTraceServiceRequest
	if err := proto.Unmarshal(body, &req); err != nil {
		http.Error(w, "invalid OTLP traces payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	spans := spansFromOTLP(&req)
	if err := h.spans.WriteSpans(r.Context(), spans); err != nil {
		http.Error(w, "failed to store spans", http.StatusInternalServerError)
		return
	}
	writeEmptyProtoResponse(w)
}

// writeEmptyProtoResponse satisfies OTLP/HTTP clients, which expect a
// (possibly empty) ExportServiceResponse protobuf body on success — an empty
// body with 200 status is a valid empty message, so this just sets the
// content type and status without constructing one.
func writeEmptyProtoResponse(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/x-protobuf")
	w.WriteHeader(http.StatusOK)
}

func metricsFromOTLP(req *collectormetrics.ExportMetricsServiceRequest) []model.Metric {
	var out []model.Metric
	for _, rm := range req.GetResourceMetrics() {
		resourceLabels := resourceAttributes(rm.GetResource())
		for _, sm := range rm.GetScopeMetrics() {
			for _, m := range sm.GetMetrics() {
				out = append(out, dataPointsFromMetric(m, resourceLabels)...)
			}
		}
	}
	return out
}

func dataPointsFromMetric(m *metricspb.Metric, resourceLabels map[string]string) []model.Metric {
	var points []*metricspb.NumberDataPoint
	switch data := m.GetData().(type) {
	case *metricspb.Metric_Gauge:
		points = data.Gauge.GetDataPoints()
	case *metricspb.Metric_Sum:
		points = data.Sum.GetDataPoints()
	default:
		// Histogram/ExponentialHistogram/Summary: roadmap, see package doc.
		return nil
	}

	out := make([]model.Metric, 0, len(points))
	for _, dp := range points {
		labels := mergeLabels(resourceLabels, attributesToLabels(dp.GetAttributes()))
		out = append(out, model.Metric{
			Name:      m.GetName(),
			Value:     numberDataPointValue(dp),
			Timestamp: time.Unix(0, int64(dp.GetTimeUnixNano())),
			Labels:    labels,
		})
	}
	return out
}

func numberDataPointValue(dp *metricspb.NumberDataPoint) float64 {
	switch v := dp.GetValue().(type) {
	case *metricspb.NumberDataPoint_AsDouble:
		return v.AsDouble
	case *metricspb.NumberDataPoint_AsInt:
		return float64(v.AsInt)
	default:
		return 0
	}
}

func spansFromOTLP(req *collectortrace.ExportTraceServiceRequest) []model.Span {
	var out []model.Span
	for _, rs := range req.GetResourceSpans() {
		service := serviceName(rs.GetResource())
		for _, ss := range rs.GetScopeSpans() {
			for _, s := range ss.GetSpans() {
				out = append(out, spanFromOTLP(s, service))
			}
		}
	}
	return out
}

func spanFromOTLP(s *tracepb.Span, service string) model.Span {
	start := time.Unix(0, int64(s.GetStartTimeUnixNano()))
	end := time.Unix(0, int64(s.GetEndTimeUnixNano()))
	return model.Span{
		TraceID:    hex.EncodeToString(s.GetTraceId()),
		SpanID:     hex.EncodeToString(s.GetSpanId()),
		ParentID:   hex.EncodeToString(s.GetParentSpanId()),
		Name:       s.GetName(),
		Service:    service,
		Start:      start,
		Duration:   end.Sub(start),
		Status:     spanStatus(s.GetStatus()),
		Attributes: attributesToLabels(s.GetAttributes()),
	}
}

func spanStatus(status *tracepb.Status) model.SpanStatus {
	switch status.GetCode() {
	case tracepb.Status_STATUS_CODE_OK:
		return model.SpanStatusOK
	case tracepb.Status_STATUS_CODE_ERROR:
		return model.SpanStatusError
	default:
		return model.SpanStatusUnset
	}
}

// serviceName reads the "service.name" resource attribute OTel's semantic
// conventions require every SDK to set — falls back to "unknown_service" if
// absent, matching the OpenTelemetry spec's own documented default.
func serviceName(r *resourcepb.Resource) string {
	labels := resourceAttributes(r)
	if name, ok := labels["service.name"]; ok {
		return name
	}
	return "unknown_service"
}

func resourceAttributes(r *resourcepb.Resource) map[string]string {
	return attributesToLabels(r.GetAttributes())
}

// attributesToLabels flattens OTLP attributes to strings. Non-string values
// (bool/int/double) are formatted; nested array/kvlist attributes are
// skipped — botobs's label model is flat, matching model.Metric.Labels.
func attributesToLabels(attrs []*commonpb.KeyValue) map[string]string {
	if len(attrs) == 0 {
		return nil
	}
	out := make(map[string]string, len(attrs))
	for _, a := range attrs {
		if v, ok := stringifyAnyValue(a.GetValue()); ok {
			out[a.GetKey()] = v
		}
	}
	return out
}

func stringifyAnyValue(v *commonpb.AnyValue) (string, bool) {
	switch val := v.GetValue().(type) {
	case *commonpb.AnyValue_StringValue:
		return val.StringValue, true
	case *commonpb.AnyValue_BoolValue:
		if val.BoolValue {
			return "true", true
		}
		return "false", true
	case *commonpb.AnyValue_IntValue:
		return strconv.FormatInt(val.IntValue, 10), true
	case *commonpb.AnyValue_DoubleValue:
		return strconv.FormatFloat(val.DoubleValue, 'g', -1, 64), true
	default:
		return "", false
	}
}

func mergeLabels(a, b map[string]string) map[string]string {
	if len(a) == 0 {
		return b
	}
	if len(b) == 0 {
		return a
	}
	out := make(map[string]string, len(a)+len(b))
	for k, v := range a {
		out[k] = v
	}
	for k, v := range b {
		out[k] = v // point-level attributes win over resource-level ones
	}
	return out
}
