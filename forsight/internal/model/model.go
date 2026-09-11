// Package model defines the data shapes shared across collectors, storage,
// and the API — the one place a "metric" or "span" is defined, so collector
// and store implementations never invent their own competing shape.
package model

import "time"

// Metric is a single timestamped numeric measurement.
type Metric struct {
	Name      string            `json:"name"`
	Value     float64           `json:"value"`
	Timestamp time.Time         `json:"timestamp"`
	Labels    map[string]string `json:"labels,omitempty"`
}

// SpanStatus mirrors the three OTLP span status codes forsight actually
// distinguishes; OTLP's numeric codes are translated to this at the receiver
// boundary so nothing downstream needs to know the wire format.
type SpanStatus string

const (
	SpanStatusUnset SpanStatus = "unset"
	SpanStatusOK    SpanStatus = "ok"
	SpanStatusError SpanStatus = "error"
)

// Span is one unit of work in a distributed trace.
type Span struct {
	TraceID    string            `json:"traceId"`
	SpanID     string            `json:"spanId"`
	ParentID   string            `json:"parentId,omitempty"`
	Name       string            `json:"name"`
	Service    string            `json:"service"`
	Start      time.Time         `json:"start"`
	Duration   time.Duration     `json:"duration"`
	Status     SpanStatus        `json:"status"`
	Attributes map[string]string `json:"attributes,omitempty"`
}

// LogSeverity is a coarse level, independent of any single logging library's
// vocabulary — collectors/receivers map their own levels onto this.
type LogSeverity string

const (
	LogSeverityDebug LogSeverity = "debug"
	LogSeverityInfo  LogSeverity = "info"
	LogSeverityWarn  LogSeverity = "warn"
	LogSeverityError LogSeverity = "error"
)

// LogEntry is one log line, tagged with its source. Produced today by the
// OTLP/HTTP logs receiver; file-tail / pattern extraction remains roadmap
// (see forsight/README.md).
type LogEntry struct {
	Timestamp time.Time         `json:"timestamp"`
	Severity  LogSeverity       `json:"severity"`
	Source    string            `json:"source"`
	Message   string            `json:"message"`
	Labels    map[string]string `json:"labels,omitempty"`
	// SeverityInferred is true when nothing in the source declared a level
	// and the agent worked one out from the text — a tailed file, today.
	// Forseer's severity model trains only on declared levels, so this flag
	// is what stops it learning from its own guesses.
	SeverityInferred bool `json:"severityInferred,omitempty"`
}
