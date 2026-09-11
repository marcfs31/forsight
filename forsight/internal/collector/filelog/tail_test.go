package filelog

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

type memSink struct{ logs []model.LogEntry }

func (m *memSink) WriteLogs(_ context.Context, logs []model.LogEntry) error {
	m.logs = append(m.logs, logs...)
	return nil
}

func TestReadOnce_ClassifiesErrorLines(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "app.log")
	body := "ready to serve\nERROR dial tcp 10.0.0.1:5432\n"
	if err := os.WriteFile(path, []byte(body), 0o600); err != nil {
		t.Fatal(err)
	}
	sink := &memSink{}
	n, err := readOnce(context.Background(), path, "app.log", 0, sink)
	if err != nil {
		t.Fatal(err)
	}
	if n == 0 {
		t.Fatal("read zero bytes")
	}
	if len(sink.logs) != 2 {
		t.Fatalf("got %d lines, want 2: %+v", len(sink.logs), sink.logs)
	}
	if sink.logs[0].Severity != model.LogSeverityInfo {
		t.Errorf("first severity = %s", sink.logs[0].Severity)
	}
	if sink.logs[1].Severity != model.LogSeverityError {
		t.Errorf("second severity = %s", sink.logs[1].Severity)
	}
	if sink.logs[1].Source != "app.log" {
		t.Errorf("source = %s", sink.logs[1].Source)
	}
}

func TestTail_StopsOnCancel(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "app.log")
	if err := os.WriteFile(path, []byte("hello\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	err := Tail(ctx, path, &memSink{})
	if err != context.DeadlineExceeded && err != context.Canceled {
		t.Fatalf("err = %v", err)
	}
}
