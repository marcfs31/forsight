package statsd

import (
	"context"
	"net"
	"testing"
	"time"
)

func TestIngestLine_CounterGaugeTimer(t *testing.T) {
	c := New(":0")
	c.ingestLine("requests:1|c")
	c.ingestLine("requests:1|c")
	c.ingestLine("connections:5|g")
	c.ingestLine("latency:100|ms")
	c.ingestLine("latency:200|ms")

	metrics, err := c.Collect(context.Background())
	if err != nil {
		t.Fatalf("Collect: %v", err)
	}

	byName := map[string]float64{}
	for _, m := range metrics {
		key := m.Name
		if q, ok := m.Labels["quantile"]; ok {
			key += "{quantile=" + q + "}"
		}
		byName[key] = m.Value
	}

	if byName["requests"] != 2 {
		t.Errorf("requests = %v, want 2 (two increments of 1)", byName["requests"])
	}
	if byName["connections"] != 5 {
		t.Errorf("connections = %v, want 5", byName["connections"])
	}
	if byName["latency_count"] != 2 {
		t.Errorf("latency_count = %v, want 2", byName["latency_count"])
	}
	if byName["latency_sum"] != 300 {
		t.Errorf("latency_sum = %v, want 300", byName["latency_sum"])
	}
}

func TestCollect_ResetsCountersAndTimersButNotGauges(t *testing.T) {
	c := New(":0")
	c.ingestLine("requests:5|c")
	c.ingestLine("connections:10|g")
	c.ingestLine("latency:50|ms")

	first, err := c.Collect(context.Background())
	if err != nil {
		t.Fatalf("Collect (first): %v", err)
	}
	if len(first) == 0 {
		t.Fatal("first flush produced no metrics")
	}

	second, err := c.Collect(context.Background())
	if err != nil {
		t.Fatalf("Collect (second): %v", err)
	}

	byName := map[string]float64{}
	for _, m := range second {
		byName[m.Name] = m.Value
	}
	if _, ok := byName["requests"]; ok {
		t.Error("counter 'requests' survived a flush with no new packets — counters should reset to zero (absent) after flushing")
	}
	if _, ok := byName["latency_count"]; ok {
		t.Error("timer 'latency' survived a flush with no new packets — timers should reset after flushing")
	}
	if got, ok := byName["connections"]; !ok || got != 10 {
		t.Errorf("gauge 'connections' = %v (present=%v), want 10 (present) — gauges must persist across a flush with no new packets", got, ok)
	}
}

func TestIngestLine_SampleRateScalesCounters(t *testing.T) {
	c := New(":0")
	// A client reporting at 1-in-10 sampling says "this one event actually
	// represents 10" — the stored counter must scale back up.
	c.ingestLine("requests:1|c|@0.1")

	metrics, _ := c.Collect(context.Background())
	if len(metrics) != 1 || metrics[0].Value != 10 {
		t.Fatalf("got %+v, want a single requests=10 metric (1 / 0.1)", metrics)
	}
}

func TestIngestLine_DogStatsDTags(t *testing.T) {
	c := New(":0")
	c.ingestLine("requests:1|c|#route:checkout,env:prod")
	c.ingestLine("requests:1|c|#env:prod,route:checkout") // same tags, different order

	metrics, err := c.Collect(context.Background())
	if err != nil {
		t.Fatalf("Collect: %v", err)
	}
	// Both lines should collapse into ONE series (tag order shouldn't
	// fragment an otherwise-identical tag set) with a combined value of 2.
	if len(metrics) != 1 {
		t.Fatalf("got %d metrics, want 1 (tag-order-independent aggregation): %+v", len(metrics), metrics)
	}
	if metrics[0].Value != 2 {
		t.Errorf("requests = %v, want 2", metrics[0].Value)
	}
	if metrics[0].Labels["route"] != "checkout" || metrics[0].Labels["env"] != "prod" {
		t.Errorf("labels = %+v, want route=checkout, env=prod", metrics[0].Labels)
	}
}

func TestIngestLine_MalformedLinesAreIgnored(t *testing.T) {
	c := New(":0")
	c.ingestLine("not a valid line")
	c.ingestLine("missing-type:5")
	c.ingestLine("bad-value:abc|c")
	c.ingestLine("") // blank line from a trailing newline

	metrics, err := c.Collect(context.Background())
	if err != nil {
		t.Fatalf("Collect: %v", err)
	}
	if len(metrics) != 0 {
		t.Fatalf("got %+v, want no metrics from garbage input", metrics)
	}
}

func TestListen_RealUDPPacket(t *testing.T) {
	c := New("127.0.0.1:0")
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// New doesn't reserve the port itself, so Listen must be started before
	// the real listening address is known — resolve it via a small retry
	// once ListenPacket has actually bound. Simpler: bind our own throwaway
	// listener first solely to pick a free port, close it, and pass that.
	probe, err := net.ListenPacket("udp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to find a free port: %v", err)
	}
	addr := probe.LocalAddr().String()
	_ = probe.Close()

	c = New(addr)
	listenErrCh := make(chan error, 1)
	go func() { listenErrCh <- c.Listen(ctx) }()

	conn, err := net.Dial("udp", addr)
	if err != nil {
		t.Fatalf("net.Dial: %v", err)
	}
	defer func() { _ = conn.Close() }()

	// Retry the send briefly — the listener goroutine above needs a moment
	// to actually reach ListenPacket before packets sent to the address land.
	deadline := time.Now().Add(2 * time.Second)
	var metrics []float64
	for time.Now().Before(deadline) {
		if _, err := conn.Write([]byte("real.metric:42|c\n")); err != nil {
			t.Fatalf("conn.Write: %v", err)
		}
		time.Sleep(20 * time.Millisecond)
		got, err := c.Collect(context.Background())
		if err != nil {
			t.Fatalf("Collect: %v", err)
		}
		for _, m := range got {
			metrics = append(metrics, m.Value)
		}
		if len(metrics) > 0 {
			break
		}
	}
	if len(metrics) == 0 {
		t.Fatal("no metric was received over a real UDP socket within the deadline")
	}

	cancel()
	select {
	case err := <-listenErrCh:
		if err != nil {
			t.Errorf("Listen returned an error after ctx cancellation: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Error("Listen did not return within 2s of ctx cancellation")
	}
}

func TestName(t *testing.T) {
	if got := New(":0").Name(); got != "statsd" {
		t.Errorf("Name() = %q, want statsd", got)
	}
}
