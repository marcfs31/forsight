package cmd

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

func TestResolveAuthToken(t *testing.T) {
	t.Setenv("FORSIGHT_AUTH_TOKEN", "from-env")

	if got := resolveAuthToken("from-flag"); got != "from-flag" {
		t.Errorf("flag should override env: got %q", got)
	}
	if got := resolveAuthToken(""); got != "from-env" {
		t.Errorf("empty flag should fall back to env: got %q", got)
	}

	t.Setenv("FORSIGHT_AUTH_TOKEN", "")
	if got := resolveAuthToken(""); got != "" {
		t.Errorf("empty flag and empty env: got %q, want empty", got)
	}
}

func TestResolveErrorSLO(t *testing.T) {
	t.Setenv("FORSIGHT_ERROR_SLO", "0.02")

	if got := resolveErrorSLO(0.05); got != 0.05 {
		t.Errorf("flag should override env: got %v", got)
	}
	if got := resolveErrorSLO(0); got != 0.02 {
		t.Errorf("unset flag should fall back to env: got %v", got)
	}

	t.Setenv("FORSIGHT_ERROR_SLO", "not-a-number")
	if got := resolveErrorSLO(0); got != 0 {
		t.Errorf("unparsable env should be ignored: got %v, want 0", got)
	}

	t.Setenv("FORSIGHT_ERROR_SLO", "")
	if got := resolveErrorSLO(0); got != 0 {
		t.Errorf("unset flag and empty env: got %v, want 0", got)
	}
	if got := resolveErrorSLO(-1); got != 0 {
		t.Errorf("non-positive flag and empty env: got %v, want 0", got)
	}
}

func TestIsLoopbackListenAddr(t *testing.T) {
	cases := []struct {
		addr string
		want bool
	}{
		{"127.0.0.1:8080", true},
		{"localhost:8080", true},
		{"[::1]:8080", true},
		{":8080", false},
		{"0.0.0.0:8080", false},
		{"192.168.1.1:8080", false},
	}
	for _, tc := range cases {
		if got := isLoopbackListenAddr(tc.addr); got != tc.want {
			t.Errorf("isLoopbackListenAddr(%q) = %v, want %v", tc.addr, got, tc.want)
		}
	}
}

func TestParseScrapeTargets(t *testing.T) {
	t.Run("bare URL labels the job with the host", func(t *testing.T) {
		got, err := parseScrapeTargets([]string{"http://localhost:9100/metrics"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(got) != 1 {
			t.Fatalf("want 1 target, got %d", len(got))
		}
		if got[0].URL != "http://localhost:9100/metrics" {
			t.Errorf("URL = %q", got[0].URL)
		}
		if got[0].Labels["job"] != "localhost:9100" {
			t.Errorf(`job = %q, want "localhost:9100"`, got[0].Labels["job"])
		}
	})

	t.Run("job= prefix wins over the host default", func(t *testing.T) {
		got, err := parseScrapeTargets([]string{"node=http://10.0.0.4:9100/metrics"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got[0].Labels["job"] != "node" {
			t.Errorf(`job = %q, want "node"`, got[0].Labels["job"])
		}
		if got[0].URL != "http://10.0.0.4:9100/metrics" {
			t.Errorf("URL = %q — the prefix must not stay in the URL", got[0].URL)
		}
	})

	t.Run("a URL containing = is not mistaken for a job prefix", func(t *testing.T) {
		got, err := parseScrapeTargets([]string{"http://host:9100/metrics?format=text"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got[0].URL != "http://host:9100/metrics?format=text" {
			t.Errorf("URL = %q", got[0].URL)
		}
		if got[0].Labels["job"] != "host:9100" {
			t.Errorf(`job = %q`, got[0].Labels["job"])
		}
	})

	t.Run("rejects a value that is not an absolute URL", func(t *testing.T) {
		for _, bad := range []string{"localhost:9100/metrics", "job=", "/metrics"} {
			if _, err := parseScrapeTargets([]string{bad}); err == nil {
				t.Errorf("parseScrapeTargets(%q) = nil error, want one", bad)
			}
		}
	})

	t.Run("no targets is not an error", func(t *testing.T) {
		got, err := parseScrapeTargets(nil)
		if err != nil || len(got) != 0 {
			t.Fatalf("got %v, %v", got, err)
		}
	})
}

// errSink always fails WriteLogs, forcing filelog.Tail to return an error
// so retryTail's restart path runs.
type errSink struct{ calls atomic.Int32 }

func (s *errSink) WriteLogs(_ context.Context, _ []model.LogEntry) error {
	s.calls.Add(1)
	return errors.New("boom")
}

// TestRetryTail_RestartsAfterFailureAndStopsOnCancel guards against the
// finding that a filelog.Tail failure used to kill the collector for a
// path permanently ("log tailer stopped" was the last anyone heard of it,
// logged once by cmd/run.go's goroutine before it exited for good). A
// failing tailer must now be restarted with backoff — and still exit
// promptly once the context is cancelled, rather than retrying forever.
func TestRetryTail_RestartsAfterFailureAndStopsOnCancel(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "app.log")
	if err := os.WriteFile(path, []byte("line\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	sink := &errSink{}
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan struct{})
	go func() {
		retryTail(ctx, path, sink, logger, time.Millisecond, 5*time.Millisecond)
		close(done)
	}()

	deadline := time.Now().Add(5 * time.Second)
	for sink.calls.Load() < 3 && time.Now().Before(deadline) {
		time.Sleep(5 * time.Millisecond)
	}
	if got := sink.calls.Load(); got < 3 {
		t.Fatalf("want at least 3 restarts (WriteLogs calls), got %d — retryTail should keep restarting a failing tailer", got)
	}

	cancel()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("retryTail did not stop promptly after ctx cancellation")
	}
}
