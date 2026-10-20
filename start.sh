#!/usr/bin/env sh
# Starts Parsons Puzzles for local development (macOS / Linux).
# This file only runs "npm start". All the logic is in scripts/dev.mjs, plain
# JavaScript you can read first. It installs nothing without asking.
# Options are passed through, e.g.  ./start.sh --web-only
set -e
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 22 or newer is required: https://nodejs.org/" >&2
  exit 1
fi
exec npm start -- "$@"
