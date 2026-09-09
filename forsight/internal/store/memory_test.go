package store

import (
	"context"
	"testing"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

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
