package cmd

import (
	"log/slog"
	"testing"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/store"
)

func discardLogger() *slog.Logger {
	return slog.New(slog.DiscardHandler)
}

func TestNewBackingStore(t *testing.T) {
	t.Run("defaults to memory", func(t *testing.T) {
		backing, badgerStore, err := newBackingStore(&runOptions{storeBackend: "", retention: time.Hour})
		if err != nil {
			t.Fatalf("newBackingStore: %v", err)
		}
		if badgerStore != nil {
			t.Errorf("badgerStore = %v, want nil for an unset --store", badgerStore)
		}
		if _, ok := backing.(*store.MemoryStore); !ok {
			t.Errorf("backing = %T, want *store.MemoryStore", backing)
		}
	})

	t.Run(`"memory" is explicit too`, func(t *testing.T) {
		backing, badgerStore, err := newBackingStore(&runOptions{storeBackend: "memory", retention: time.Hour})
		if err != nil {
			t.Fatalf("newBackingStore: %v", err)
		}
		if badgerStore != nil {
			t.Errorf("badgerStore = %v, want nil for --store=memory", badgerStore)
		}
		if _, ok := backing.(*store.MemoryStore); !ok {
			t.Errorf("backing = %T, want *store.MemoryStore", backing)
		}
	})

	t.Run(`"badger" opens a database at --data-dir and returns it for the shutdown path too`, func(t *testing.T) {
		dir := t.TempDir()
		backing, badgerStore, err := newBackingStore(&runOptions{storeBackend: "badger", dataDir: dir, retention: time.Hour})
		if err != nil {
			t.Fatalf("newBackingStore: %v", err)
		}
		t.Cleanup(func() {
			if err := closeBadgerStore(badgerStore, discardLogger()); err != nil {
				t.Errorf("closeBadgerStore: %v", err)
			}
		})
		if badgerStore == nil {
			t.Fatal("badgerStore = nil, want the opened *store.BadgerStore for --store=badger")
		}
		if backing != store.Store(badgerStore) {
			t.Errorf("backing and badgerStore must be the same value: backing=%v badgerStore=%v", backing, badgerStore)
		}
	})

	t.Run("rejects an unknown backend", func(t *testing.T) {
		_, _, err := newBackingStore(&runOptions{storeBackend: "postgres", retention: time.Hour})
		if err == nil {
			t.Fatal(`newBackingStore(storeBackend: "postgres") = nil error, want one`)
		}
	})
}

func TestCloseBadgerStore_NilIsNoop(t *testing.T) {
	if err := closeBadgerStore(nil, discardLogger()); err != nil {
		t.Errorf("closeBadgerStore(nil, ...) = %v, want nil", err)
	}
}

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
