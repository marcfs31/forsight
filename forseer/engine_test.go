package forseer

import (
	"testing"
	"time"
)

func TestEngine_MergesMetricAndLogInsights(t *testing.T) {
	e := NewEngine()
	fixed := time.Date(2026, 9, 11, 12, 0, 0, 0, time.UTC)
	e.now = func() time.Time { return fixed }

	for i := 0; i < minSamples; i++ {
		e.ObserveMetrics([]Point{{Name: "host.cpu.percent", Value: 10}})
	}
	e.ObserveMetrics([]Point{{Name: "host.cpu.percent", Value: 90}})

	lines := make([]LogLine, burstMinCount)
	for i := range lines {
		lines[i] = LogLine{Timestamp: fixed, Source: "api", Severity: "error", Message: "boom"}
	}
	e.ObserveLogs(lines)

	got := e.Insights()
	kinds := map[string]bool{}
	for _, ins := range got {
		kinds[ins.Kind] = true
	}
	if !kinds[KindAnomaly] {
		t.Fatalf("missing anomaly: %+v", got)
	}
	if !kinds[KindLogBurst] {
		t.Fatalf("missing log burst: %+v", got)
	}
}

func TestEngine_CulpritRanksHotProcess(t *testing.T) {
	e := NewEngine()
	for i := 0; i < minSamples; i++ {
		e.ObserveMetrics([]Point{{Name: "host.cpu.percent", Value: 8}})
	}
	e.ObserveMetrics([]Point{
		{Name: "host.cpu.percent", Value: 95},
		{Name: "process.cpu.percent", Value: 80, Labels: map[string]string{"pid": "7", "name": "rogue"}},
		{Name: "process.cpu.percent", Value: 1, Labels: map[string]string{"pid": "1", "name": "idle"}},
	})
	found := false
	for _, ins := range e.Insights() {
		if ins.Kind == KindCulprit && ins.Source == "rogue" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected culprit insight for rogue: %+v", e.Insights())
	}
}

func TestEngine_SlowSpan(t *testing.T) {
	e := NewEngine()
	for i := 0; i < minSamples; i++ {
		e.ObserveSpans([]SpanSample{{Name: "GET /checkout", Service: "api", DurationMs: 20}})
	}
	e.ObserveSpans([]SpanSample{{Name: "GET /checkout", Service: "api", DurationMs: 400, TraceID: "abc", Status: "error"}})
	found := false
	for _, ins := range e.Insights() {
		if ins.Kind == KindSlowSpan {
			found = true
			if ins.Severity != SeverityCritical {
				t.Errorf("severity = %q, want critical (error status + huge z)", ins.Severity)
			}
		}
	}
	if !found {
		t.Fatalf("expected slow_span: %+v", e.Insights())
	}
}
