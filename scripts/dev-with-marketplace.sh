#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CORE_DIR="${ROOT_DIR}/luxsequencer-core"
MARKETPLACE_DIR="${ROOT_DIR}/core-renderers"
CLEAN_START=false

if [ "${1:-}" = "--clean" ]; then
  CLEAN_START=true
fi

PIDS=()

is_running() {
  local pattern="$1"
  pgrep -f "$pattern" >/dev/null 2>&1
}

kill_if_running() {
  local pattern="$1"
  if pgrep -f "$pattern" >/dev/null 2>&1; then
    pkill -f "$pattern" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  if [ "${#PIDS[@]}" -gt 0 ]; then
    echo ""
    echo "Stopping local dev processes..."
    kill "${PIDS[@]}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if [ ! -d "$MARKETPLACE_DIR" ]; then
  echo "Marketplace repo not found: $MARKETPLACE_DIR"
  exit 1
fi

if [ ! -d "$CORE_DIR" ]; then
  echo "Core repo not found: $CORE_DIR"
  exit 1
fi

if [ "$CLEAN_START" = true ]; then
  echo "Cleaning existing dev servers..."
  kill_if_running "${MARKETPLACE_DIR}.*vite"
  kill_if_running "${CORE_DIR}.*vite"
fi

if is_running "${MARKETPLACE_DIR}.*vite"; then
  echo "Marketplace server already running."
else
  echo "Starting marketplace server (core-renderers)..."
  (
    cd "$MARKETPLACE_DIR"
    npm run dev
  ) &
  PIDS+=("$!")
fi

if is_running "${CORE_DIR}.*vite"; then
  echo "Core app server already running."
else
  echo "Starting core app server (luxsequencer-core)..."
  (
    cd "$CORE_DIR"
    npm run dev
  ) &
  PIDS+=("$!")
fi

if [ "${#PIDS[@]}" -eq 0 ]; then
  echo "Both servers are already running."
  exit 0
fi

echo ""
echo "Dev environment is running. Press Ctrl+C to stop launched processes."
wait
