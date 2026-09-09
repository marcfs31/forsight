package cmd

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/spf13/cobra"

	"github.com/marcfs31/fors-observability-design-system/botobs/internal/api"
	"github.com/marcfs31/fors-observability-design-system/botobs/internal/collector"
	dockercollector "github.com/marcfs31/fors-observability-design-system/botobs/internal/collector/docker"
	hostcollector "github.com/marcfs31/fors-observability-design-system/botobs/internal/collector/host"
	"github.com/marcfs31/fors-observability-design-system/botobs/internal/collector/otlp"
	"github.com/marcfs31/fors-observability-design-system/botobs/internal/store"
)

type runOptions struct {
	addr            string
	retention       time.Duration
	collectInterval time.Duration
	disableDocker   bool
	disableOTLP     bool
}

func newRunCmd() *cobra.Command {
	opts := &runOptions{}
	cmd := &cobra.Command{
		Use:   "run",
		Short: "Start the botobs agent: collectors, storage, and the API/dashboard server",
		RunE: func(cmd *cobra.Command, _ []string) error {
			return run(cmd.Context(), opts, slog.New(slog.NewTextHandler(cmd.OutOrStdout(), nil)))
		},
	}

	cmd.Flags().StringVar(&opts.addr, "addr", ":8080", "address to serve the API and dashboard on")
	cmd.Flags().DurationVar(&opts.retention, "retention", time.Hour, "how long the in-memory store retains data")
	cmd.Flags().DurationVar(&opts.collectInterval, "collect-interval", 10*time.Second, "how often the host/Docker collectors poll")
	cmd.Flags().BoolVar(&opts.disableDocker, "disable-docker", false, "skip the Docker collector even if a daemon is reachable")
	cmd.Flags().BoolVar(&opts.disableOTLP, "disable-otlp", false, "don't mount the OTLP ingest endpoints")

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

	registry := collector.NewRegistry(st, opts.collectInterval, logger, collectors...)
	go registry.Run(ctx)

	var otlpHandler api.OTLPHandler
	if !opts.disableOTLP {
		otlpHandler = otlp.NewHandler(st, st)
	}

	server := api.NewServer(st, otlpHandler, api.PlaceholderDashboard(), logger)
	httpServer := &http.Server{Addr: opts.addr, Handler: server.Handler()}

	serveErr := make(chan error, 1)
	go func() {
		logger.Info("botobs listening", "addr", opts.addr)
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
