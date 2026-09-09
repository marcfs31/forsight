package host

import (
	"context"
	"testing"
)

func TestCollect_ReturnsPlausibleHostMetrics(t *testing.T) {
	c := New()
	metrics, err := c.Collect(context.Background())
	if err != nil {
		t.Fatalf("Collect returned an error: %v", err)
	}
	if len(metrics) == 0 {
		t.Fatal("Collect returned no metrics")
	}

	byName := make(map[string]float64)
	for _, m := range metrics {
		byName[m.Name] = m.Value
		if m.Timestamp.IsZero() {
			t.Errorf("metric %q has a zero Timestamp", m.Name)
		}
	}

	if v, ok := byName["host.cpu.percent"]; ok && (v < 0 || v > 100) {
		t.Errorf("host.cpu.percent = %v, want within [0, 100]", v)
	}
	if v, ok := byName["host.memory.percent"]; ok && (v < 0 || v > 100) {
		t.Errorf("host.memory.percent = %v, want within [0, 100]", v)
	}
	if v, ok := byName["host.memory.used_bytes"]; ok && v <= 0 {
		t.Errorf("host.memory.used_bytes = %v, want > 0", v)
	}
}

func TestName(t *testing.T) {
	if got := New().Name(); got != "host" {
		t.Errorf("Name() = %q, want %q", got, "host")
	}
}
