package store

import (
	"context"
	"testing"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

// TestMemoryStore_Conformance runs the shared Store query-semantics suite
// (also run by BadgerStore in badger_test.go) against MemoryStore.
func TestMemoryStore_Conformance(t *testing.T) {
	runStoreConformanceTests(t, func(t *testing.T) Store {
		return NewMemoryStore(time.Hour)
	})
}

func TestMemoryStore_WriteThenQuery(t *testing.T) {
	s := NewMemoryStore(time.Hour)
	ctx := context.Background()
	now := time.Now()

	err := s.WriteMetrics(ctx, []model.Metric{
		{Name: "host.cpu.percent", Value: 42, Timestamp: now, Labels: map[string]string{"host": "a"}},
		{Name: "host.cpu.percent", Value: 7, Timestamp: now, Labels: map[string]string{"host": "b"}},
	})
	if err != nil {
		t.Fatalf("WriteMetrics: %v", err)
	}

	got, err := s.QueryMetrics(ctx, MetricQuery{Name: "host.cpu.percent"})
	if err != nil {
		t.Fatalf("QueryMetrics: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("QueryMetrics returned %d metrics, want 2", len(got))
	}
}

func TestMemoryStore_QueryFiltersByLabel(t *testing.T) {
	s := NewMemoryStore(time.Hour)
	ctx := context.Background()
	now := time.Now()

	_ = s.WriteMetrics(ctx, []model.Metric{
		{Name: "m", Value: 1, Timestamp: now, Labels: map[string]string{"host": "a"}},
		{Name: "m", Value: 2, Timestamp: now, Labels: map[string]string{"host": "b"}},
	})

	got, err := s.QueryMetrics(ctx, MetricQuery{Labels: map[string]string{"host": "a"}})
	if err != nil {
		t.Fatalf("QueryMetrics: %v", err)
	}
	if len(got) != 1 || got[0].Value != 1 {
		t.Fatalf("QueryMetrics with label filter = %+v, want exactly the host=a metric", got)
	}
}

func TestMemoryStore_PrunesOldMetrics(t *testing.T) {
	s := NewMemoryStore(time.Minute)
	fixedNow := time.Now()
	s.now = func() time.Time { return fixedNow }
	ctx := context.Background()

	_ = s.WriteMetrics(ctx, []model.Metric{
		{Name: "old", Value: 1, Timestamp: fixedNow.Add(-2 * time.Minute)},
		{Name: "recent", Value: 2, Timestamp: fixedNow.Add(-10 * time.Second)},
	})

	got, err := s.QueryMetrics(ctx, MetricQuery{})
	if err != nil {
		t.Fatalf("QueryMetrics: %v", err)
	}
	if len(got) != 1 || got[0].Name != "recent" {
		t.Fatalf("QueryMetrics after prune = %+v, want only the recent metric", got)
	}
}

func TestMemoryStore_QuerySinceExcludesOlderPoints(t *testing.T) {
	s := NewMemoryStore(time.Hour)
	ctx := context.Background()
	now := time.Now()

	_ = s.WriteMetrics(ctx, []model.Metric{
		{Name: "m", Value: 1, Timestamp: now.Add(-30 * time.Minute)},
		{Name: "m", Value: 2, Timestamp: now.Add(-5 * time.Minute)},
	})

	got, err := s.QueryMetrics(ctx, MetricQuery{Since: now.Add(-10 * time.Minute)})
	if err != nil {
		t.Fatalf("QueryMetrics: %v", err)
	}
	if len(got) != 1 || got[0].Value != 2 {
		t.Fatalf("QueryMetrics with Since = %+v, want only the recent point", got)
	}
}

func TestMemoryStore_Spans(t *testing.T) {
	s := NewMemoryStore(time.Hour)
	ctx := context.Background()
	now := time.Now()

	err := s.WriteSpans(ctx, []model.Span{
		{TraceID: "t1", SpanID: "s1", Service: "checkout", Start: now, Status: model.SpanStatusOK},
		{TraceID: "t2", SpanID: "s2", Service: "payments", Start: now, Status: model.SpanStatusError},
	})
	if err != nil {
		t.Fatalf("WriteSpans: %v", err)
	}

	got, err := s.QuerySpans(ctx, SpanQuery{Service: "payments"})
	if err != nil {
		t.Fatalf("QuerySpans: %v", err)
	}
	if len(got) != 1 || got[0].TraceID != "t2" {
		t.Fatalf("QuerySpans with service filter = %+v, want exactly the payments span", got)
	}
}

func TestMemoryStore_ElementCapBoundsGrowth(t *testing.T) {
	// Age pruning alone cannot bound this store, because ingested timestamps
	// come off the wire: a writer choosing a far-future timestamp is never
	// pruned. The element cap is what makes memory a function of configuration
	// rather than of what somebody sends.
	s := NewMemoryStore(time.Hour)
	s.SetMaxElements(100)

	future := time.Now().Add(24 * time.Hour)
	for i := 0; i < 10; i++ {
		batch := make([]model.Metric, 50)
		for j := range batch {
			batch[j] = model.Metric{Name: "m", Value: float64(i*50 + j), Timestamp: future}
		}
		if err := s.WriteMetrics(context.Background(), batch); err != nil {
			t.Fatalf("WriteMetrics: %v", err)
		}
	}

	got, err := s.QueryMetrics(context.Background(), MetricQuery{Name: "m"})
	if err != nil {
		t.Fatalf("QueryMetrics: %v", err)
	}
	if len(got) != 100 {
		t.Fatalf("stored %d metrics, want the cap of 100 — 500 future-dated points were written", len(got))
	}
	// The newest are the ones kept: the last write was values 450..499.
	if got[len(got)-1].Value != 499 {
		t.Errorf("newest retained value = %v, want 499 (the cap must drop the oldest, not the newest)", got[len(got)-1].Value)
	}
}

func TestMemoryStore_SetMaxElementsRejectsUnbounded(t *testing.T) {
	s := NewMemoryStore(time.Hour)
	s.SetMaxElements(0) // must fall back to the default, never mean "no limit"
	batch := make([]model.Metric, 10)
	for i := range batch {
		batch[i] = model.Metric{Name: "m", Timestamp: time.Now()}
	}
	if err := s.WriteMetrics(context.Background(), batch); err != nil {
		t.Fatalf("WriteMetrics: %v", err)
	}
	got, _ := s.QueryMetrics(context.Background(), MetricQuery{Name: "m"})
	if len(got) != 10 {
		t.Fatalf("got %d, want 10 — a zero cap must restore the default, not discard data", len(got))
	}
}

func TestMemoryStore_SpanElementCap(t *testing.T) {
	s := NewMemoryStore(time.Hour)
	s.SetMaxElements(20)
	future := time.Now().Add(24 * time.Hour)
	spans := make([]model.Span, 100)
	for i := range spans {
		spans[i] = model.Span{TraceID: "t", SpanID: "s", Service: "svc", Start: future}
	}
	if err := s.WriteSpans(context.Background(), spans); err != nil {
		t.Fatalf("WriteSpans: %v", err)
	}
	got, err := s.QuerySpans(context.Background(), SpanQuery{Service: "svc"})
	if err != nil {
		t.Fatalf("QuerySpans: %v", err)
	}
	if len(got) != 20 {
		t.Fatalf("stored %d spans, want the cap of 20", len(got))
	}
}

func TestMemoryStore_Logs(t *testing.T) {
	s := NewMemoryStore(time.Hour)
	ctx := context.Background()
	now := time.Now()

	err := s.WriteLogs(ctx, []model.LogEntry{
		{Timestamp: now, Severity: model.LogSeverityInfo, Source: "checkout", Message: "ok"},
		{Timestamp: now, Severity: model.LogSeverityError, Source: "payments", Message: "fail"},
	})
	if err != nil {
		t.Fatalf("WriteLogs: %v", err)
	}

	got, err := s.QueryLogs(ctx, LogQuery{Source: "payments"})
	if err != nil {
		t.Fatalf("QueryLogs: %v", err)
	}
	if len(got) != 1 || got[0].Message != "fail" {
		t.Fatalf("QueryLogs with source filter = %+v, want exactly the payments entry", got)
	}

	got, err = s.QueryLogs(ctx, LogQuery{Severity: model.LogSeverityError})
	if err != nil {
		t.Fatalf("QueryLogs: %v", err)
	}
	if len(got) != 1 || got[0].Source != "payments" {
		t.Fatalf("QueryLogs with severity filter = %+v, want exactly the error entry", got)
	}
}

func TestMemoryStore_PrunesOldLogs(t *testing.T) {
	s := NewMemoryStore(time.Minute)
	fixedNow := time.Now()
	s.now = func() time.Time { return fixedNow }
	ctx := context.Background()

	_ = s.WriteLogs(ctx, []model.LogEntry{
		{Timestamp: fixedNow.Add(-2 * time.Minute), Severity: model.LogSeverityInfo, Source: "a", Message: "old"},
		{Timestamp: fixedNow.Add(-10 * time.Second), Severity: model.LogSeverityInfo, Source: "a", Message: "recent"},
	})

	got, err := s.QueryLogs(ctx, LogQuery{})
	if err != nil {
		t.Fatalf("QueryLogs: %v", err)
	}
	if len(got) != 1 || got[0].Message != "recent" {
		t.Fatalf("QueryLogs after prune = %+v, want only the recent entry", got)
	}
}

func TestMemoryStore_QueryLogsSinceExcludesOlder(t *testing.T) {
	s := NewMemoryStore(time.Hour)
	ctx := context.Background()
	now := time.Now()

	_ = s.WriteLogs(ctx, []model.LogEntry{
		{Timestamp: now.Add(-30 * time.Minute), Severity: model.LogSeverityInfo, Source: "a", Message: "old"},
		{Timestamp: now.Add(-5 * time.Minute), Severity: model.LogSeverityInfo, Source: "a", Message: "recent"},
	})

	got, err := s.QueryLogs(ctx, LogQuery{Since: now.Add(-10 * time.Minute)})
	if err != nil {
		t.Fatalf("QueryLogs: %v", err)
	}
	if len(got) != 1 || got[0].Message != "recent" {
		t.Fatalf("QueryLogs with Since = %+v, want only the recent entry", got)
	}
}

func TestMemoryStore_LogElementCap(t *testing.T) {
	s := NewMemoryStore(time.Hour)
	s.SetMaxElements(20)
	future := time.Now().Add(24 * time.Hour)
	logs := make([]model.LogEntry, 100)
	for i := range logs {
		logs[i] = model.LogEntry{
			Timestamp: future,
			Severity:  model.LogSeverityInfo,
			Source:    "svc",
			Message:   "m",
		}
	}
	if err := s.WriteLogs(context.Background(), logs); err != nil {
		t.Fatalf("WriteLogs: %v", err)
	}
	got, err := s.QueryLogs(context.Background(), LogQuery{Source: "svc"})
	if err != nil {
		t.Fatalf("QueryLogs: %v", err)
	}
	if len(got) != 20 {
		t.Fatalf("stored %d logs, want the cap of 20", len(got))
	}
}
