package forseer

import (
	"hash/fnv"
	"math"
	"sort"
	"strings"
	"sync"
)

// The severity model: given a log line that arrived without a level, say
// which level it is.
//
// The agent already had an answer — four substrings, `severityOf` in the
// file-tail collector. It is wrong in both directions and cannot be fixed by
// adding more substrings: "no errors reported" and "error_rate=0" are Info
// lines containing "error", "recovered from the failure" is an Info line
// containing "fail", and a service that logs "SEVERE" or "panic:" or writes
// in a language other than English gets Info for everything. Substrings
// cannot know which words matter in *this* system.
//
// The stream already knows. Logs arriving over OTLP carry a real severity
// set by the application, and those are free labelled examples of exactly
// the vocabulary this deployment uses. So the model learns from the labelled
// half of the stream and is applied to the unlabelled half. It never trains
// on an inferred severity — that would just teach it the substring rule it
// exists to replace.
//
// Multinomial naive Bayes over hashed tokens, trained online:
//   - It is a real fit to the data, not a threshold someone chose.
//   - State is bounded and tiny regardless of how large the vocabulary gets,
//     because tokens are hashed into a fixed number of buckets.
//   - It is stdlib-only, which the forseer module must stay.
//   - It updates per line, so a deployment that starts logging a new phrase
//     today is understood today.

const (
	// Bucket count for the hashing trick. Bounded memory: the model is
	// 4 classes x 4096 buckets of uint32, about 64KB, whatever the
	// vocabulary does. Collisions blur two words together, which costs a
	// little accuracy and buys a state size that cannot grow.
	severityBuckets = 4096
	// Before this many labelled lines the model is not Ready and the caller
	// keeps using the substring fallback.
	severityMinTrained = 200
	// ...and it must have seen at least this many of at least two different
	// levels. A stream that has only ever logged Info teaches nothing about
	// what an error looks like.
	severityMinPerClass = 20
	severityMinClasses  = 2
	// Prequential accuracy is measured over the most recent predictions.
	severityGradeWindow = 500
	// Below this posterior confidence the model declines to answer and the
	// caller uses the fallback, even when Ready. An unsure model is worth
	// less than a dumb rule that is at least predictable.
	severityMinConfidence = 0.60
	// Laplace smoothing, so a token never seen for a class does not zero the
	// whole product.
	severityAlpha = 0.5
	// Per-line cap, so one pathological 50KB line cannot dominate a class.
	severityMaxTokens = 64
)

type severityClass struct {
	counts  [severityBuckets]uint32
	total   uint64
	trained int
}

// severityModel is the trained classifier. Safe for concurrent use: the
// collector classifies on the tail goroutine while the store trains on the
// ingest path.
type severityModel struct {
	mu      sync.Mutex
	classes map[string]*severityClass
	trained int

	// Prequential grading: every labelled example is predicted before it is
	// learned, so the score is always on data the model had not yet seen.
	grades   []bool
	gradePos int
	graded   int
	hits     int
}

func newSeverityModel() *severityModel {
	return &severityModel{
		classes: make(map[string]*severityClass, 4),
		grades:  make([]bool, severityGradeWindow),
	}
}

// Learn trains on one line whose severity the source actually declared.
// Callers must not pass an inferred severity.
func (m *severityModel) Learn(message, severity string) {
	severity = strings.ToLower(strings.TrimSpace(severity))
	if severity == "" || strings.TrimSpace(message) == "" {
		return
	}
	tokens := severityTokens(message)
	if len(tokens) == 0 {
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Predict before training, so the grade is on unseen data.
	if predicted, _, ok := m.classifyLocked(tokens); ok {
		m.gradeLocked(predicted == severity)
	}

	class := m.classes[severity]
	if class == nil {
		class = &severityClass{}
		m.classes[severity] = class
	}
	for _, bucket := range tokens {
		class.counts[bucket]++
	}
	class.total += uint64(len(tokens))
	class.trained++
	m.trained++
}

// Classify answers for a line that arrived without a severity. The bool is
// false whenever the caller should use its fallback instead: the model is
// cold, the line has no usable tokens, or the posterior is not confident
// enough to be worth preferring over a predictable rule.
func (m *severityModel) Classify(message string) (string, float64, bool) {
	tokens := severityTokens(message)
	if len(tokens) == 0 {
		return "", 0, false
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if !m.readyLocked() {
		return "", 0, false
	}
	severity, confidence, ok := m.classifyLocked(tokens)
	if !ok || confidence < severityMinConfidence {
		return "", confidence, false
	}
	return severity, confidence, true
}

// classifyLocked is the naive Bayes argmax in log space, plus a confidence
// read from the normalised posterior. Callers hold m.mu.
func (m *severityModel) classifyLocked(tokens []uint32) (string, float64, bool) {
	if len(m.classes) == 0 {
		return "", 0, false
	}
	type scored struct {
		severity string
		logProb  float64
	}
	scores := make([]scored, 0, len(m.classes))
	denomTotal := float64(m.trained)
	for severity, class := range m.classes {
		// log P(class)
		logProb := math.Log(float64(class.trained) / denomTotal)
		denom := float64(class.total) + severityAlpha*severityBuckets
		for _, bucket := range tokens {
			logProb += math.Log((float64(class.counts[bucket]) + severityAlpha) / denom)
		}
		scores = append(scores, scored{severity: severity, logProb: logProb})
	}
	// Deterministic ordering: highest probability first, then by name so two
	// equally likely classes never flip between calls.
	sort.Slice(scores, func(i, j int) bool {
		if scores[i].logProb != scores[j].logProb {
			return scores[i].logProb > scores[j].logProb
		}
		return scores[i].severity < scores[j].severity
	})
	if len(scores) == 1 {
		return scores[0].severity, 1, true
	}
	// Softmax over the log probabilities, shifted by the max so the
	// exponentials cannot overflow. Confidence is the winner's share.
	top := scores[0].logProb
	sum := 0.0
	for _, s := range scores {
		sum += math.Exp(s.logProb - top)
	}
	if sum == 0 || math.IsInf(sum, 0) || math.IsNaN(sum) {
		return scores[0].severity, 0, false
	}
	return scores[0].severity, 1 / sum, true
}

func (m *severityModel) gradeLocked(hit bool) {
	if m.graded == len(m.grades) {
		// Window is full: the entry about to be overwritten leaves the score.
		if m.grades[m.gradePos] {
			m.hits--
		}
	} else {
		m.graded++
	}
	m.grades[m.gradePos] = hit
	if hit {
		m.hits++
	}
	m.gradePos = (m.gradePos + 1) % len(m.grades)
}

func (m *severityModel) readyLocked() bool {
	if m.trained < severityMinTrained {
		return false
	}
	classes := 0
	for _, class := range m.classes {
		if class.trained >= severityMinPerClass {
			classes++
		}
	}
	return classes >= severityMinClasses
}

// Card implements Model.
func (m *severityModel) Card() Card {
	m.mu.Lock()
	defer m.mu.Unlock()
	accuracy := Unmeasured
	if m.graded > 0 {
		accuracy = float64(m.hits) / float64(m.graded)
	}
	return Card{
		Name:     "log severity",
		Job:      "Give a log line that arrived without a level the level this deployment would have given it.",
		Reads:    []string{"log message text"},
		Fallback: "four-substring match on error/warn/debug",
		Ready:    m.readyLocked(),
		Trained:  m.trained,
		Accuracy: accuracy,
		Graded:   m.graded,
	}
}

// severityTokens lowercases, splits on anything that is not a letter or
// digit, and hashes each surviving token into a bucket.
//
// Numbers are dropped on purpose. A request id, a duration and a byte count
// are all unique per line, so they teach the model nothing and would fill
// every bucket with noise — the log miner templates them away for the same
// reason. One-character tokens go too: they are punctuation debris far more
// often than they are words.
func severityTokens(message string) []uint32 {
	if len(message) > 8192 {
		message = message[:8192]
	}
	buckets := make([]uint32, 0, 32)
	var word strings.Builder
	digitsOnly := true

	flush := func() {
		defer func() {
			word.Reset()
			digitsOnly = true
		}()
		if word.Len() < 2 || digitsOnly {
			return
		}
		if len(buckets) >= severityMaxTokens {
			return
		}
		h := fnv.New32a()
		_, _ = h.Write([]byte(word.String()))
		buckets = append(buckets, h.Sum32()%severityBuckets)
	}

	for _, r := range message {
		switch {
		case r >= 'a' && r <= 'z':
			word.WriteRune(r)
			digitsOnly = false
		case r >= 'A' && r <= 'Z':
			word.WriteRune(r - 'A' + 'a')
			digitsOnly = false
		case r >= '0' && r <= '9':
			word.WriteRune(r)
		default:
			flush()
		}
	}
	flush()
	return buckets
}
