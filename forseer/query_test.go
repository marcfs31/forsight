package forseer

import "testing"

func TestParseQuery_ErrorFromService(t *testing.T) {
	got := ParseQuery("show error logs from checkout-api")
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
	if got := ParseQuery("   "); len(got) != 0 {
		t.Fatalf("got %+v", got)
	}
}
