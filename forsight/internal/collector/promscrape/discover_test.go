package promscrape

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestDiscoverLocal_PicksUpLiveExporterAndSkipsDead(t *testing.T) {
	live := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("# TYPE up gauge\nup 1\n"))
	}))
	defer live.Close()

	candidates := []Target{
		{URL: live.URL, Labels: map[string]string{"job": "node"}},
		{URL: "http://127.0.0.1:1/metrics", Labels: map[string]string{"job": "dead"}},
	}
	got := discoverLocal(context.Background(), candidates, nil, &http.Client{Timeout: time.Second})
	if len(got) != 1 || got[0].URL != live.URL {
		t.Fatalf("got %+v, want only the live server", got)
	}
}

func TestDiscoverLocal_DoesNotDuplicateConfigured(t *testing.T) {
	live := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer live.Close()

	configured := []Target{{URL: live.URL, Labels: map[string]string{"job": "explicit"}}}
	candidates := []Target{{URL: live.URL, Labels: map[string]string{"job": "node"}}}
	got := discoverLocal(context.Background(), candidates, configured, &http.Client{Timeout: time.Second})
	if len(got) != 0 {
		t.Fatalf("duplicated a --scrape target: %+v", got)
	}
}
