// Package version holds botobs's build version — a plain string set at link
// time via -ldflags, not a Go module version (botobs isn't published as a Go
// module). See the "every release has a matching tag" invariant already
// established for the npm package; botobs's own release commit gets a
// "botobs-vX.Y.Z" tag that this value should match.
package version

// Version defaults to "dev" for a local `go build`/`go run`; the release
// build (see botobs/Makefile) overrides it with
// -ldflags "-X .../internal/version.Version=vX.Y.Z".
var Version = "dev"
