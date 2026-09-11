package forseer

import (
	"strings"
	"unicode"
)

// ParseQuery turns a short operator phrase into FilterBar facets without an
// API key. "error logs from checkout" → status=error, source=checkout.
func ParseQuery(q string) []Facet {
	raw := strings.TrimSpace(q)
	if raw == "" {
		return nil
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
	case containsWord(lower, "error") || containsWord(lower, "fail") || containsWord(lower, "fatal"):
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
	return out
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
