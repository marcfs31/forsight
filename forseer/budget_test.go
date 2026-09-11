package forseer

import "testing"

func TestEngine_BudgetBurnsAgainstOnePercentSLO(t *testing.T) {
	e := NewEngine()
	for i := 0; i < 99; i++ {
		e.ObserveLogs([]LogLine{{Message: "ok", Severity: "info", Source: "api"}})
	}
	e.ObserveLogs([]LogLine{{Message: "boom", Severity: "error", Source: "api"}})
	got := e.Budget()
	if got.Total != 100 || got.Errors != 1 {
		t.Fatalf("counts = %d/%d", got.Errors, got.Total)
	}
	// 1% errors against a 1% SLO → 100% consumed.
	if got.Consumed < 99 || got.Consumed > 100 {
		t.Fatalf("consumed = %v, want ~100", got.Consumed)
	}
}

func TestEngine_StoryUsesDangerToneForCritical(t *testing.T) {
	e := NewEngine()
	for i := 0; i < minSamples; i++ {
		e.ObserveMetrics([]Point{{Name: "host.cpu.percent", Value: 10}})
	}
	e.ObserveMetrics([]Point{{Name: "host.cpu.percent", Value: 90}})
	story := e.Story()
	if len(story) == 0 {
		t.Fatal("empty story")
	}
	found := false
	for _, ev := range story {
		if ev.Tone == "danger" || ev.Tone == "warning" {
			found = true
		}
	}
	if !found {
		t.Fatalf("no warning/danger event: %+v", story)
	}
}
