package forseer

import (
	"fmt"
	"math"
	"sync"
	"time"
)

const maxSpanSeries = 256

type spanWatch struct {
	mu     sync.Mutex
	series map[string]*rolling
	open   map[string]Insight
	now    func() time.Time
}

func newSpanWatch() *spanWatch {
	return &spanWatch{
		series: make(map[string]*rolling),
		open:   make(map[string]Insight),
		now:    time.Now,
	}
}

func (w *spanWatch) Observe(spans []SpanSample) {
	if len(spans) == 0 {
		return
	}
	now := w.now()
	w.mu.Lock()
	defer w.mu.Unlock()
	for k, ins := range w.open {
		if now.Sub(ins.Time) > insightTTL {
			delete(w.open, k)
		}
	}
	for _, sp := range spans {
		w.observeOneLocked(sp, now)
	}
}

func (w *spanWatch) observeOneLocked(sp SpanSample, now time.Time) {
	key := sp.Service + "|" + sp.Name
	s := w.series[key]
	if s == nil {
		if len(w.series) >= maxSpanSeries {
			return
		}
		s = &rolling{}
		w.series[key] = s
	}
	s.n++
	delta := sp.DurationMs - s.mean
	s.mean += delta / float64(s.n)
	s.m2 += delta * (sp.DurationMs - s.mean)
	if s.n < minSamples {
		return
	}
	variance := s.m2 / float64(s.n-1)
	if variance <= 0 {
		delete(w.open, key)
		return
	}
	sigma := math.Sqrt(variance)
	if sigma == 0 {
		delete(w.open, key)
		return
	}
	z := (sp.DurationMs - s.mean) / sigma
	if z < warningSigma {
		delete(w.open, key)
		return
	}
	sev := SeverityWarning
	if z >= criticalSigma || sp.Status == "error" {
		sev = SeverityCritical
	}
	related := []string{sp.Name}
	if sp.TraceID != "" {
		related = append(related, sp.TraceID)
	}
	w.open[key] = Insight{
		ID:          "span:" + key,
		Kind:        KindSlowSpan,
		Severity:    sev,
		Title:       fmt.Sprintf("%s is %.1fσ slower than its baseline", sp.Name, z),
		Description: fmt.Sprintf("%.0fms vs rolling mean %.0fms on %s", sp.DurationMs, s.mean, emptySource(sp.Service)),
		Source:      emptySource(sp.Service),
		Metric:      sp.Name,
		Value:       sp.DurationMs,
		Time:        now,
		Related:     related,
	}
}

func (w *spanWatch) Insights() []Insight {
	w.mu.Lock()
	defer w.mu.Unlock()
	now := w.now()
	for k, ins := range w.open {
		if now.Sub(ins.Time) > insightTTL {
			delete(w.open, k)
		}
	}
	out := make([]Insight, 0, len(w.open))
	for _, ins := range w.open {
		out = append(out, ins)
	}
	sortInsights(out)
	return out
}
