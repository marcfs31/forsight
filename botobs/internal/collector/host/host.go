// Package host collects system-level metrics via gopsutil — CPU, memory,
// disk, network, uptime. gopsutil itself honors the HOST_PROC/HOST_SYS/
// HOST_ETC env-var overrides (the same convention node_exporter uses), so
// this collector needs no Kubernetes-specific code: a DaemonSet that mounts
// the host's /proc and /sys into the pod and sets those env vars gets real
// node-level metrics from this same binary. See botobs/deploy/k8s/.
package host

import (
	"context"
	"fmt"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
	"github.com/shirou/gopsutil/v4/net"

	"github.com/marcfs31/fors-observability-design-system/botobs/internal/model"
)

// Collector gathers host-level metrics. DiskPath defaults to "/" — set it to
// something else for a container image whose root isn't the volume worth
// tracking.
type Collector struct {
	DiskPath string
	// sampleWindow is how long cpu.Percent blocks measuring — a real
	// sample, not an instantaneous (and noisier) snapshot. Kept short so
	// it doesn't dominate the registry's own collection interval.
	sampleWindow time.Duration
}

// New builds a host Collector with sensible defaults.
func New() *Collector {
	return &Collector{DiskPath: "/", sampleWindow: 200 * time.Millisecond}
}

func (c *Collector) Name() string { return "host" }

func (c *Collector) Collect(ctx context.Context) ([]model.Metric, error) {
	now := time.Now()
	var metrics []model.Metric

	if pct, err := cpu.PercentWithContext(ctx, c.sampleWindow, false); err == nil && len(pct) > 0 {
		metrics = append(metrics, model.Metric{Name: "host.cpu.percent", Value: pct[0], Timestamp: now})
	}

	if vm, err := mem.VirtualMemoryWithContext(ctx); err == nil {
		metrics = append(metrics,
			model.Metric{Name: "host.memory.percent", Value: vm.UsedPercent, Timestamp: now},
			model.Metric{Name: "host.memory.used_bytes", Value: float64(vm.Used), Timestamp: now},
			model.Metric{Name: "host.memory.total_bytes", Value: float64(vm.Total), Timestamp: now},
		)
	}

	if du, err := disk.UsageWithContext(ctx, c.diskPath()); err == nil {
		metrics = append(metrics,
			model.Metric{
				Name: "host.disk.percent", Value: du.UsedPercent, Timestamp: now,
				Labels: map[string]string{"path": du.Path},
			},
			model.Metric{
				Name: "host.disk.used_bytes", Value: float64(du.Used), Timestamp: now,
				Labels: map[string]string{"path": du.Path},
			},
		)
	}

	if counters, err := net.IOCountersWithContext(ctx, false); err == nil && len(counters) > 0 {
		total := counters[0]
		metrics = append(metrics,
			model.Metric{Name: "host.net.bytes_sent", Value: float64(total.BytesSent), Timestamp: now},
			model.Metric{Name: "host.net.bytes_recv", Value: float64(total.BytesRecv), Timestamp: now},
		)
	}

	if info, err := host.InfoWithContext(ctx); err == nil {
		metrics = append(metrics,
			model.Metric{
				Name: "host.uptime_seconds", Value: float64(info.Uptime), Timestamp: now,
				Labels: map[string]string{"hostname": info.Hostname},
			},
		)
	}

	if len(metrics) == 0 {
		return nil, fmt.Errorf("host collector: every metric source failed")
	}
	return metrics, nil
}

func (c *Collector) diskPath() string {
	if c.DiskPath == "" {
		return "/"
	}
	return c.DiskPath
}
