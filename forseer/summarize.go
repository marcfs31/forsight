package forseer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const xaiBaseURL = "https://api.x.ai/v1"
const grokModel = "grok-4.5"

// APIKeyFromEnv returns the SpaceXAI key (xAI). Empty means LLM summary is off;
// statistical insights still run.
func APIKeyFromEnv() string {
	return strings.TrimSpace(os.Getenv("XAI_API_KEY"))
}

// Summarize asks Grok for a short operator-facing paragraph about the current
// insights and log clusters. Caller must pass a non-empty apiKey.
func Summarize(ctx context.Context, insights []Insight, clusters []Cluster, apiKey string) (string, error) {
	if apiKey == "" {
		return "", fmt.Errorf("forseer: XAI_API_KEY is empty")
	}
	if len(insights) == 0 && len(clusters) == 0 {
		return "No Forseer anomalies right now. Collection looks within rolling baselines.", nil
	}
	var b strings.Builder
	b.WriteString("Summarize these observability findings for an on-call engineer in at most 4 sentences. ")
	b.WriteString("Do not invent metrics, logs, or traces that are not listed. Name likely next checks.\n")
	for _, ins := range insights {
		fmt.Fprintf(&b, "- [%s/%s] %s (metric %s value %g) %s\n", ins.Kind, ins.Severity, ins.Title, ins.Metric, ins.Value, ins.Description)
	}
	if len(clusters) > 0 {
		b.WriteString("Top log templates:\n")
		limit := 8
		if len(clusters) < limit {
			limit = len(clusters)
		}
		for _, c := range clusters[:limit] {
			fmt.Fprintf(&b, "- %d hits (%d errors) from %s: %s\n", c.Count, c.ErrorCount, c.Source, c.Template)
		}
	}

	body, err := json.Marshal(map[string]any{
		"model": grokModel,
		"messages": []map[string]string{
			{"role": "user", "content": b.String()},
		},
	})
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, xaiBaseURL+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer func() { _ = resp.Body.Close() }()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("forseer: xAI %s: %s", resp.Status, bytes.TrimSpace(raw))
	}
	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", err
	}
	if len(parsed.Choices) == 0 || parsed.Choices[0].Message.Content == "" {
		return "", fmt.Errorf("forseer: empty Grok response")
	}
	return parsed.Choices[0].Message.Content, nil
}
