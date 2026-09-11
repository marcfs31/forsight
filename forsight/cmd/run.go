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
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"

	"github.com/marcfs31/forsight/forseer"
	"github.com/marcfs31/forsight/forsight/internal/api"
	"github.com/marcfs31/forsight/forsight/internal/collector"
	dockercollector "github.com/marcfs31/forsight/forsight/internal/collector/docker"
	"github.com/marcfs31/forsight/forsight/internal/collector/filelog"
	hostcollector "github.com/marcfs31/forsight/forsight/internal/collector/host"
	"github.com/marcfs31/forsight/forsight/internal/collector/otlp"
	proccollector "github.com/marcfs31/forsight/forsight/internal/collector/proc"
	"github.com/marcfs31/forsight/forsight/internal/collector/promscrape"
	"github.com/marcfs31/forsight/forsight/internal/collector/statsd"
	"github.com/marcfs31/forsight/forsight/internal/model"
	"github.com/marcfs31/forsight/forsight/internal/store"
)

type runOptions struct {
	addr              string
	authToken         string
	retention         time.Duration
	collectInterval   time.Duration
	disableDocker     bool
	disableOTLP       bool
	disableProc       bool
	disableStatsd     bool
	disableAutoscrape bool
	scrapeTargets     []string
	statsdAddr        string
	logFiles          []string
	errorSLO          float64
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
	cmd.Flags().StringVar(&opts.authToken, "auth-token", "",
		"require Authorization: Bearer <token> on every route except GET /healthz; "+
			"also read from FORSIGHT_AUTH_TOKEN when the flag is empty (auth is off by default)")
	cmd.Flags().DurationVar(&opts.retention, "retention", time.Hour, "how long the in-memory store retains data")
	cmd.Flags().DurationVar(&opts.collectInterval, "collect-interval", 10*time.Second, "how often the host/Docker collectors poll")
	cmd.Flags().BoolVar(&opts.disableDocker, "disable-docker", false, "skip the Docker collector even if a daemon is reachable")
	cmd.Flags().BoolVar(&opts.disableOTLP, "disable-otlp", false, "don't mount the OTLP ingest endpoints")
	cmd.Flags().BoolVar(&opts.disableProc, "disable-proc", false, "skip per-process CPU/memory collection")
	cmd.Flags().BoolVar(&opts.disableStatsd, "disable-statsd", false, "don't listen for StatsD/DogStatsD")
	cmd.Flags().BoolVar(&opts.disableAutoscrape, "disable-autoscrape", false, "don't probe well-known local Prometheus exporters (node_exporter :9100, …)")
	cmd.Flags().StringArrayVar(&opts.scrapeTargets, "scrape", nil,
		"Prometheus exposition endpoint to scrape on --collect-interval; repeatable. "+
			"Optionally prefix a job name: --scrape node=http://localhost:9100/metrics")
	cmd.Flags().StringVar(&opts.statsdAddr, "statsd-addr", ":8125",
		"listen for StatsD/DogStatsD metrics over UDP (default :8125 so a bare install receives them; --disable-statsd turns it off)")
	cmd.Flags().StringArrayVar(&opts.logFiles, "log-file", nil,
		"path of a log file to tail into the store (repeatable); severity is inferred from the line")
	cmd.Flags().Float64Var(&opts.errorSLO, "error-slo", 0,
		"target error-log rate for Forseer's error budget, e.g. 0.01 for 1% (default 1%); "+
			"also read from FORSIGHT_ERROR_SLO when unset")

	return cmd
}

func run(ctx context.Context, opts *runOptions, logger *slog.Logger) error {
	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	eng := forseer.NewEngine()
	if slo := resolveErrorSLO(opts.errorSLO); slo > 0 {
		eng.SetErrorSLO(slo)
	}
	st := observingStore{Store: store.NewMemoryStore(opts.retention), eng: eng}

	collectors := []collector.Collector{hostcollector.New()}
	if !opts.disableProc {
		collectors = append(collectors, proccollector.New())
	}
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
	if !opts.disableAutoscrape {
		found := promscrape.DiscoverLocal(ctx, targets)
		for _, t := range found {
			logger.Info("auto-discovered Prometheus exporter", "url", t.URL, "job", t.Labels["job"])
		}
		targets = append(targets, found...)
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
	// registered — see the package doc. Default listen is :8125 so a
	// curl|sh install receives StatsD with no flags; a bind failure is
	// non-fatal (the port may already be taken).
	if !opts.disableStatsd && opts.statsdAddr != "" {
		statsdCollector := statsd.New(opts.statsdAddr)
		if err := statsdCollector.Bind(); err != nil {
			logger.Warn("StatsD receiver not started", "addr", opts.statsdAddr, "error", err)
		} else {
			collectors = append(collectors, statsdCollector)
			go func() {
				if err := statsdCollector.Serve(ctx); err != nil && ctx.Err() == nil {
					logger.Error("StatsD receiver stopped", "addr", opts.statsdAddr, "error", err)
				}
			}()
			logger.Info("StatsD receiver listening", "addr", statsdCollector.LocalAddr())
		}
	}

	registry := collector.NewRegistry(st, opts.collectInterval, logger, collectors...)
	go registry.Run(ctx)

	for _, path := range opts.logFiles {
		logPath := path
		go tailWithRetry(ctx, logPath, st, logger)
		logger.Info("tailing log file", "path", logPath)
	}

	var otlpHandler api.OTLPHandler
	if !opts.disableOTLP {
		otlpHandler = otlp.NewHandler(st, st, st)
	}

	server := api.NewServer(st, otlpHandler, api.DashboardHandler(), logger).WithForseer(eng)
	authToken := resolveAuthToken(opts.authToken)
	if authToken == "" && !isLoopbackListenAddr(opts.addr) {
		logger.Warn("listening on a non-loopback address with no authentication configured; set --auth-token or FORSIGHT_AUTH_TOKEN")
	}
	httpServer := &http.Server{Addr: opts.addr, Handler: api.BearerAuth(authToken, server.Handler())}

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

// tailMinBackoff and tailMaxBackoff bound the delay tailWithRetry waits
// between restarts of a failed filelog.Tail.
const (
	tailMinBackoff = time.Second
	tailMaxBackoff = 30 * time.Second
)

// tailWithRetry runs filelog.Tail for path, restarting it with a capped
// exponential backoff whenever it returns an error other than ctx
// cancellation. Tail itself now recovers from the failures this codebase
// has actually hit (an oversized line, a rotated/truncated file) instead of
// returning fatally, but this keeps a log file from going permanently
// unwatched — "log tailer stopped" used to mean stopped forever — on
// whatever else a filesystem can throw at it (e.g. a transient permission
// or I/O error), consistent with every other collector goroutine's
// ctx-scoped restart discipline in this file.
func tailWithRetry(ctx context.Context, path string, sink filelog.Sink, logger *slog.Logger) {
	retryTail(ctx, path, sink, logger, tailMinBackoff, tailMaxBackoff)
}

// retryTail holds tailWithRetry's loop with the backoff bounds as
// parameters so a test can drive it with millisecond backoffs instead of
// tailMinBackoff/tailMaxBackoff's real-world values.
func retryTail(ctx context.Context, path string, sink filelog.Sink, logger *slog.Logger, minBackoff, maxBackoff time.Duration) {
	backoff := minBackoff
	for {
		err := filelog.Tail(ctx, path, sink)
		if ctx.Err() != nil {
			return
		}
		logger.Error("log tailer stopped, restarting", "path", path, "error", err, "retry_in", backoff)
		select {
		case <-ctx.Done():
			return
		case <-time.After(backoff):
		}
		backoff *= 2
		if backoff > maxBackoff {
			backoff = maxBackoff
		}
	}
}

// resolveAuthToken prefers the --auth-token flag; when that is empty it falls
// back to FORSIGHT_AUTH_TOKEN. An empty result means auth stays off.
func resolveAuthToken(flagValue string) string {
	if flagValue != "" {
		return flagValue
	}
	return os.Getenv("FORSIGHT_AUTH_TOKEN")
}

// resolveErrorSLO prefers the --error-slo flag; when that is unset (the flag
// defaults to 0, since 0% error tolerance is not a meaningful SLO) it falls
// back to FORSIGHT_ERROR_SLO. A non-positive result means the engine keeps
// its own built-in default (see forseer.defaultErrorSLO).
func resolveErrorSLO(flagValue float64) float64 {
	if flagValue > 0 {
		return flagValue
	}
	if raw := os.Getenv("FORSIGHT_ERROR_SLO"); raw != "" {
		if v, err := strconv.ParseFloat(raw, 64); err == nil {
			return v
		}
	}
	return 0
}

// isLoopbackListenAddr reports whether addr is explicitly bound to a loopback
// interface. Bare ":PORT" and "0.0.0.0:PORT" are not — they listen on all
// interfaces.
func isLoopbackListenAddr(addr string) bool {
	return strings.HasPrefix(addr, "127.0.0.1:") ||
		strings.HasPrefix(addr, "localhost:") ||
		strings.HasPrefix(addr, "[::1]:")
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

// observingStore writes through to MemoryStore and feeds Forseer on every
// ingest path (host collectors and OTLP), so insights see the same stream
// the dashboard queries.
type observingStore struct {
	store.Store
	eng *forseer.Engine
}

func (s observingStore) WriteMetrics(ctx context.Context, metrics []model.Metric) error {
	if s.eng != nil && len(metrics) > 0 {
		pts := make([]forseer.Point, len(metrics))
		for i, m := range metrics {
			pts[i] = forseer.Point{Name: m.Name, Value: m.Value, Labels: m.Labels}
		}
		s.eng.ObserveMetrics(pts)
	}
	return s.Store.WriteMetrics(ctx, metrics)
}

func (s observingStore) WriteLogs(ctx context.Context, logs []model.LogEntry) error {
	if s.eng != nil && len(logs) > 0 {
		lines := make([]forseer.LogLine, len(logs))
		for i, l := range logs {
			lines[i] = forseer.LogLine{
				Timestamp: l.Timestamp,
				Severity:  string(l.Severity),
				Source:    l.Source,
				Message:   l.Message,
			}
		}
		s.eng.ObserveLogs(lines)
	}
	return s.Store.WriteLogs(ctx, logs)
}

func (s observingStore) WriteSpans(ctx context.Context, spans []model.Span) error {
	if s.eng != nil && len(spans) > 0 {
		samples := make([]forseer.SpanSample, len(spans))
		for i, sp := range spans {
			samples[i] = forseer.SpanSample{
				Name:       sp.Name,
				Service:    sp.Service,
				DurationMs: float64(sp.Duration) / float64(time.Millisecond),
				Status:     string(sp.Status),
				TraceID:    sp.TraceID,
				SpanID:     sp.SpanID,
				ParentID:   sp.ParentID,
			}
		}
		s.eng.ObserveSpans(samples)
	}
	return s.Store.WriteSpans(ctx, spans)
}
