package forseer

import "testing"

func TestCriticalPath_WalksToRootFromError(t *testing.T) {
	spans := []SpanSample{
		{SpanID: "a", Name: "POST /checkout", DurationMs: 1800},
		{SpanID: "b", ParentID: "a", Name: "cart.load", DurationMs: 200},
		{SpanID: "c", ParentID: "a", Name: "payment.charge", DurationMs: 980, Status: "error"},
		{SpanID: "d", ParentID: "c", Name: "POST psp.charge", DurationMs: 900, Status: "error"},
	}
	got := CriticalPath(spans)
	want := []string{"POST /checkout", "payment.charge", "POST psp.charge"}
	if len(got) != len(want) {
		t.Fatalf("got %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("got %v, want %v", got, want)
		}
	}
}
