package api

import (
	"embed"
	"io/fs"
	"net/http"
)

// webdist holds the dashboard's static build output — a small React app
// (forsight/web) built on @marcfs31/forsight, the
// same design system this repo publishes. `go:embed` can't reach outside its
// own package directory, so `make build` copies web/dist's contents here
// before compiling (see the Makefile); what's checked into git is a minimal
// fallback page, so a bare `go build`/`go test` always works with no Node
// involved at all — only a *release* build needs the web toolchain.
//
//go:embed all:webdist
var webdist embed.FS

// DashboardHandler serves the embedded dashboard build (or its fallback
// page) at "/".
func DashboardHandler() http.Handler {
	sub, err := fs.Sub(webdist, "webdist")
	if err != nil {
		// Only possible if the embed directive above and this path drift
		// apart, which a build would already have caught.
		panic(err)
	}
	return http.FileServer(http.FS(sub))
}
