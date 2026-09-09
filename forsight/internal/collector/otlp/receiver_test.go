package otlp

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"google.golang.org/protobuf/proto"

	collectormetrics "go.opentelemetry.io/proto/otlp/collector/metrics/v1"
	collectortrace "go.opentelemetry.io/proto/otlp/collector/trace/v1"
	commonpb "go.opentelemetry.io/proto/otlp/common/v1"
	metricspb "go.opentelemetry.io/proto/otlp/metrics/v1"
	resourcepb "go.opentelemetry.io/proto/otlp/resource/v1"
	tracepb "go.opentelemetry.io/proto/otlp/trace/v1"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

type fakeSink struct {
	metrics []model.Metric
	spans   []model.Span
}

func (f *fakeSink) WriteMetrics(_ context.Context, m []model.Metric) error {
	f.metrics = append(f.metrics, m...)
	return nil
}

func (f *fakeSink) WriteSpans(_ context.Context, s []model.Span) error {
	f.spans = append(f.spans, s...)
	return nil
}

func stringAttr(key, value string) *commonpb.KeyValue {
	return &commonpb.KeyValue{
		Key:   key,
		Value: &commonpb.AnyValue{Value: &commonpb.AnyValue_StringValue{StringValue: value}},
	}
}

func TestHandleMetrics_GaugeAndSum(t *testing.T) {
	sink := &fakeSink{}
	h := NewHandler(sink, sink)
	mux := http.NewServeMux()
	h.Register(mux)

	req := &collectormetrics.ExportMetricsServiceRequest{
		ResourceMetrics: []*metricspb.ResourceMetrics{
			{
				Resource: &resourcepb.Resource{
					Attributes: []*commonpb.KeyValue{stringAttr("service.name", "checkout-api")},
				},
				ScopeMetrics: []*metricspb.ScopeMetrics{
					{
						Metrics: []*metricspb.Metric{
							{
								Name: "requests.count",
								Data: &metricspb.Metric_Sum{
									Sum: &metricspb.Sum{
										DataPoints: []*metricspb.NumberDataPoint{
											{
												TimeUnixNano: 1_700_000_000_000_000_000,
												Value:        &metricspb.NumberDataPoint_AsInt{AsInt: 42},
											},
										},
									},
								},
							},
							{
								Name: "cpu.percent",
								Data: &metricspb.Metric_Gauge{
									Gauge: &metricspb.Gauge{
										DataPoints: []*metricspb.NumberDataPoint{
											{
												TimeUnixNano: 1_700_000_000_000_000_000,
												Value:        &metricspb.NumberDataPoint_AsDouble{AsDouble: 12.5},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}
	body, err := proto.Marshal(req)
	if err != nil {
		t.Fatalf("proto.Marshal: %v", err)
	}

	rec := httptest.NewRecorder()
	httpReq := httptest.NewRequest(http.MethodPost, "/v1/metrics", bytes.NewReader(body))
	mux.ServeHTTP(rec, httpReq)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	if len(sink.metrics) != 2 {
		t.Fatalf("got %d metrics, want 2: %+v", len(sink.metrics), sink.metrics)
	}

	byName := map[string]model.Metric{}
	for _, m := range sink.metrics {
		byName[m.Name] = m
	}
	if m, ok := byName["requests.count"]; !ok || m.Value != 42 {
		t.Errorf("requests.count = %+v, want Value=42", m)
	}
	if m, ok := byName["cpu.percent"]; !ok || m.Value != 12.5 {
		t.Errorf("cpu.percent = %+v, want Value=12.5", m)
	}
	if got := byName["requests.count"].Labels["service.name"]; got != "checkout-api" {
		t.Errorf("resource label service.name = %q, want checkout-api", got)
	}
}

func TestHandleTraces_MapsSpanFields(t *testing.T) {
	sink := &fakeSink{}
	h := NewHandler(sink, sink)
	mux := http.NewServeMux()
	h.Register(mux)

	traceID := []byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}
	spanID := []byte{1, 2, 3, 4, 5, 6, 7, 8}

	req := &collectortrace.ExportTraceServiceRequest{
		ResourceSpans: []*tracepb.ResourceSpans{
			{
				Resource: &resourcepb.Resource{
					Attributes: []*commonpb.KeyValue{stringAttr("service.name", "payments")},
				},
				ScopeSpans: []*tracepb.ScopeSpans{
					{
						Spans: []*tracepb.Span{
							{
								TraceId:           traceID,
								SpanId:            spanID,
								Name:              "charge",
								StartTimeUnixNano: 1_700_000_000_000_000_000,
								EndTimeUnixNano:   1_700_000_000_500_000_000,
								Status:            &tracepb.Status{Code: tracepb.Status_STATUS_CODE_ERROR},
							},
						},
					},
				},
			},
		},
	}
	body, err := proto.Marshal(req)
	if err != nil {
		t.Fatalf("proto.Marshal: %v", err)
	}

	rec := httptest.NewRecorder()
	httpReq := httptest.NewRequest(http.MethodPost, "/v1/traces", bytes.NewReader(body))
	mux.ServeHTTP(rec, httpReq)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	if len(sink.spans) != 1 {
		t.Fatalf("got %d spans, want 1", len(sink.spans))
	}
	got := sink.spans[0]
	if got.Name != "charge" || got.Service != "payments" || got.Status != model.SpanStatusError {
		t.Errorf("span = %+v, want name=charge service=payments status=error", got)
	}
	if got.Duration.Milliseconds() != 500 {
		t.Errorf("span duration = %v, want 500ms", got.Duration)
	}
}

func TestHandleMetrics_RejectsInvalidBody(t *testing.T) {
	sink := &fakeSink{}
	h := NewHandler(sink, sink)
	mux := http.NewServeMux()
	h.Register(mux)

	rec := httptest.NewRecorder()
	httpReq := httptest.NewRequest(http.MethodPost, "/v1/metrics", bytes.NewReader([]byte("not protobuf")))
	mux.ServeHTTP(rec, httpReq)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}

func float64Ptr(v float64) *float64 { return &v }

func TestHandleMetrics_HistogramCumulativeBuckets(t *testing.T) {
	sink := &fakeSink{}
	h := NewHandler(sink, sink)
	mux := http.NewServeMux()
	h.Register(mux)

	req := &collectormetrics.ExportMetricsServiceRequest{
		ResourceMetrics: []*metricspb.ResourceMetrics{{
			ScopeMetrics: []*metricspb.ScopeMetrics{{
				Metrics: []*metricspb.Metric{{
					Name: "request.duration",
					Data: &metricspb.Metric_Histogram{Histogram: &metricspb.Histogram{
						DataPoints: []*metricspb.HistogramDataPoint{{
							TimeUnixNano: 1_700_000_000_000_000_000,
							Count:        10,
							Sum:          float64Ptr(42.5),
							// per-bucket (not cumulative) counts: 2, 3, 5 across
							// bounds [1, 5] plus an implicit +Inf tail bucket.
							ExplicitBounds: []float64{1, 5},
							BucketCounts:   []uint64{2, 3, 5},
						}},
					}},
				}},
			}},
		}},
	}
	body, err := proto.Marshal(req)
	if err != nil {
		t.Fatalf("proto.Marshal: %v", err)
	}

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/v1/metrics", bytes.NewReader(body)))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}

	byNameAndLe := map[string]model.Metric{}
	for _, m := range sink.metrics {
		key := m.Name
		if le, ok := m.Labels["le"]; ok {
			key += "{le=" + le + "}"
		}
		byNameAndLe[key] = m
	}

	if got := byNameAndLe["request.duration_count"]; got.Value != 10 {
		t.Errorf("request.duration_count = %v, want 10", got.Value)
	}
	if got := byNameAndLe["request.duration_sum"]; got.Value != 42.5 {
		t.Errorf("request.duration_sum = %v, want 42.5", got.Value)
	}
	// Cumulative, not per-bucket: 2, then 2+3=5, the implicit +Inf tail
	// (count 5) is dropped since it has no boundary to label with.
	if got := byNameAndLe["request.duration_bucket{le=1}"]; got.Value != 2 {
		t.Errorf("request.duration_bucket{le=1} = %v, want 2 (the raw per-bucket count, unchanged for the first bucket)", got.Value)
	}
	if got := byNameAndLe["request.duration_bucket{le=5}"]; got.Value != 5 {
		t.Errorf("request.duration_bucket{le=5} = %v, want 5 (cumulative: 2+3)", got.Value)
	}
	if _, ok := byNameAndLe["request.duration_bucket{le=+Inf}"]; ok {
		t.Error("an le=+Inf bucket was emitted, but the implicit tail bucket has no boundary and should be dropped")
	}
}

func TestHandleMetrics_ExponentialHistogramSkipsBucketReconstruction(t *testing.T) {
	sink := &fakeSink{}
	h := NewHandler(sink, sink)
	mux := http.NewServeMux()
	h.Register(mux)

	req := &collectormetrics.ExportMetricsServiceRequest{
		ResourceMetrics: []*metricspb.ResourceMetrics{{
			ScopeMetrics: []*metricspb.ScopeMetrics{{
				Metrics: []*metricspb.Metric{{
					Name: "latency",
					Data: &metricspb.Metric_ExponentialHistogram{ExponentialHistogram: &metricspb.ExponentialHistogram{
						DataPoints: []*metricspb.ExponentialHistogramDataPoint{{
							TimeUnixNano: 1_700_000_000_000_000_000,
							Count:        7,
							Sum:          float64Ptr(100),
							Min:          float64Ptr(1),
							Max:          float64Ptr(50),
						}},
					}},
				}},
			}},
		}},
	}
	body, err := proto.Marshal(req)
	if err != nil {
		t.Fatalf("proto.Marshal: %v", err)
	}

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/v1/metrics", bytes.NewReader(body)))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if len(sink.metrics) != 4 {
		t.Fatalf("got %d metrics, want exactly 4 (count/sum/min/max, no bucket series): %+v", len(sink.metrics), sink.metrics)
	}
}

func TestHandleMetrics_SummaryQuantiles(t *testing.T) {
	sink := &fakeSink{}
	h := NewHandler(sink, sink)
	mux := http.NewServeMux()
	h.Register(mux)

	req := &collectormetrics.ExportMetricsServiceRequest{
		ResourceMetrics: []*metricspb.ResourceMetrics{{
			ScopeMetrics: []*metricspb.ScopeMetrics{{
				Metrics: []*metricspb.Metric{{
					Name: "gc.pause",
					Data: &metricspb.Metric_Summary{Summary: &metricspb.Summary{
						DataPoints: []*metricspb.SummaryDataPoint{{
							TimeUnixNano: 1_700_000_000_000_000_000,
							Count:        100,
							Sum:          500,
							QuantileValues: []*metricspb.SummaryDataPoint_ValueAtQuantile{
								{Quantile: 0.5, Value: 3.2},
								{Quantile: 0.99, Value: 9.8},
							},
						}},
					}},
				}},
			}},
		}},
	}
	body, err := proto.Marshal(req)
	if err != nil {
		t.Fatalf("proto.Marshal: %v", err)
	}

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/v1/metrics", bytes.NewReader(body)))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	byNameAndQuantile := map[string]float64{}
	for _, m := range sink.metrics {
		key := m.Name
		if q, ok := m.Labels["quantile"]; ok {
			key += "{quantile=" + q + "}"
		}
		byNameAndQuantile[key] = m.Value
	}
	if byNameAndQuantile["gc.pause_count"] != 100 {
		t.Errorf("gc.pause_count = %v, want 100", byNameAndQuantile["gc.pause_count"])
	}
	if byNameAndQuantile["gc.pause{quantile=0.5}"] != 3.2 {
		t.Errorf("gc.pause{quantile=0.5} = %v, want 3.2", byNameAndQuantile["gc.pause{quantile=0.5}"])
	}
	if byNameAndQuantile["gc.pause{quantile=0.99}"] != 9.8 {
		t.Errorf("gc.pause{quantile=0.99} = %v, want 9.8", byNameAndQuantile["gc.pause{quantile=0.99}"])
	}
}

func TestHandleMetrics_AcceptsOTLPJSON(t *testing.T) {
	sink := &fakeSink{}
	h := NewHandler(sink, sink)
	mux := http.NewServeMux()
	h.Register(mux)

	// OTLP/JSON uses the same message shape, just proto3 JSON encoding —
	// field names are camelCase and byte fields (trace/span IDs) are base64.
	jsonBody := []byte(`{
		"resourceMetrics": [{
			"resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "json-client"}}]},
			"scopeMetrics": [{
				"metrics": [{
					"name": "requests",
					"gauge": {"dataPoints": [{"timeUnixNano": "1700000000000000000", "asInt": "7"}]}
				}]
			}]
		}]
	}`)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v1/metrics", bytes.NewReader(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("response Content-Type = %q, want application/json (should match the request's own codec)", ct)
	}
	if len(sink.metrics) != 1 || sink.metrics[0].Value != 7 {
		t.Fatalf("got %+v, want exactly one metric with value 7", sink.metrics)
	}
	if got := sink.metrics[0].Labels["service.name"]; got != "json-client" {
		t.Errorf("service.name label = %q, want json-client", got)
	}
}

func TestHandleMetrics_RejectsInvalidJSONBody(t *testing.T) {
	sink := &fakeSink{}
	h := NewHandler(sink, sink)
	mux := http.NewServeMux()
	h.Register(mux)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v1/metrics", bytes.NewReader([]byte("not json")))
	req.Header.Set("Content-Type", "application/json")
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}
