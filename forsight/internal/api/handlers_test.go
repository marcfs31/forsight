package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
	"github.com/marcfs31/forsight/forsight/internal/store"
)

func TestHandleHealthz(t *testing.T) {
	s := NewServer(store.NewMemoryStore(time.Hour), nil, nil, nil)
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decoding body: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("status field = %q, want ok", body["status"])
	}
}

func TestHandleMetrics_FiltersByNameAndLabel(t *testing.T) {
	st := store.NewMemoryStore(time.Hour)
	now := time.Now()
	_ = st.WriteMetrics(context.Background(), []model.Metric{
		{Name: "host.cpu.percent", Value: 10, Timestamp: now, Labels: map[string]string{"host": "a"}},
		{Name: "host.cpu.percent", Value: 20, Timestamp: now, Labels: map[string]string{"host": "b"}},
		{Name: "host.memory.percent", Value: 30, Timestamp: now},
	})
	s := NewServer(st, nil, nil, nil)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/metrics?name=host.cpu.percent&label.host=a", nil)
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	var got []model.Metric
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decoding body: %v", err)
	}
	if len(got) != 1 || got[0].Value != 10 {
		t.Fatalf("got %+v, want exactly the host=a metric", got)
	}
}

func TestHandleMetrics_RejectsInvalidSince(t *testing.T) {
	s := NewServer(store.NewMemoryStore(time.Hour), nil, nil, nil)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/metrics?since=not-a-date", nil)
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}

func TestHandleTraces_FiltersByService(t *testing.T) {
	st := store.NewMemoryStore(time.Hour)
	now := time.Now()
	_ = st.WriteSpans(context.Background(), []model.Span{
		{TraceID: "t1", SpanID: "s1", Service: "checkout", Start: now, Status: model.SpanStatusOK},
		{TraceID: "t2", SpanID: "s2", Service: "payments", Start: now, Status: model.SpanStatusError},
	})
	s := NewServer(st, nil, nil, nil)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/traces?service=payments", nil)
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	var got []model.Span
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decoding body: %v", err)
	}
	if len(got) != 1 || got[0].TraceID != "t2" {
		t.Fatalf("got %+v, want exactly the payments span", got)
	}
}

func TestHandleLogs_FiltersBySourceAndSeverity(t *testing.T) {
	st := store.NewMemoryStore(time.Hour)
	now := time.Now()
	_ = st.WriteLogs(context.Background(), []model.LogEntry{
		{Timestamp: now, Severity: model.LogSeverityInfo, Source: "checkout", Message: "ok"},
		{Timestamp: now, Severity: model.LogSeverityError, Source: "payments", Message: "fail"},
		{Timestamp: now, Severity: model.LogSeverityWarn, Source: "payments", Message: "slow"},
	})
	s := NewServer(st, nil, nil, nil)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/logs?source=payments&severity=error", nil)
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body: %s)", rec.Code, rec.Body.String())
	}
	var got []model.LogEntry
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("decoding body: %v", err)
	}
	if len(got) != 1 || got[0].Message != "fail" {
		t.Fatalf("got %+v, want exactly the payments error entry", got)
	}
}

func TestHandleLogs_RejectsInvalidSince(t *testing.T) {
	s := NewServer(store.NewMemoryStore(time.Hour), nil, nil, nil)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/logs?since=not-a-date", nil)
	s.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
}

func TestHandler_MountsOTLPAndDashboard(t *testing.T) {
	otlpMounted := false
	fakeOTLP := otlpRegisterFunc(func(mux *http.ServeMux) {
		otlpMounted = true
		mux.HandleFunc("POST /v1/metrics", func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusOK)
		})
	})
	dashboard := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusTeapot) // distinctive, unambiguous marker
	})

	s := NewServer(store.NewMemoryStore(time.Hour), fakeOTLP, dashboard, nil)
	handler := s.Handler()

	if !otlpMounted {
		t.Fatal("Handler() did not call otlp.Register")
	}

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/anything", nil))
	if rec.Code != http.StatusTeapot {
		t.Errorf("fallback route status = %d, want the dashboard handler's 418", rec.Code)
	}
}

type otlpRegisterFunc func(mux *http.ServeMux)

func (f otlpRegisterFunc) Register(mux *http.ServeMux) { f(mux) }
