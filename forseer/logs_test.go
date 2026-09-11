package forseer

import (
	"strings"
	"testing"
	"time"
)

func TestTemplateOf_StripsIDsAndNumbers(t *testing.T) {
	got := templateOf("request 550e8400-e29b-41d4-a716-446655440000 from 10.0.0.4 took 12.4ms")
	if !strings.Contains(got, "<*>") {
		t.Fatalf("expected placeholders, got %q", got)
	}
	if strings.Contains(got, "10.0.0.4") || strings.Contains(got, "550e8400") {
		t.Fatalf("identifiers leaked into template: %q", got)
	}
}

func TestLogMiner_ClustersSameTemplate(t *testing.T) {
	m := newLogMiner()
	m.Observe([]LogLine{
		{Message: "user 1 login failed", Source: "api", Severity: "error"},
		{Message: "user 99 login failed", Source: "api", Severity: "error"},
		{Message: "user 7 login failed", Source: "api", Severity: "warn"},
	})
	got := m.Clusters()
	if len(got) != 1 {
		t.Fatalf("got %d clusters, want 1: %+v", len(got), got)
	}
	if got[0].Count != 3 {
		t.Errorf("count = %d, want 3", got[0].Count)
	}
	if got[0].ErrorCount != 2 {
		t.Errorf("errorCount = %d, want 2", got[0].ErrorCount)
	}
}

func TestLogMiner_BurstOpensInsight(t *testing.T) {
	m := newLogMiner()
	fixed := time.Date(2026, 9, 11, 12, 0, 0, 0, time.UTC)
	m.now = func() time.Time { return fixed }
	lines := make([]LogLine, 0, burstMinCount)
	for i := 0; i < burstMinCount; i++ {
		lines = append(lines, LogLine{
			Timestamp: fixed,
			Source:    "api",
			Severity:  "error",
			Message:   "timeout talking to payments",
		})
	}
	m.Observe(lines)
	got := m.Insights()
	if len(got) != 1 {
		t.Fatalf("got %d insights, want 1: %+v", len(got), got)
	}
	if got[0].Kind != KindLogBurst {
		t.Errorf("kind = %q, want %s", got[0].Kind, KindLogBurst)
	}
}
