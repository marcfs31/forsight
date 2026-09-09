package cmd

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"

	"github.com/marcfs31/forsight/forsight/internal/api"
	"github.com/marcfs31/forsight/forsight/internal/collector"
	dockercollector "github.com/marcfs31/forsight/forsight/internal/collector/docker"
	hostcollector "github.com/marcfs31/forsight/forsight/internal/collector/host"
	"github.com/marcfs31/forsight/forsight/internal/collector/otlp"
	"github.com/marcfs31/forsight/forsight/internal/collector/promscrape"
	"github.com/marcfs31/forsight/forsight/internal/collector/statsd"
	"github.com/marcfs31/forsight/forsight/internal/store"
)

type runOptions struct {
	addr            string
	retention       time.Duration
	collectInterval time.Duration
	disableDocker   bool
	disableOTLP     bool
	scrapeTargets   []string
	statsdAddr      string
}

func newRunCmd() *cobra.Command {
	opts := &runOptions{}
	cmd := &cobra.Command{
		Use:   "run",
		Short: "Start the forsight agent: collectors, storage, and the API/dashboard server",
		RunE: func(cmd *cobra.Command, _ []string) error {
			return run(cmd.Context(), opts, slog.New(slog.NewTextHandler(cmd.OutOrStdout(), nil)))
		},
	}

	cmd.Flags().StringVar(&opts.addr, "addr", ":8080", "address to serve the API and dashboard on")
	cmd.Flags().DurationVar(&opts.retention, "retention", time.Hour, "how long the in-memory store retains data")
	cmd.Flags().DurationVar(&opts.collectInterval, "collect-interval", 10*time.Second, "how often the host/Docker collectors poll")
	cmd.Flags().BoolVar(&opts.disableDocker, "disable-docker", false, "skip the Docker collector even if a daemon is reachable")
	cmd.Flags().BoolVar(&opts.disableOTLP, "disable-otlp", false, "don't mount the OTLP ingest endpoints")
	cmd.Flags().StringArrayVar(&opts.scrapeTargets, "scrape", nil,
		"Prometheus exposition endpoint to scrape on --collect-interval; repeatable. "+
			"Optionally prefix a job name: --scrape node=http://localhost:9100/metrics")
	cmd.Flags().StringVar(&opts.statsdAddr, "statsd-addr", "",
		"listen for StatsD/DogStatsD metrics over UDP on this address (e.g. :8125); empty disables it")

	return cmd
}

func run(ctx context.Context, opts *runOptions, logger *slog.Logger) error {
	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	st := store.NewMemoryStore(opts.retention)

	collectors := []collector.Collector{hostcollector.New()}
	if !opts.disableDocker {
		if dockerCollector, err := dockercollector.New(ctx); err != nil {
			logger.Info("Docker collector disabled: no daemon reachable", "detail", err)
		} else {
			collectors = append(collectors, dockerCollector)
		}
	}

	// Scrape targets are pull-based like host/Docker, so the registry's own
	// ticker drives them — one collector for all targets, not one each.
	targets, err := parseScrapeTargets(opts.scrapeTargets)
	if err != nil {
		return err
	}
	if len(targets) > 0 {
		collectors = append(collectors, promscrape.New(targets))
		for _, t := range targets {
			logger.Info("scraping Prometheus target", "url", t.URL, "job", t.Labels["job"])
		}
	}

	// StatsD is push-based: Listen accumulates packets continuously in its own
	// goroutine while Collect drains and resets that accumulator on the
	// registry's tick. That is why it is started separately from being
	// registered — see the package doc.
	if opts.statsdAddr != "" {
		statsdCollector := statsd.New(opts.statsdAddr)
		// Bind synchronously so an unusable address (already in use, no
		// permission) fails startup here, instead of being logged from a
		// goroutine after we have already claimed to be listening.
		if err := statsdCollector.Bind(); err != nil {
			return fmt.Errorf("--statsd-addr %s: %w", opts.statsdAddr, err)
		}
		collectors = append(collectors, statsdCollector)
		go func() {
			if err := statsdCollector.Serve(ctx); err != nil && ctx.Err() == nil {
				logger.Error("StatsD receiver stopped", "addr", opts.statsdAddr, "error", err)
			}
		}()
		logger.Info("StatsD receiver listening", "addr", statsdCollector.LocalAddr())
	}

	registry := collector.NewRegistry(st, opts.collectInterval, logger, collectors...)
	go registry.Run(ctx)

	var otlpHandler api.OTLPHandler
	if !opts.disableOTLP {
		otlpHandler = otlp.NewHandler(st, st)
	}

	server := api.NewServer(st, otlpHandler, api.DashboardHandler(), logger)
	httpServer := &http.Server{Addr: opts.addr, Handler: server.Handler()}

	serveErr := make(chan error, 1)
	go func() {
		logger.Info("forsight listening", "addr", opts.addr)
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serveErr <- err
		}
		close(serveErr)
	}()

	select {
	case <-ctx.Done():
		logger.Info("shutting down")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return httpServer.Shutdown(shutdownCtx)
	case err := <-serveErr:
		return err
	}
}

// parseScrapeTargets turns --scrape values into promscrape targets. Each value
// is a URL, optionally prefixed with "job=" to label everything scraped from
// it — the same "job" convention Prometheus itself uses, so a dashboard can
// tell two node_exporters apart. Without a prefix the job label is the URL's
// host, which is a more useful default than no label at all.
func parseScrapeTargets(values []string) ([]promscrape.Target, error) {
	targets := make([]promscrape.Target, 0, len(values))
	for _, v := range values {
		job, raw := "", v
		if name, rest, found := strings.Cut(v, "="); found && !strings.Contains(name, "/") {
			job, raw = name, rest
		}
		u, err := url.Parse(raw)
		if err != nil || u.Scheme == "" || u.Host == "" {
			return nil, fmt.Errorf("--scrape %q: want an absolute URL like http://host:9100/metrics, optionally prefixed job=", v)
		}
		if job == "" {
			job = u.Host
		}
		targets = append(targets, promscrape.Target{URL: raw, Labels: map[string]string{"job": job}})
	}
	return targets, nil
}
