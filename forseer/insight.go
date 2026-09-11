package forseer

import "time"

// Severity of an insight. Matches the design-system AlertList vocabulary so
// the dashboard can render these without a translation layer.
const (
	SeverityInfo     = "info"
	SeverityWarning  = "warning"
	SeverityCritical = "critical"
)

// Kind names the detector that produced an insight. The dashboard maps these
// onto specific design-system components (see README).
const (
	KindAnomaly     = "anomaly"     // AlertList — rolling z-score
	KindChangepoint = "changepoint" // Timeline — CUSUM regime shift
	KindLogBurst    = "log_burst"   // BarList + LogStream — template volume spike
	KindSlowSpan    = "slow_span"   // TraceWaterfall — duration outlier
	KindCulprit     = "culprit"     // Table — process that jumped with host CPU
)

// Insight is one Forseer finding. The agent serves these at GET /api/v1/forseer/insights.
type Insight struct {
	ID          string    `json:"id"`
	Kind        string    `json:"kind"`
	Severity    string    `json:"severity"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Source      string    `json:"source"`
	Metric      string    `json:"metric,omitempty"`
	Value       float64   `json:"value,omitempty"`
	Time        time.Time `json:"time"`
	Related     []string  `json:"related,omitempty"`
}

// Cluster is one Drain-style log template. GET /api/v1/forseer/clusters.
type Cluster struct {
	ID         string    `json:"id"`
	Template   string    `json:"template"`
	Source     string    `json:"source"`
	Count      int       `json:"count"`
	ErrorCount int       `json:"errorCount"`
	LastSeen   time.Time `json:"lastSeen"`
	Sample     string    `json:"sample"`
}

// Point is the tiny metric shape Forseer needs. Defined here so this module
// does not import the agent's internal/model (the agent depends on Forseer,
// not the other way around).
type Point struct {
	Name   string
	Value  float64
	Labels map[string]string
}

// LogLine is one ingested log, stripped to what the miner needs.
type LogLine struct {
	Timestamp time.Time
	Severity  string
	Source    string
	Message   string
}

// SpanSample is one ingested span, stripped to what the slow-span watcher needs.
type SpanSample struct {
	Name       string
	Service    string
	DurationMs float64
	Status     string
	TraceID    string
}
