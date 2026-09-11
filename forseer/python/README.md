# Forseer Python / ML tools

Home for Python or ML work that consumes Forsight data — training sets,
notebooks, local models, graders.

Talk to a running agent:

```
GET http://localhost:8080/api/v1/metrics
GET http://localhost:8080/api/v1/traces
GET http://localhost:8080/api/v1/logs
GET http://localhost:8080/api/v1/forseer/insights
GET http://localhost:8080/api/v1/forseer/clusters
```

`cluster_logs.py` is a stdlib-only twin of the Go Drain-lite miner, for
notebooks that should not import the Go module. Statistical detection
already ships in the Go module at the folder above; use Python here when
a job needs numpy/pandas/a trainer that does not belong in the single
static `forsight` binary.

Do not put model weights or API keys in this repo.
