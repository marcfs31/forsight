package store

import (
	"context"
	"sync"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

// MemoryStore is an in-process, retention-bounded store — it powers the live
// dashboard on its own with no setup, and backs every write when no
// persistent store is configured. Pruned by age, not by count, so a burst of
// writes can't starve older-but-still-relevant points within the window.
type MemoryStore struct {
	retention time.Duration
	now       func() time.Time

	mu      sync.RWMutex
	metrics []model.Metric
	spans   []model.Span
}

// NewMemoryStore builds a MemoryStore retaining data for the given window
// (e.g. 1h for the live dashboard).
func NewMemoryStore(retention time.Duration) *MemoryStore {
	return &MemoryStore{retention: retention, now: time.Now}
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
	s.metrics = kept
}

func (s *MemoryStore) pruneSpansLocked() {
	cutoff := s.now().Add(-s.retention)
	kept := s.spans[:0]
	for _, sp := range s.spans {
		if sp.Start.After(cutoff) {
			kept = append(kept, sp)
		}
	}
	s.spans = kept
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
