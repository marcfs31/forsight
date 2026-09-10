package store

import (
	"context"
	"sync"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

// DefaultMaxElements bounds how many metrics (and, separately, spans) a
// MemoryStore will hold. Age alone is not a bound: retention prunes by
// timestamp, and timestamps on ingested data come off the wire, so a remote
// writer choosing a far-future timestamp is otherwise never pruned at all.
// This cap is what makes the store's memory a function of the agent's
// configuration rather than of what somebody sends it.
//
// 2,000,000 metrics is roughly 200 MB at this struct's size and comfortably
// above what the built-in collectors produce in an hour, so a normal agent
// never reaches it.
const DefaultMaxElements = 2_000_000

// MemoryStore is an in-process, retention-bounded store — it powers the live
// dashboard on its own with no setup, and backs every write when no
// persistent store is configured. Bounded twice over: by age, so a burst of
// writes can't starve older-but-still-relevant points within the window, and
// by element count, so neither a burst nor a hostile timestamp can grow it
// without limit.
type MemoryStore struct {
	retention   time.Duration
	maxElements int
	now         func() time.Time

	mu      sync.RWMutex
	metrics []model.Metric
	spans   []model.Span
}

// NewMemoryStore builds a MemoryStore retaining data for the given window
// (e.g. 1h for the live dashboard).
func NewMemoryStore(retention time.Duration) *MemoryStore {
	return &MemoryStore{retention: retention, maxElements: DefaultMaxElements, now: time.Now}
}

// SetMaxElements overrides the per-collection element cap. A value <= 0
// restores the default rather than disabling the cap: an unbounded in-memory
// store is not an option this type offers.
func (s *MemoryStore) SetMaxElements(n int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if n <= 0 {
		n = DefaultMaxElements
	}
	s.maxElements = n
	s.pruneMetricsLocked()
	s.pruneSpansLocked()
}

func (s *MemoryStore) WriteMetrics(_ context.Context, metrics []model.Metric) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.metrics = append(s.metrics, metrics...)
	s.pruneMetricsLocked()
	return nil
}

func (s *MemoryStore) QueryMetrics(_ context.Context, q MetricQuery) ([]model.Metric, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]model.Metric, 0, len(s.metrics))
	for _, m := range s.metrics {
		if !matchesMetric(m, q) {
			continue
		}
		out = append(out, m)
	}
	return out, nil
}

func (s *MemoryStore) WriteSpans(_ context.Context, spans []model.Span) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.spans = append(s.spans, spans...)
	s.pruneSpansLocked()
	return nil
}

func (s *MemoryStore) QuerySpans(_ context.Context, q SpanQuery) ([]model.Span, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]model.Span, 0, len(s.spans))
	for _, sp := range s.spans {
		if !matchesSpan(sp, q) {
			continue
		}
		out = append(out, sp)
	}
	return out, nil
}

// pruneMetricsLocked drops points older than the retention window. Callers
// must hold s.mu for writing.
func (s *MemoryStore) pruneMetricsLocked() {
	cutoff := s.now().Add(-s.retention)
	kept := s.metrics[:0]
	for _, m := range s.metrics {
		if m.Timestamp.After(cutoff) {
			kept = append(kept, m)
		}
	}
	s.metrics = capOldest(kept, s.maxElements)
}

// capOldest keeps the newest max elements, dropping from the front. Writes
// arrive in roughly chronological order, so the front is the oldest data —
// and when it is not (a hostile or clock-skewed writer), dropping the front
// is still the right call, because that is the data the caller inserted
// earliest and the alternative is unbounded growth.
func capOldest[T any](xs []T, max int) []T {
	if max <= 0 || len(xs) <= max {
		return xs
	}
	return append(xs[:0], xs[len(xs)-max:]...)
}

func (s *MemoryStore) pruneSpansLocked() {
	cutoff := s.now().Add(-s.retention)
	kept := s.spans[:0]
	for _, sp := range s.spans {
		if sp.Start.After(cutoff) {
			kept = append(kept, sp)
		}
	}
	s.spans = capOldest(kept, s.maxElements)
}

func matchesMetric(m model.Metric, q MetricQuery) bool {
	if q.Name != "" && m.Name != q.Name {
		return false
	}
	if !q.Since.IsZero() && m.Timestamp.Before(q.Since) {
		return false
	}
	for k, v := range q.Labels {
		if m.Labels[k] != v {
			return false
		}
	}
	return true
}

func matchesSpan(sp model.Span, q SpanQuery) bool {
	if q.Service != "" && sp.Service != q.Service {
		return false
	}
	if q.TraceID != "" && sp.TraceID != q.TraceID {
		return false
	}
	if !q.Since.IsZero() && sp.Start.Before(q.Since) {
		return false
	}
	return true
}
