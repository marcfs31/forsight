package forseer

import (
	"fmt"
	"strings"
	"testing"
)

// trainRealistic feeds the model a vocabulary that a substring rule gets
// wrong, so "the model beats the fallback" is a claim these tests can check
// rather than assert.
func trainRealistic(m *severityModel, rounds int) {
	info := []string{
		"request completed in 12ms",
		"no errors reported during the sweep",
		"error_rate 0 for checkout",
		"health probe ok",
		"recovered from the earlier failure and resumed",
		"cache warm, serving traffic",
	}
	warn := []string{
		"retrying upstream call after timeout",
		"queue depth above the soft limit",
		"certificate expires in 9 days",
	}
	errs := []string{
		"panic: nil map write in handler",
		"could not reach the database, giving up",
		"unhandled exception while parsing the payload",
		"connection refused by the payment service",
	}
	for i := 0; i < rounds; i++ {
		for _, line := range info {
			m.Learn(line, "info")
		}
		for _, line := range warn {
			m.Learn(line, "warn")
		}
		for _, line := range errs {
			m.Learn(line, "error")
		}
	}
}

func TestSeverityModel_ColdModelDeclinesRatherThanGuessing(t *testing.T) {
	m := newSeverityModel()

	if _, _, ok := m.Classify("panic: nil map write in handler"); ok {
		t.Fatal("a model that has learned nothing answered anyway; the caller must use its fallback")
	}
	if card := m.Card(); card.Ready {
		t.Fatal("an untrained model reported itself ready")
	}
}

func TestSeverityModel_BecomesReadyOnlyWithEnoughOfEnoughClasses(t *testing.T) {
	m := newSeverityModel()

	// One class, plenty of lines: still not ready. A stream that has only
	// ever logged info teaches nothing about what an error looks like.
	for i := 0; i < severityMinTrained*2; i++ {
		m.Learn(fmt.Sprintf("request %d completed cleanly", i), "info")
	}
	if m.Card().Ready {
		t.Fatal("model reported ready on a single-class stream")
	}

	for i := 0; i < severityMinPerClass; i++ {
		m.Learn(fmt.Sprintf("could not reach the database attempt %d", i), "error")
	}
	if !m.Card().Ready {
		t.Fatal("model still not ready after two well-populated classes")
	}
}

func TestSeverityModel_LearnsThisDeploymentsVocabulary(t *testing.T) {
	m := newSeverityModel()
	trainRealistic(m, 30)

	cases := []struct {
		line string
		want string
	}{
		{"panic: nil map write in the checkout handler", "error"},
		{"could not reach the database cluster", "error"},
		{"retrying upstream call after timeout", "warn"},
		{"request completed in 40ms", "info"},
		{"health probe ok", "info"},
	}
	for _, tc := range cases {
		got, confidence, ok := m.Classify(tc.line)
		if !ok {
			t.Errorf("declined to classify %q", tc.line)
			continue
		}
		if got != tc.want {
			t.Errorf("%q: got %q (confidence %.2f), want %q", tc.line, got, confidence, tc.want)
		}
	}
}

// The whole reason this model exists: a substring rule reads these as errors
// because the word is present, and the model reads them the way the
// application that wrote them meant them.
func TestSeverityModel_BeatsTheSubstringFallbackOnItsBlindSpot(t *testing.T) {
	m := newSeverityModel()
	trainRealistic(m, 30)

	for _, line := range []string{
		"no errors reported during the sweep",
		"error_rate 0 for checkout",
		"recovered from the earlier failure and resumed",
	} {
		if !strings.Contains(line, "error") && !strings.Contains(line, "fail") {
			t.Fatalf("test line %q no longer exercises the fallback's blind spot", line)
		}
		got, _, ok := m.Classify(line)
		if !ok {
			t.Errorf("declined to classify %q", line)
			continue
		}
		if got != "info" {
			t.Errorf("%q: got %q, want info — the substring rule's mistake was reproduced", line, got)
		}
	}
}

func TestSeverityModel_NeverTrainsOnBlankOrUnlabelledInput(t *testing.T) {
	m := newSeverityModel()

	m.Learn("could not reach the database", "")
	m.Learn("   ", "error")
	m.Learn("", "error")
	// Only punctuation and numbers: nothing a token can be made of.
	m.Learn("... 42 7 :: 9", "error")

	if trained := m.Card().Trained; trained != 0 {
		t.Fatalf("trained on %d unusable examples, want 0", trained)
	}
}

func TestSeverityModel_GradesItselfOnDataItHasNotSeenYet(t *testing.T) {
	m := newSeverityModel()
	trainRealistic(m, 40)

	card := m.Card()
	if card.Graded == 0 {
		t.Fatal("model reported no graded predictions; prequential scoring is not running")
	}
	if card.Accuracy < 0.8 {
		t.Errorf("prequential accuracy %.2f over %d predictions is too low to trust on a separable set", card.Accuracy, card.Graded)
	}
	if card.Accuracy > 1 {
		t.Errorf("accuracy %.2f is above 1", card.Accuracy)
	}
}

func TestSeverityModel_GradeWindowStaysBounded(t *testing.T) {
	m := newSeverityModel()
	trainRealistic(m, 200)

	card := m.Card()
	if card.Graded > severityGradeWindow {
		t.Fatalf("graded %d predictions, window is %d — the ring buffer is not bounded", card.Graded, severityGradeWindow)
	}
	if card.Trained <= severityGradeWindow {
		t.Fatalf("only %d trained examples; the test did not exceed the window", card.Trained)
	}
}

func TestSeverityModel_DeclinesWhenItIsNotConfident(t *testing.T) {
	m := newSeverityModel()
	// Same words, both classes, in equal measure: nothing separates them, so
	// the posterior cannot clear the confidence bar.
	for i := 0; i < severityMinTrained; i++ {
		m.Learn("the service handled the request", "info")
		m.Learn("the service handled the request", "error")
	}

	if _, confidence, ok := m.Classify("the service handled the request"); ok {
		t.Fatalf("answered with confidence %.2f on a genuinely ambiguous line", confidence)
	}
}

func TestSeverityModel_CardStatesWhatItReadsAndWhatReplacesIt(t *testing.T) {
	card := newSeverityModel().Card()

	if card.Name == "" || card.Job == "" {
		t.Fatal("card does not name its job")
	}
	if len(card.Reads) == 0 {
		t.Fatal("card declares no inputs; the input list is the contract")
	}
	if card.Fallback == "" {
		t.Fatal("card names no fallback, so the readiness gate means nothing")
	}
	if card.Accuracy != Unmeasured {
		t.Errorf("an ungraded model reported accuracy %.2f, want Unmeasured", card.Accuracy)
	}
}

func TestSeverityTokens_DropsNoiseAndBoundsItself(t *testing.T) {
	tokens := severityTokens("Request 4821 took 12.5ms for /api/v1/users?id=99")
	if len(tokens) == 0 {
		t.Fatal("no tokens from a normal line")
	}

	// Pure numbers carry no signal and would fill every bucket with noise.
	digits := severityTokens("4821 12 99 7")
	if len(digits) != 0 {
		t.Errorf("got %d tokens from an all-numeric line, want 0", len(digits))
	}

	long := severityTokens(strings.Repeat("alpha beta gamma delta ", 500))
	if len(long) > severityMaxTokens {
		t.Errorf("one line produced %d tokens, cap is %d", len(long), severityMaxTokens)
	}
}

func TestSeverityTokens_IsCaseInsensitive(t *testing.T) {
	lower := severityTokens("connection refused by the payment service")
	upper := severityTokens("CONNECTION REFUSED BY THE PAYMENT SERVICE")

	if len(lower) != len(upper) {
		t.Fatalf("case changed the token count: %d vs %d", len(lower), len(upper))
	}
	for i := range lower {
		if lower[i] != upper[i] {
			t.Fatalf("token %d differs by case: %d vs %d", i, lower[i], upper[i])
		}
	}
}
