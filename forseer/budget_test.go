package forseer

import (
	"encoding/json"
	"testing"
)

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

// TestEngine_BudgetSLOSerializes guards the wire shape the dashboard reads:
// the frontend's ForseerBudget type was missing an `slo` field even though
// Budget always sets one, so it was silently dropped despite the backend
// sending it. This pins both the Go value and the JSON key it marshals to.
func TestEngine_BudgetSLOSerializes(t *testing.T) {
	e := NewEngine()
	got := e.Budget()
	if got.SLO != defaultErrorSLO {
		t.Fatalf("SLO = %v, want default %v", got.SLO, defaultErrorSLO)
	}

	raw, err := json.Marshal(got)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}
	var decoded map[string]any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if v, ok := decoded["slo"]; !ok {
		t.Fatalf("json output missing \"slo\" field: %s", raw)
	} else if v.(float64) != defaultErrorSLO {
		t.Fatalf("json \"slo\" = %v, want %v", v, defaultErrorSLO)
	}
}

func TestEngine_SetErrorSLOOverridesTheDefault(t *testing.T) {
	e := NewEngine()
	e.SetErrorSLO(0.05)
	if got := e.Budget().SLO; got != 0.05 {
		t.Fatalf("SLO = %v, want 0.05 after SetErrorSLO", got)
	}

	// Non-positive overrides are ignored, leaving the previous value in effect.
	e.SetErrorSLO(0)
	e.SetErrorSLO(-1)
	if got := e.Budget().SLO; got != 0.05 {
		t.Fatalf("SLO = %v, want unchanged 0.05 after ignoring non-positive overrides", got)
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
