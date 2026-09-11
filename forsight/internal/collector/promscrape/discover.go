package promscrape

import (
	"context"
	"net/http"
	"time"
)

// wellKnownLocal are the exporters a fresh install should pick up with no
// flags, if they are already listening on this host. Probe is cheap (HEAD/GET
// with a short timeout); a miss is silence, not an error.
var wellKnownLocal = []Target{
	{URL: "http://127.0.0.1:9100/metrics", Labels: map[string]string{"job": "node"}},
	{URL: "http://127.0.0.1:9090/metrics", Labels: map[string]string{"job": "prometheus"}},
	{URL: "http://127.0.0.1:9182/metrics", Labels: map[string]string{"job": "windows"}},
	{URL: "http://127.0.0.1:9273/metrics", Labels: map[string]string{"job": "process"}},
}

// DiscoverLocal probes well-known local Prometheus exporters and returns the
// ones that answered 200. configured is the --scrape list; URLs already in it
// are not duplicated.
func DiscoverLocal(ctx context.Context, configured []Target) []Target {
	return discoverLocal(ctx, wellKnownLocal, configured, &http.Client{Timeout: 400 * time.Millisecond})
}

func discoverLocal(ctx context.Context, candidates, configured []Target, client *http.Client) []Target {
	seen := map[string]struct{}{}
	for _, t := range configured {
		seen[t.URL] = struct{}{}
	}
	var found []Target
	for _, t := range candidates {
		if _, ok := seen[t.URL]; ok {
			continue
		}
		if !reachable(ctx, client, t.URL) {
			continue
		}
		found = append(found, t)
		seen[t.URL] = struct{}{}
	}
	return found
}

func reachable(ctx context.Context, client *http.Client, rawURL string) bool {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return false
	}
	resp, err := client.Do(req)
	if err != nil {
		return false
	}
	_ = resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}
