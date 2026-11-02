#!/usr/bin/env python3
"""Clean up test data from the production remote store (textdb.dev)."""
import json
import os
import base64
import urllib.request

REMOTE_URL = os.environ.get("REMOTE_DB_URL", "")
if not REMOTE_URL:
    raise SystemExit("Set REMOTE_DB_URL env var (e.g. https://textdb.dev/api/data/<your-key>)")

# read
with urllib.request.urlopen(REMOTE_URL, timeout=30) as r:
    raw = r.read().decode().strip()
if raw.startswith("value="):
    raw = raw[6:]
padded = raw + "=" * (-len(raw) % 4)
data = json.loads(base64.urlsafe_b64decode(padded)) if raw else {"products": [], "orders": []}

# clean
before_p, before_o = len(data["products"]), len(data["orders"])
data["products"] = [p for p in data["products"] if p["name"] != "Live Test Product"]
data["orders"] = [o for o in data["orders"] if o.get("customerName") != "Live Test Customer"]
# restore basmati stock
for p in data["products"]:
    if p["name"] == "India Gate Basmati Rice":
        p["stock"] = 50

# write
payload = ("value=" + base64.urlsafe_b64encode(json.dumps(data).encode()).decode()).encode()
req = urllib.request.Request(REMOTE_URL, data=payload, method="POST")
with urllib.request.urlopen(req, timeout=30) as r:
    r.read()

print(f"cleaned: products {before_p} -> {len(data['products'])}, orders {before_o} -> {len(data['orders'])}")
