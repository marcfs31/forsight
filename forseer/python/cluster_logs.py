#!/usr/bin/env python3
"""Fetch logs from a running forsight agent and print Drain-style templates.

Statistical clustering already runs inside the Go agent
(GET /api/v1/forseer/clusters). This script is the Python-side twin for
notebooks and trainers that should not import the Go module.

Usage:
    python3 cluster_logs.py [http://localhost:8080]
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from collections import Counter

UUID = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)
IPV4 = re.compile(r"\b\d{1,3}(?:\.\d{1,3}){3}\b")
HEX = re.compile(r"\b0x[0-9a-fA-F]+\b")
NUM = re.compile(r"\b\d+(?:\.\d+)?\b")


def template_of(message: str) -> str:
    s = UUID.sub("<*>", message)
    s = IPV4.sub("<*>", s)
    s = HEX.sub("<*>", s)
    s = NUM.sub("<*>", s)
    return " ".join(s.split())


def main() -> int:
    base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    url = base.rstrip("/") + "/api/v1/logs"
    with urllib.request.urlopen(url, timeout=10) as resp:
        logs = json.load(resp)
    counts: Counter[str] = Counter()
    for entry in logs:
        tmpl = template_of(str(entry.get("message", "")))
        if tmpl:
            counts[tmpl] += 1
    if not counts:
        print("no logs yet")
        return 0
    for tmpl, n in counts.most_common():
        print(f"{n:6d}  {tmpl}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
