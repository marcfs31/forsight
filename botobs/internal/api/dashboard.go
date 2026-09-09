package api

import "net/http"

// PlaceholderDashboard serves a minimal, dependency-free page confirming the
// agent is up while the real dashboard (botobs/web — a small React app built
// on @marcfs31/fors-observability-design-system) isn't embedded into this
// build. DashboardHandler (built.go, go:embed-gated) replaces this once the
// web app's build output exists.
func PlaceholderDashboard() http.Handler {
	const body = `<!doctype html>
<html>
<head><title>botobs</title></head>
<body style="font: 14px system-ui; background:#0b0f14; color:#eaf0f5; padding:2rem;">
  <h1>botobs is running</h1>
  <p>The full dashboard isn't built into this binary yet. Try:</p>
  <ul>
    <li><a style="color:#16c7b0" href="/healthz">/healthz</a></li>
    <li><a style="color:#16c7b0" href="/api/v1/metrics">/api/v1/metrics</a></li>
  </ul>
</body>
</html>`
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(body))
	})
}
