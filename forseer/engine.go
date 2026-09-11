package forseer

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

// Engine is the Forseer surface the agent talks to. It composes the
// statistical detectors (metrics, logs, traces) so a single `forsight run`
// produces insights without a sidecar process.
type Engine struct {
	det   *Detector
	logs  *logMiner
	spans *spanWatch

	mu        sync.Mutex
	processes map[string]procSnap
	culprits  map[string]Insight
	now       func() time.Time
	errorSLO  float64
}

type procSnap struct {
	name     string
	cpu      float64
	rss      float64
	lastSeen time.Time
}

// NewEngine builds a live engine. Statistical detection is always on;
// Grok summary is a separate call that needs XAI_API_KEY.
func NewEngine() *Engine {
	now := time.Now
	e := &Engine{
		det:       NewDetector(),
		logs:      newLogMiner(),
		spans:     newSpanWatch(),
		processes: make(map[string]procSnap),
		culprits:  make(map[string]Insight),
		now:       now,
		errorSLO:  defaultErrorSLO,
	}
	e.det.now = func() time.Time { return e.now() }
	e.logs.now = func() time.Time { return e.now() }
	e.spans.now = func() time.Time { return e.now() }
	return e
}

// ObserveMetrics feeds host/process/Docker/OTLP/scrape/StatsD points.
func (e *Engine) ObserveMetrics(points []Point) {
	e.det.Observe(points)
	e.trackProcesses(points)
}

// ObserveLogs feeds OTLP (and later file-tail) log lines into the miner.
func (e *Engine) ObserveLogs(lines []LogLine) {
	e.logs.Observe(lines)
}

// ObserveSpans feeds OTLP spans into the slow-span watcher.
func (e *Engine) ObserveSpans(spans []SpanSample) {
	e.spans.Observe(spans)
}

func (e *Engine) trackProcesses(points []Point) {
	now := e.now()
	e.mu.Lock()
	defer e.mu.Unlock()
	for k, ins := range e.culprits {
		if now.Sub(ins.Time) > insightTTL {
			delete(e.culprits, k)
		}
	}
	// processes is keyed by whatever "pid" label arrives on a metric point —
	// for OTLP-sourced points that is an attacker-controlled resource
	// attribute copied verbatim by the receiver, with no cardinality
	// filtering upstream. Unlike culprits (open insights), nothing evicted
	// entries here, so this map grew without bound. Sweep it the same way,
	// on the same tick, using each pid's last-observed time rather than an
	// insight's Time: a busy but legitimate process should not be evicted
	// just because it never triggers a culprit ranking.
	for pid, snap := range e.processes {
		if now.Sub(snap.lastSeen) > insightTTL {
			delete(e.processes, pid)
		}
	}
	for _, p := range points {
		pid := ""
		if p.Labels != nil {
			pid = p.Labels["pid"]
		}
		if pid == "" {
			continue
		}
		snap := e.processes[pid]
		if p.Labels["name"] != "" {
			snap.name = p.Labels["name"]
		}
		switch p.Name {
		case "process.cpu.percent":
			snap.cpu = p.Value
		case "process.memory.rss_bytes":
			snap.rss = p.Value
		}
		snap.lastSeen = now
		e.processes[pid] = snap
	}

	hostHot := false
	for _, ins := range e.det.Insights() {
		if ins.Metric == "host.cpu.percent" && ins.Kind == KindAnomaly {
			hostHot = true
			break
		}
	}
	if !hostHot {
		return
	}
	type ranked struct {
		pid  string
		snap procSnap
	}
	top := make([]ranked, 0, len(e.processes))
	for pid, snap := range e.processes {
		if snap.cpu <= 0 {
			continue
		}
		top = append(top, ranked{pid, snap})
	}
	sort.Slice(top, func(i, j int) bool { return top[i].snap.cpu > top[j].snap.cpu })
	if len(top) > 3 {
		top = top[:3]
	}
	for _, r := range top {
		if r.snap.cpu < 20 {
			continue
		}
		related := []string{r.snap.name, "pid=" + r.pid}
		e.culprits[r.pid] = Insight{
			ID:          "culprit:" + r.pid,
			Kind:        KindCulprit,
			Severity:    SeverityWarning,
			Title:       fmt.Sprintf("%s is using %.0f%% CPU while the host is anomalous", r.snap.name, r.snap.cpu),
			Description: "process ranked as a likely contributor to the host CPU spike",
			Source:      r.snap.name,
			Metric:      "process.cpu.percent",
			Value:       r.snap.cpu,
			Time:        now,
			Related:     related,
		}
	}
}

// Insights merges every detector, critical first.
func (e *Engine) Insights() []Insight {
	out := e.det.Insights()
	out = append(out, e.logs.Insights()...)
	out = append(out, e.spans.Insights()...)
	e.mu.Lock()
	now := e.now()
	for k, ins := range e.culprits {
		if now.Sub(ins.Time) > insightTTL {
			delete(e.culprits, k)
			continue
		}
		out = append(out, ins)
	}
	e.mu.Unlock()
	sortInsights(out)
	return out
}

// Clusters returns Drain-style log templates, busiest first.
func (e *Engine) Clusters() []Cluster {
	return e.logs.Clusters()
}

const defaultErrorSLO = 0.01 // 1% error logs

// SetErrorSLO overrides the error-log SLO Budget burns against (default 1%,
// see defaultErrorSLO — e.g. `forsight run --error-slo 0.02` for 2%). A
// non-positive value is ignored, leaving the current SLO in effect.
func (e *Engine) SetErrorSLO(slo float64) {
	if slo <= 0 {
		return
	}
	e.mu.Lock()
	e.errorSLO = slo
	e.mu.Unlock()
}

// Budget is the error-log burn against the configured SLO (1% by default),
// for ErrorBudget. The SLO itself is always reported on Budget.SLO so a
// caller — the dashboard included — never has to parse it back out of
// Caption, which is absent before any logs have landed.
func (e *Engine) Budget() Budget {
	e.mu.Lock()
	slo := e.errorSLO
	e.mu.Unlock()

	errors, total := e.logs.counts()
	consumed := 0.0
	if total > 0 && slo > 0 {
		rate := float64(errors) / float64(total)
		consumed = rate / slo * 100
		if consumed > 100 {
			consumed = 100
		}
	}
	caption := "no logs yet"
	if total > 0 {
		caption = fmt.Sprintf("%d errors in %d lines · SLO %.0f%% error logs", errors, total, slo*100)
	}
	return Budget{
		Label:     "Error-log budget",
		Consumed:  consumed,
		Caption:   caption,
		Errors:    errors,
		Total:     total,
		SLO:       slo,
		WarningAt: 70,
		DangerAt:  90,
	}
}

// Story stitches insights into Timeline events, critical-path related names included.
func (e *Engine) Story() []Event {
	insights := e.Insights()
	out := make([]Event, 0, len(insights))
	for _, ins := range insights {
		tone := "accent"
		switch ins.Severity {
		case SeverityCritical:
			tone = "danger"
		case SeverityWarning:
			tone = "warning"
		}
		desc := ins.Kind
		if len(ins.Related) > 0 {
			desc = ins.Kind + " · " + strings.Join(ins.Related, " → ")
		}
		out = append(out, Event{
			ID:          "evt-" + ins.ID,
			Time:        ins.Time,
			Title:       ins.Title,
			Description: desc,
			Tone:        tone,
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Time.After(out[j].Time) })
	return out
}
