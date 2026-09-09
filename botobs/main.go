// Command botobs is a self-contained observability agent: it collects host
// and (optionally) Docker container metrics, accepts OTLP metrics/traces
// from instrumented apps, stores everything in an embedded store, and serves
// a query API plus a dashboard — one binary, no external dependencies.
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/marcfs31/fors-observability-design-system/botobs/cmd"
)

func main() {
	if err := cmd.Execute(context.Background()); err != nil {
		fmt.Fprintln(os.Stderr, "botobs:", err)
		os.Exit(1)
	}
}
