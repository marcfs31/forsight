# botobs is a Go module inside the fors-observability-design-system repo —
# run `make` from this directory (botobs/), not the repo root.
#
# Building just the agent needs only Go (`make build-go`); building the real
# dashboard also needs Node, since it's a small React app on
# @marcfs31/fors-observability-design-system (see web/README.md and
# internal/api/dashboard.go's doc comment on why webdist/ is checked in).

VERSION ?= dev
LDFLAGS := -X github.com/marcfs31/fors-observability-design-system/botobs/internal/version.Version=$(VERSION)

.PHONY: build build-web build-go release dev test lint vet clean

# OS/arch pairs cross-compiled for a release — matches install.sh's
# "botobs_<os>_<arch>.tar.gz" naming exactly.
RELEASE_TARGETS := linux/amd64 linux/arm64 darwin/amd64 darwin/arm64

# Full release build: real dashboard + the agent binary.
build: build-web build-go

# Rebuilds the design system itself (one level up), then botobs/web against
# it, then copies the output into internal/api/webdist/ for go:embed. Run
# this after any change under botobs/web/ or to the design system's
# components — the diff it produces in webdist/ is expected, not a mistake.
build-web:
	cd .. && npm run build
	cd web && npm ci && npm run build
	rm -rf internal/api/webdist/assets
	cp -r web/dist/. internal/api/webdist/

build-go:
	mkdir -p bin
	go build -ldflags "$(LDFLAGS)" -o bin/botobs .

# Runs the agent directly against whatever's currently embedded in
# internal/api/webdist/ (the fallback page unless build-web has been run).
dev:
	go run . run

test:
	go test ./...

vet:
	go vet ./...

lint:
	golangci-lint run ./...

clean:
	rm -rf bin dist

# `make release VERSION=v0.1.0` — cross-compiles the real (build-web) binary
# for every target in RELEASE_TARGETS and tars each one up as
# dist/botobs_<os>_<arch>.tar.gz. Upload the result with:
#   gh release create botobs-$(VERSION) dist/*.tar.gz
# (No automated release workflow yet — see botobs/README.md's roadmap note.)
release: build-web
	@if [ "$(VERSION)" = "dev" ]; then \
		echo "release: pass an explicit VERSION, e.g. make release VERSION=v0.1.0" >&2; \
		exit 1; \
	fi
	mkdir -p dist
	@for target in $(RELEASE_TARGETS); do \
		os=$${target%/*}; arch=$${target#*/}; \
		echo "building $$os/$$arch..."; \
		GOOS=$$os GOARCH=$$arch go build -ldflags "$(LDFLAGS)" -o dist/botobs . || exit 1; \
		tar -czf dist/botobs_$${os}_$${arch}.tar.gz -C dist botobs; \
		rm dist/botobs; \
	done
	@ls -la dist/
