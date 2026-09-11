// Package store defines the Store interface forsight's API queries and its
// collectors/receivers write to, plus a MemoryStore implementation. A
// Badger-backed persistent implementation (Store is the seam for it) is
// tracked in forsight/README.md's roadmap, not built yet.
package store

import (
	"context"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

// MetricQuery filters a metrics read. A zero value matches everything within
// the store's retention window — there is no query language in v1 (see the
// README's scope note), just time range + exact label match.
type MetricQuery struct {
	Name   string            // exact match; empty matches any name
	Labels map[string]string // every pair must match (AND); nil matches any
	Since  time.Time         // zero value means "from the oldest retained point"
}

// SpanQuery filters a spans read, analogous to MetricQuery.
type SpanQuery struct {
	Service string
	TraceID string
	Since   time.Time
}

// LogQuery filters a logs read, analogous to SpanQuery.
type LogQuery struct {
	Since    time.Time
	Severity model.LogSeverity // empty matches any severity
	Source   string            // exact match; empty matches any source
}

// Store is the read/write surface the API and collectors/receivers use —
// metrics, spans, and log entries from the OTLP receiver and built-in
// collectors.
type Store interface {
	WriteMetrics(ctx context.Context, metrics []model.Metric) error
	QueryMetrics(ctx context.Context, q MetricQuery) ([]model.Metric, error)

	WriteSpans(ctx context.Context, spans []model.Span) error
	QuerySpans(ctx context.Context, q SpanQuery) ([]model.Span, error)

	WriteLogs(ctx context.Context, logs []model.LogEntry) error
	QueryLogs(ctx context.Context, q LogQuery) ([]model.LogEntry, error)
}
