package forseer

import (
	"fmt"
	"math"
	"sort"
	"strings"
	"sync"
	"time"
)

const (
	minSamples    = 12
	warningSigma  = 3
	criticalSigma = 5
	insightTTL    = 10 * time.Minute
	maxSeries     = 512
	cusumK        = 0.5
	cusumH        = 5
)

// Detector watches a stream of metric points and opens/closes insights
// using Welford's online mean/variance plus a CUSUM changepoint. No model
// file, no API key.
type Detector struct {
	mu     sync.Mutex
	series map[string]*rolling
	open   map[string]Insight
	now    func() time.Time
}

type rolling struct {
	n     int
	mean  float64
	m2    float64
	cusum float64
}

// NewDetector builds an empty detector.
func NewDetector() *Detector {
	return &Detector{
		series: make(map[string]*rolling),
		open:   make(map[string]Insight),
		now:    time.Now,
	}
}

// Observe records points and updates the active insight set.
func (d *Detector) Observe(points []Point) {
	if len(points) == 0 {
		return
	}
	now := d.now()
	d.mu.Lock()
	defer d.mu.Unlock()
	d.expireLocked(now)
	for _, p := range points {
		d.observeOneLocked(p, now)
	}
}

func (d *Detector) observeOneLocked(p Point, now time.Time) {
	key := seriesKey(p.Name, p.Labels)
	s := d.series[key]
	if s == nil {
		if len(d.series) >= maxSeries {
			return
		}
		s = &rolling{}
		d.series[key] = s
	}
	s.n++
	delta := p.Value - s.mean
	s.mean += delta / float64(s.n)
	s.m2 += delta * (p.Value - s.mean)
	if s.n < minSamples {
		return
	}
	variance := s.m2 / float64(s.n-1)
	if variance <= 0 {
		delete(d.open, key)
		s.cusum = 0
		return
	}
	sigma := math.Sqrt(variance)
	if sigma == 0 {
		delete(d.open, key)
		s.cusum = 0
		return
	}
	z := math.Abs(p.Value-s.mean) / sigma
	switch {
	case z >= criticalSigma:
		d.open[key] = insight(key, KindAnomaly, p, z, SeverityCritical, now)
	case z >= warningSigma:
		d.open[key] = insight(key, KindAnomaly, p, z, SeverityWarning, now)
	default:
		if existing, ok := d.open[key]; ok && existing.Kind == KindAnomaly {
			delete(d.open, key)
		}
	}

	s.cusum = math.Max(0, s.cusum+z-cusumK)
	cpKey := key + "|cusum"
	if s.cusum >= cusumH {
		d.open[cpKey] = Insight{
			ID:          cpKey,
			Kind:        KindChangepoint,
			Severity:    SeverityWarning,
			Title:       fmt.Sprintf("%s changed regime", p.Name),
			Description: fmt.Sprintf("CUSUM reached %.1f (value %.4g vs rolling mean %.4g)", s.cusum, p.Value, s.mean),
			Source:      "forseer",
			Metric:      p.Name,
			Value:       p.Value,
			Time:        now,
		}
		s.cusum = 0
	}
}

func insight(key, kind string, p Point, z float64, sev string, now time.Time) Insight {
	return Insight{
		ID:       key,
		Kind:     kind,
		Severity: sev,
		Title:    fmt.Sprintf("%s is %.1fσ from its baseline", p.Name, z),
		Description: fmt.Sprintf(
			"value %.4g vs rolling mean; %s",
			p.Value, sev,
		),
		Source: "forseer",
		Metric: p.Name,
		Value:  p.Value,
		Time:   now,
	}
}

func (d *Detector) expireLocked(now time.Time) {
	for k, ins := range d.open {
		if now.Sub(ins.Time) > insightTTL {
			delete(d.open, k)
		}
	}
}

// Insights returns a copy of the currently open findings, critical first.
func (d *Detector) Insights() []Insight {
	d.mu.Lock()
	defer d.mu.Unlock()
	out := make([]Insight, 0, len(d.open))
	now := d.now()
	d.expireLocked(now)
	for _, ins := range d.open {
		out = append(out, ins)
	}
	sortInsights(out)
	return out
}

func sortInsights(out []Insight) {
	sort.Slice(out, func(i, j int) bool {
		rank := func(s string) int {
			switch s {
			case SeverityCritical:
				return 0
			case SeverityWarning:
				return 1
			default:
				return 2
			}
		}
		ri, rj := rank(out[i].Severity), rank(out[j].Severity)
		if ri != rj {
			return ri < rj
		}
		return out[i].Time.After(out[j].Time)
	})
}

func seriesKey(name string, labels map[string]string) string {
	if len(labels) == 0 {
		return name
	}
	keys := make([]string, 0, len(labels))
	for k := range labels {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var b strings.Builder
	b.WriteString(name)
	for _, k := range keys {
		b.WriteByte(',')
		b.WriteString(k)
		b.WriteByte('=')
		b.WriteString(labels[k])
	}
	return b.String()
}
