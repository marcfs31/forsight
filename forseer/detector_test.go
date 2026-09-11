package forseer

import (
	"testing"
	"time"
)

func TestDetector_OpensWarningOnThreeSigmaSpike(t *testing.T) {
	d := NewDetector()
	fixed := time.Date(2026, 9, 11, 12, 0, 0, 0, time.UTC)
	d.now = func() time.Time { return fixed }

	for i := 0; i < minSamples; i++ {
		d.Observe([]Point{{Name: "host.cpu.percent", Value: 10}})
	}
	if got := d.Insights(); len(got) != 0 {
		t.Fatalf("baseline produced insights: %+v", got)
	}

	d.Observe([]Point{{Name: "host.cpu.percent", Value: 80}})
	got := d.Insights()
	if len(got) == 0 {
		t.Fatal("expected at least one insight on the spike")
	}
	found := false
	for _, ins := range got {
		if ins.Kind == KindAnomaly && ins.Metric == "host.cpu.percent" {
			found = true
			if ins.Severity != SeverityWarning && ins.Severity != SeverityCritical {
				t.Errorf("severity = %q, want warning or critical", ins.Severity)
			}
			if ins.Source != "forseer" {
				t.Errorf("source = %q, want forseer", ins.Source)
			}
		}
	}
	if !found {
		t.Fatalf("no anomaly insight: %+v", got)
	}
}

func TestDetector_ClearsWhenValueReturnsToBaseline(t *testing.T) {
	d := NewDetector()
	for i := 0; i < minSamples; i++ {
		d.Observe([]Point{{Name: "host.memory.percent", Value: 20}})
	}
	d.Observe([]Point{{Name: "host.memory.percent", Value: 90}})
	if len(d.Insights()) == 0 {
		t.Fatal("expected an insight on the spike")
	}
	for i := 0; i < minSamples; i++ {
		d.Observe([]Point{{Name: "host.memory.percent", Value: 20}})
	}
	for _, ins := range d.Insights() {
		if ins.Kind == KindAnomaly {
			t.Fatalf("anomaly still open after return to baseline: %+v", ins)
		}
	}
}

func TestDetector_EmitsChangepointOnSustainedShift(t *testing.T) {
	d := NewDetector()
	for i := 0; i < minSamples; i++ {
		d.Observe([]Point{{Name: "host.disk.percent", Value: 10}})
	}
	for i := 0; i < 20; i++ {
		d.Observe([]Point{{Name: "host.disk.percent", Value: 80}})
	}
	found := false
	for _, ins := range d.Insights() {
		if ins.Kind == KindChangepoint {
			found = true
		}
	}
	if !found {
		t.Fatal("expected a CUSUM changepoint after a sustained shift")
	}
}

func TestSeasonalKey_HourSplitsHostNotProcess(t *testing.T) {
	day := seasonalKey("host.cpu.percent", nil, 15)
	night := seasonalKey("host.cpu.percent", nil, 3)
	if day == night {
		t.Fatal("hour of day should split host series")
	}
	a := seasonalKey("process.cpu.percent", map[string]string{"pid": "7"}, 3)
	b := seasonalKey("process.cpu.percent", map[string]string{"pid": "7"}, 15)
	if a != b {
		t.Fatal("process series should not be hour-split")
	}
}

func TestSeriesKey_IncludesSortedLabels(t *testing.T) {
	a := seriesKey("docker.cpu.percent", map[string]string{"container_name": "web", "container_id": "abc"})
	b := seriesKey("docker.cpu.percent", map[string]string{"container_id": "abc", "container_name": "web"})
	if a != b {
		t.Fatalf("label order changed the key:\n%s\n%s", a, b)
	}
	c := seriesKey("docker.cpu.percent", map[string]string{"container_id": "def", "container_name": "web"})
	if a == c {
		t.Fatal("different container_id produced the same key")
	}
}
