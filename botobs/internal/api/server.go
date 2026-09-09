// Package api wires botobs's HTTP surface: the query API the dashboard (and
// any other client) reads from, the OTLP ingest endpoints, and the embedded
// dashboard itself.
package api

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/marcfs31/fors-observability-design-system/botobs/internal/store"
)

// OTLPHandler is satisfied by *otlp.Handler; declared here rather than
// imported so this package doesn't need to know about OTLP's wire format,
// only that something can register routes on a mux.
type OTLPHandler interface {
	Register(mux *http.ServeMux)
}

// Server wires the query API, OTLP ingest, and dashboard into one handler.
type Server struct {
	store     store.Store
	otlp      OTLPHandler  // nil is valid: OTLP ingest simply isn't mounted
	dashboard http.Handler // nil is valid: falls back to a plain 404 at "/"
	logger    *slog.Logger
}

// NewServer builds a Server. dashboard may be nil (see dashboard.go for the
// embedded-build version); otlpHandler may be nil to run without an ingest
// endpoint.
func NewServer(st store.Store, otlpHandler OTLPHandler, dashboard http.Handler, logger *slog.Logger) *Server {
	if logger == nil {
		logger = slog.Default()
	}
	return &Server{store: st, otlp: otlpHandler, dashboard: dashboard, logger: logger}
}

// Handler builds the full routed http.Handler.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.handleHealthz)
	mux.HandleFunc("GET /api/v1/metrics", s.handleMetrics)
	mux.HandleFunc("GET /api/v1/traces", s.handleTraces)

	if s.otlp != nil {
		s.otlp.Register(mux)
	}
	if s.dashboard != nil {
		mux.Handle("/", s.dashboard)
	}

	return s.withLogging(mux)
}

func (s *Server) withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)
		s.logger.Debug("http request",
			"method", r.Method, "path", r.URL.Path, "status", rw.status, "duration", time.Since(start))
	})
}

// statusRecorder captures the status code a handler wrote, since
// http.ResponseWriter itself doesn't expose it after the fact.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}
