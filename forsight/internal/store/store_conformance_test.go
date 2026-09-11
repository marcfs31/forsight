package store

import (
	"context"
	"testing"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

// runStoreConformanceTests exercises the query semantics every Store
// implementation must share — write/query round trips and exact
// name/service/source, label, TraceID, and Since (time-range) filtering —
// purely through the public Store interface. Both MemoryStore
// (memory_test.go) and BadgerStore (badger_test.go) run it, so the two
// can't silently drift on what a query is supposed to match.
//
// Retention/pruning mechanics are deliberately NOT covered here: MemoryStore
// prunes by comparing an injectable clock against each record's own
// Timestamp field, while BadgerStore expires by Badger's wall-clock TTL
// anchored to write time — different enough in mechanism (and in how a test
// can control time) that each gets its own test instead (see
// TestMemoryStore_PrunesOldMetrics/PrunesOldLogs and
// TestBadgerStore_RetentionExpiresEntries).
func runStoreConformanceTests(t *testing.T, newStore func(t *testing.T) Store) {
	t.Helper()

	t.Run("metrics write-then-query round trip", func(t *testing.T) {
		s := newStore(t)
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
	})

	t.Run("metrics query filters by label", func(t *testing.T) {
		s := newStore(t)
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
	})

	t.Run("metrics query since excludes older points", func(t *testing.T) {
		s := newStore(t)
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
	})

	t.Run("metrics query with no name filter scans every name", func(t *testing.T) {
		s := newStore(t)
		ctx := context.Background()
		now := time.Now()

		_ = s.WriteMetrics(ctx, []model.Metric{
			{Name: "a", Value: 1, Timestamp: now},
			{Name: "b", Value: 2, Timestamp: now},
		})

		got, err := s.QueryMetrics(ctx, MetricQuery{})
		if err != nil {
			t.Fatalf("QueryMetrics: %v", err)
		}
		if len(got) != 2 {
			t.Fatalf("QueryMetrics with no filter = %+v, want both metrics", got)
		}
	})

	t.Run("spans write-then-query filters by service", func(t *testing.T) {
		s := newStore(t)
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
	})

	t.Run("spans query filters by trace ID across services", func(t *testing.T) {
		s := newStore(t)
		ctx := context.Background()
		now := time.Now()

		_ = s.WriteSpans(ctx, []model.Span{
			{TraceID: "t1", SpanID: "s1", Service: "checkout", Start: now},
			{TraceID: "t1", SpanID: "s2", Service: "payments", Start: now},
			{TraceID: "t2", SpanID: "s3", Service: "checkout", Start: now},
		})

		got, err := s.QuerySpans(ctx, SpanQuery{TraceID: "t1"})
		if err != nil {
			t.Fatalf("QuerySpans: %v", err)
		}
		if len(got) != 2 {
			t.Fatalf("QuerySpans with TraceID filter = %+v, want the 2 spans of trace t1 across services", got)
		}
	})

	t.Run("logs write-then-query filters by source and severity", func(t *testing.T) {
		s := newStore(t)
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
	})

	t.Run("logs query since excludes older entries", func(t *testing.T) {
		s := newStore(t)
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
	})
}
