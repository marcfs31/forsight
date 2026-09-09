// Package collector defines the Collector interface every data source
// (host, docker, otlp, ...) implements, and a Registry that runs each one on
// its own interval and forwards results to a sink (the store).
package collector

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

// Collector gathers metrics from one source. Implementations must be safe to
// call repeatedly and must return quickly (the registry calls Collect on a
// fixed interval; a slow or blocked collector delays only its own next tick,
// never the others — see Registry.Run).
type Collector interface {
	// Name identifies the collector in logs and the /healthz response.
	Name() string
	// Collect returns the current metrics. An error is logged and skipped —
	// it never stops the collector's future ticks (a transient Docker-socket
	// hiccup shouldn't take down host-metric collection too).
	Collect(ctx context.Context) ([]model.Metric, error)
}

// Sink receives metrics as they're collected. *store.Store satisfies this
// without collector needing to import store — the dependency points one way.
type Sink interface {
	WriteMetrics(ctx context.Context, metrics []model.Metric) error
}

// Registry runs a fixed set of collectors on independent tickers.
type Registry struct {
	collectors []Collector
	interval   time.Duration
	sink       Sink
	logger     *slog.Logger
}

// NewRegistry builds a Registry. interval applies to every collector; a
// per-collector interval isn't needed yet (host/docker are cheap to poll
// every few seconds) — the collectors slice is what varies, not the timing.
func NewRegistry(sink Sink, interval time.Duration, logger *slog.Logger, collectors ...Collector) *Registry {
	if logger == nil {
		logger = slog.Default()
	}
	return &Registry{collectors: collectors, interval: interval, sink: sink, logger: logger}
}

// Run starts every collector on its own goroutine/ticker and blocks until ctx
// is cancelled. Each collector's failures are isolated (logged, not fatal).
func (r *Registry) Run(ctx context.Context) {
	var wg sync.WaitGroup
	for _, c := range r.collectors {
		wg.Add(1)
		go func(c Collector) {
			defer wg.Done()
			r.runOne(ctx, c)
		}(c)
	}
	wg.Wait()
}

func (r *Registry) runOne(ctx context.Context, c Collector) {
	ticker := time.NewTicker(r.interval)
	defer ticker.Stop()

	r.collectOnce(ctx, c) // first tick immediately, not after the first interval
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			r.collectOnce(ctx, c)
		}
	}
}

func (r *Registry) collectOnce(ctx context.Context, c Collector) {
	metrics, err := c.Collect(ctx)
	if err != nil {
		r.logger.Warn("collector failed", "collector", c.Name(), "error", err)
		return
	}
	if len(metrics) == 0 {
		return
	}
	if err := r.sink.WriteMetrics(ctx, metrics); err != nil {
		r.logger.Warn("failed to write collected metrics", "collector", c.Name(), "error", err)
	}
}
