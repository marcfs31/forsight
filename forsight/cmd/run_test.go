package cmd

import "testing"

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
