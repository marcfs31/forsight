package docker

import (
	"context"
	"testing"
	"time"

	"github.com/moby/moby/api/types/container"
)

func TestCPUPercent(t *testing.T) {
	tests := []struct {
		name     string
		current  cpuSample
		previous cpuSample
		want     float64
	}{
		{
			name:     "typical delta",
			current:  cpuSample{totalUsage: 2_000_000_000, systemUsage: 10_000_000_000, onlineCPUs: 4},
			previous: cpuSample{totalUsage: 1_000_000_000, systemUsage: 8_000_000_000},
			// (1e9 / 2e9) * 4 * 100 = 200
			want: 200,
		},
		{
			name: "zero system delta never divides by zero",
			want: 0,
		},
		{
			name:     "negative cpu delta (clock skew) reads as zero, not negative",
			current:  cpuSample{totalUsage: 1, systemUsage: 100},
			previous: cpuSample{totalUsage: 5, systemUsage: 50},
			want:     0,
		},
		{
			name:     "falls back to 1 online CPU when unset",
			current:  cpuSample{totalUsage: 2_000_000_000, systemUsage: 10_000_000_000},
			previous: cpuSample{totalUsage: 1_000_000_000, systemUsage: 8_000_000_000},
			// (1e9 / 2e9) * 1 * 100 = 50
			want: 50,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := cpuPercent(tt.current, tt.previous); got != tt.want {
				t.Errorf("cpuPercent() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestOnlineCPUs(t *testing.T) {
	tests := []struct {
		name  string
		stats container.StatsResponse
		want  uint32
	}{
		{
			name:  "uses OnlineCPUs when set",
			stats: container.StatsResponse{CPUStats: container.CPUStats{OnlineCPUs: 4}},
			want:  4,
		},
		{
			name: "falls back to len(PercpuUsage) when unset",
			stats: container.StatsResponse{
				CPUStats: container.CPUStats{CPUUsage: container.CPUUsage{PercpuUsage: []uint64{0, 0, 0}}},
			},
			want: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := onlineCPUs(tt.stats); got != tt.want {
				t.Errorf("onlineCPUs() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestMemoryPercent(t *testing.T) {
	tests := []struct {
		name  string
		stats container.StatsResponse
		want  float64
	}{
		{
			name:  "typical usage",
			stats: container.StatsResponse{MemoryStats: container.MemoryStats{Usage: 50, Limit: 200}},
			want:  25,
		},
		{
			name:  "zero limit never divides by zero",
			stats: container.StatsResponse{MemoryStats: container.MemoryStats{Usage: 50, Limit: 0}},
			want:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := memoryPercent(tt.stats); got != tt.want {
				t.Errorf("memoryPercent() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestContainerName(t *testing.T) {
	if got := containerName(container.Summary{Names: []string{"/web-1"}}); got != "web-1" {
		t.Errorf("containerName with leading slash = %q, want %q", got, "web-1")
	}
	if got := containerName(container.Summary{ID: "abcdef0123456789"}); got != "abcdef012345" {
		t.Errorf("containerName fallback to short ID = %q, want %q", got, "abcdef012345")
	}
}

// TestCollect_AgainstRealDaemon exercises New/Collect against whatever Docker
// daemon is reachable on this machine. It skips (not fails) when none is
// available — Docker isn't a build requirement for botobs, only an optional
// collector — per this package's own doc comment on graceful unavailability.
func TestCollect_AgainstRealDaemon(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	c, err := New(ctx)
	if err != nil {
		t.Skipf("no Docker daemon reachable, skipping: %v", err)
	}
	if got := c.Name(); got != "docker" {
		t.Errorf("Name() = %q, want %q", got, "docker")
	}

	// The first tick never emits docker.cpu.percent (no previous sample to
	// diff against yet) — only memory's two metrics per running container.
	first, err := c.Collect(ctx)
	if err != nil {
		t.Fatalf("Collect (first tick): %v", err)
	}
	if len(first)%2 != 0 {
		t.Errorf("first tick: got %d metrics, want a multiple of 2 (memory-percent/memory-bytes per container)", len(first))
	}

	// The second tick has a previous sample for every still-running
	// container, so cpu.percent joins the other two metrics.
	second, err := c.Collect(ctx)
	if err != nil {
		t.Fatalf("Collect (second tick): %v", err)
	}
	if len(second)%3 != 0 {
		t.Errorf("second tick: got %d metrics, want a multiple of 3 (cpu/mem-percent/mem-bytes per container)", len(second))
	}
}
