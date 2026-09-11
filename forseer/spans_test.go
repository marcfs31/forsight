package forseer

import (
	"fmt"
	"testing"
	"time"
)

// TestSpanWatch_EvictsOldestTraceByTime inserts maxTraces distinct traces in
// a known order, then adds one more to push the trace map over maxTraces.
// evictOldestTraceLocked must remove the specific trace that was inserted
// first (oldest by last-updated time), not whatever key Go's map iteration
// happens to yield. The old implementation kept the map bounded too, so a
// weaker assertion ("len never exceeds maxTraces") would not have caught the
// bug — this test pins down which trace survives.
func TestSpanWatch_EvictsOldestTraceByTime(t *testing.T) {
	w := newSpanWatch()
	tick := time.Date(2026, 9, 11, 12, 0, 0, 0, time.UTC)
	w.now = func() time.Time {
		got := tick
		tick = tick.Add(time.Second)
		return got
	}

	for i := 0; i < maxTraces; i++ {
		id := fmt.Sprintf("trace-%02d", i)
		w.Observe([]SpanSample{{TraceID: id, SpanID: "s", Name: "op", DurationMs: 1}})
	}
	if got := len(w.traces); got != maxTraces {
		t.Fatalf("after filling to capacity: got %d traces, want %d", got, maxTraces)
	}

	// This insert pushes the map to maxTraces+1, forcing an eviction. Under
	// the old code, eviction picks an arbitrary map key — which could even
	// be "trace-new", the one just inserted on this very call.
	w.Observe([]SpanSample{{TraceID: "trace-new", SpanID: "s", Name: "op", DurationMs: 1}})

	if got := len(w.traces); got != maxTraces {
		t.Fatalf("after eviction: got %d traces, want %d", got, maxTraces)
	}
	if _, ok := w.traces["trace-00"]; ok {
		t.Fatalf("expected the oldest trace (trace-00) to be evicted, but it is still present")
	}
	if _, ok := w.traceSeen["trace-00"]; ok {
		t.Fatalf("expected traceSeen bookkeeping for trace-00 to be cleared on eviction")
	}
	if _, ok := w.traces["trace-new"]; !ok {
		t.Fatalf("expected the just-inserted trace-new to survive eviction, it did not")
	}
	for i := 1; i < maxTraces; i++ {
		id := fmt.Sprintf("trace-%02d", i)
		if _, ok := w.traces[id]; !ok {
			t.Fatalf("expected trace %s to survive eviction, it did not", id)
		}
	}
}
