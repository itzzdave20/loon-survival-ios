#!/usr/bin/env bash
set -euo pipefail

# Run script for the project: creates/activates the venv, installs deps, runs the game
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

# shellcheck source=/dev/null
source .venv/bin/activate

python -m pip install --upgrade pip setuptools wheel

if [ -f requirements.txt ]; then
  pip install -r requirements.txt
else
  pip install kivy
fi

python main.py
