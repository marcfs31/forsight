// Package version holds forsight's build version — a plain string set at link
// time via -ldflags, not a Go module version (forsight isn't published as a Go
// module). See the "every release has a matching tag" invariant already
// established for the npm package; forsight's own release commit gets a
// "forsight-vX.Y.Z" tag that this value should match.
package version

// Version defaults to "dev" for a local `go build`/`go run`; the release
// build (see forsight/Makefile) overrides it with
// -ldflags "-X .../internal/version.Version=vX.Y.Z".
var Version = "dev"
