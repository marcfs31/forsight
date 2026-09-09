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
