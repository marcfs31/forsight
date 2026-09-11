// Package filelog tails log files into model.LogEntry values so a default
// install can watch application logs without an OTLP SDK.
package filelog

import (
	"bufio"
	"context"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/marcfs31/forsight/forsight/internal/model"
)

// Sink is the write side of the store, declared here so this package does
// not import store.
type Sink interface {
	WriteLogs(ctx context.Context, logs []model.LogEntry) error
}

// Tail follows path until ctx is cancelled. New lines become log entries
// with Source set to the file's base name. Missing files are retried.
func Tail(ctx context.Context, path string, sink Sink) error {
	source := filepath.Base(path)
	var offset int64
	for {
		if err := ctx.Err(); err != nil {
			return err
		}
		n, err := readOnce(ctx, path, source, offset, sink)
		if err != nil && ctx.Err() == nil && !os.IsNotExist(err) {
			return err
		}
		if n > offset {
			offset = n
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(400 * time.Millisecond):
		}
	}
}

func readOnce(ctx context.Context, path, source string, offset int64, sink Sink) (int64, error) {
	f, err := os.Open(path)
	if err != nil {
		return offset, err
	}
	defer func() { _ = f.Close() }()
	if _, err := f.Seek(offset, io.SeekStart); err != nil {
		return offset, err
	}
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	var lines []model.LogEntry
	read := offset
	now := time.Now()
	for sc.Scan() {
		text := sc.Text()
		read += int64(len(text) + 1)
		if strings.TrimSpace(text) == "" {
			continue
		}
		lines = append(lines, model.LogEntry{
			Timestamp: now,
			Severity:  severityOf(text),
			Source:    source,
			Message:   text,
		})
	}
	if err := sc.Err(); err != nil {
		return offset, err
	}
	if len(lines) > 0 {
		if err := sink.WriteLogs(ctx, lines); err != nil {
			return offset, err
		}
	}
	return read, nil
}

func severityOf(line string) model.LogSeverity {
	lower := strings.ToLower(line)
	switch {
	case strings.Contains(lower, "fatal") || strings.Contains(lower, "error") || strings.Contains(lower, "fail"):
		return model.LogSeverityError
	case strings.Contains(lower, "warn"):
		return model.LogSeverityWarn
	case strings.Contains(lower, "debug"):
		return model.LogSeverityDebug
	default:
		return model.LogSeverityInfo
	}
}
