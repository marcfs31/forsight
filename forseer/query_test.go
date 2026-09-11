package forseer

import "testing"

func TestParseQuery_ErrorFromService(t *testing.T) {
	got, matched := ParseQuery("show error logs from checkout-api")
	if !matched {
		t.Fatalf("matched = false, want true for %+v", got)
	}
	if len(got) != 2 {
		t.Fatalf("got %+v, want status+source", got)
	}
	if got[0].Key != "status" || got[0].Value != "error" {
		t.Errorf("first = %+v, want status=error", got[0])
	}
	if got[1].Key != "source" || got[1].Value != "checkout-api" {
		t.Errorf("second = %+v, want source=checkout-api", got[1])
	}
}

func TestParseQuery_Empty(t *testing.T) {
	got, matched := ParseQuery("   ")
	if len(got) != 0 {
		t.Fatalf("got %+v", got)
	}
	if matched {
		t.Errorf("matched = true, want false for empty query")
	}
}

// AlertList/Timeline use Insight.Severity's vocabulary (critical/warning/
// info), not this grammar's status values (error/warn/debug) — "critical"
// and "severe" must still resolve to the error-class status so the word the
// rest of the dashboard trains a user to type also works in this box.
func TestParseQuery_CriticalMapsToErrorStatus(t *testing.T) {
	got, matched := ParseQuery("critical errors from checkout-api")
	if !matched {
		t.Fatalf("matched = false, want true for %+v", got)
	}
	if len(got) == 0 || got[0].Key != "status" || got[0].Value != "error" {
		t.Fatalf("got %+v, want first facet status=error", got)
	}
}

func TestParseQuery_SevereMapsToErrorStatus(t *testing.T) {
	got, matched := ParseQuery("severe issues from payments-api")
	if !matched {
		t.Fatalf("matched = false, want true for %+v", got)
	}
	if len(got) == 0 || got[0].Key != "status" || got[0].Value != "error" {
		t.Fatalf("got %+v, want first facet status=error", got)
	}
}

func TestParseQuery_CriticalAlone(t *testing.T) {
	got, matched := ParseQuery("critical")
	if !matched {
		t.Fatalf("matched = false, want true for %+v", got)
	}
	if len(got) != 1 || got[0].Key != "status" || got[0].Value != "error" {
		t.Fatalf("got %+v, want [status=error]", got)
	}
}

// A non-empty phrase this grammar doesn't recognize must come back
// unmatched, not merely with an empty facet slice — callers (the query
// handler, and App.tsx's submit handler) rely on matched to tell "nothing
// typed" apart from "typed something we didn't understand".
func TestParseQuery_Unrecognized_ReturnsUnmatched(t *testing.T) {
	got, matched := ParseQuery("what is happening today")
	if matched {
		t.Errorf("matched = true, want false for unrecognized phrase, got %+v", got)
	}
	if len(got) != 0 {
		t.Errorf("got %+v, want no facets", got)
	}
}

func TestParseQuery_FromWithoutRecognizedStatus(t *testing.T) {
	got, matched := ParseQuery("logs from checkout-api")
	if !matched {
		t.Fatalf("matched = false, want true for %+v", got)
	}
	if len(got) != 1 || got[0].Key != "source" || got[0].Value != "checkout-api" {
		t.Fatalf("got %+v, want [source=checkout-api]", got)
	}
}
