package api

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/marcfs31/forsight/forseer"
	"github.com/marcfs31/forsight/forsight/internal/model"
	"github.com/marcfs31/forsight/forsight/internal/store"
)

func (s *Server) handleHealthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleMetrics serves GET /api/v1/metrics?name=&since=<RFC3339>&label.<key>=<value>
func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	query := store.MetricQuery{Name: q.Get("name"), Labels: labelsFromQuery(q)}

	since, err := parseSince(q)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	query.Since = since

	metrics, err := s.store.QueryMetrics(r.Context(), query)
	if err != nil {
		http.Error(w, "failed to query metrics", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, metrics)
}

// handleTraces serves GET /api/v1/traces?service=&traceId=&since=<RFC3339>
func (s *Server) handleTraces(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	query := store.SpanQuery{Service: q.Get("service"), TraceID: q.Get("traceId")}

	since, err := parseSince(q)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	query.Since = since

	spans, err := s.store.QuerySpans(r.Context(), query)
	if err != nil {
		http.Error(w, "failed to query traces", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, spans)
}

// handleLogs serves GET /api/v1/logs?since=<RFC3339>&source=&severity=
func (s *Server) handleLogs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	query := store.LogQuery{
		Source:   q.Get("source"),
		Severity: model.LogSeverity(q.Get("severity")),
	}

	since, err := parseSince(q)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	query.Since = since

	logs, err := s.store.QueryLogs(r.Context(), query)
	if err != nil {
		http.Error(w, "failed to query logs", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, logs)
}

func parseSince(q url.Values) (time.Time, error) {
	raw := q.Get("since")
	if raw == "" {
		return time.Time{}, nil
	}
	t, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		return time.Time{}, errInvalidSince
	}
	return t, nil
}

var errInvalidSince = &queryError{"invalid since: expected RFC3339, e.g. 2026-01-02T15:04:05Z"}

type queryError struct{ msg string }

func (e *queryError) Error() string { return e.msg }

// labelsFromQuery extracts label.<key>=<value> query parameters into a map;
// returns nil (matching an unset MetricQuery.Labels) when there are none.
func labelsFromQuery(q url.Values) map[string]string {
	var labels map[string]string
	for key, values := range q {
		name, ok := strings.CutPrefix(key, "label.")
		if !ok || len(values) == 0 {
			continue
		}
		if labels == nil {
			labels = make(map[string]string)
		}
		labels[name] = values[0]
	}
	return labels
}

func (s *Server) handleForseerInsights(w http.ResponseWriter, _ *http.Request) {
	if s.forseer == nil {
		writeJSON(w, http.StatusOK, []forseer.Insight{})
		return
	}
	writeJSON(w, http.StatusOK, s.forseer.Insights())
}

func (s *Server) handleForseerClusters(w http.ResponseWriter, _ *http.Request) {
	if s.forseer == nil {
		writeJSON(w, http.StatusOK, []forseer.Cluster{})
		return
	}
	writeJSON(w, http.StatusOK, s.forseer.Clusters())
}

func (s *Server) handleForseerSummary(w http.ResponseWriter, r *http.Request) {
	key := forseer.APIKeyFromEnv()
	if key == "" {
		writeJSON(w, http.StatusOK, map[string]any{"enabled": false, "summary": ""})
		return
	}
	var insights []forseer.Insight
	var clusters []forseer.Cluster
	if s.forseer != nil {
		insights = s.forseer.Insights()
		clusters = s.forseer.Clusters()
	}
	summary, err := forseer.Summarize(r.Context(), insights, clusters, key)
	if err != nil {
		http.Error(w, "forseer summary failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"enabled": true, "summary": summary})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
