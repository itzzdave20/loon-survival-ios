#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

port="${1:-8000}"
python3 webapp/server.py --port "$port"
