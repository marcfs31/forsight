# botobs/web

botobs's dashboard — a small React app built on
[`@marcfs31/fors-observability-design-system`](../..), the same design
system this repo publishes: `StatCard`, `LineChart`, `StatusDot`, and `Table`
render live data from botobs's own `/api/v1/*` endpoints.

It depends on the design system via a local `file:../..` reference in
`package.json`, not the published npm package — that needs a real `dist/` to
resolve, so build the design system first:

```bash
cd .. && npm run build   # from botobs/web, builds the design system (repo root)
npm install
npm run dev              # vite dev server; proxies /api to :8080 — run `go run . run` alongside it
npm run build             # production build → dist/
```

You won't usually run these directly — `make build-web` (in `botobs/`) does
all three steps and then copies `dist/` into `../internal/api/webdist/` for
`go:embed`. Run that (or `make build`) after changing anything here, and
commit the refreshed `webdist/` output alongside your change — CI's `web` job
fails the build otherwise (see `.github/workflows/botobs-ci.yml`'s diff
check).
