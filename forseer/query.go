package forseer

import (
	"strings"
	"unicode"
)

// ParseQuery turns a short operator phrase into FilterBar facets without an
// API key. "error logs from checkout" → status=error, source=checkout.
//
// Its "status" facet matches LogEntry.severity (debug/info/warn/error) —
// that's what FilterBar filters here — not Insight.Severity
// (info/warning/critical), the vocabulary AlertList and Timeline use
// elsewhere in this dashboard. "critical" and "severe" are mapped onto the
// error-class status value so the word the rest of the UI trains users to
// type also works in this box.
//
// matched reports whether q was recognized by this grammar at all. An empty
// facet slice is ambiguous on its own — it's what both an empty q and an
// unrecognized phrase return — so callers that need to tell a no-op (nothing
// typed) apart from a miss (something typed, nothing understood) should use
// matched instead of len(facets).
func ParseQuery(q string) (facets []Facet, matched bool) {
	raw := strings.TrimSpace(q)
	if raw == "" {
		return nil, false
	}
	lower := strings.ToLower(raw)
	var out []Facet
	seen := map[string]bool{}
	add := func(f Facet) {
		key := f.Key + "=" + f.Value
		if seen[key] {
			return
		}
		seen[key] = true
		out = append(out, f)
	}
	switch {
	case containsWord(lower, "error") || containsWord(lower, "fail") || containsWord(lower, "fatal") ||
		containsWord(lower, "critical") || containsWord(lower, "severe"):
		add(Facet{Key: "status", Label: "Status", Value: "error"})
	case containsWord(lower, "warn") || containsWord(lower, "warning"):
		add(Facet{Key: "status", Label: "Status", Value: "warn"})
	case containsWord(lower, "debug"):
		add(Facet{Key: "status", Label: "Status", Value: "debug"})
	}
	if i := strings.Index(lower, "from "); i >= 0 {
		rest := strings.Fields(raw[i+5:])
		if len(rest) > 0 {
			src := strings.Trim(rest[0], `"'.,`)
			if src != "" {
				add(Facet{Key: "source", Label: "Source", Value: src})
			}
		}
	}
	return out, len(out) > 0
}

func containsWord(haystack, word string) bool {
	for _, tok := range strings.FieldsFunc(haystack, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsNumber(r)
	}) {
		if tok == word {
			return true
		}
	}
	return false
}
