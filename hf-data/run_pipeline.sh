#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_TRANSFER_DIR="$SCRIPT_DIR/dataTransfer"
DATA_PARQUET_PATH="${1:-}"
SKIP_CONVERT_SCRIPT2="${SKIP_CONVERT_SCRIPT2:-0}"

log_step() {
  printf '\n==> %s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  fi
}

run_step() {
  local workdir="$1"
  shift
  printf '%s\n' "$*"
  (
    cd "$workdir"
    "$@"
  )
}

require_command python
require_command node

if [[ -n "$DATA_PARQUET_PATH" ]]; then
  cp "$DATA_PARQUET_PATH" "$DATA_TRANSFER_DIR/data.parquet"
  printf 'Copied parquet to %s\n' "$DATA_TRANSFER_DIR/data.parquet"
fi

required_files=(
  "$DATA_TRANSFER_DIR/data.parquet"
  "$DATA_TRANSFER_DIR/transfer.py"
  "$DATA_TRANSFER_DIR/convert.py"
  "$SCRIPT_DIR/filter_isolated_nodes.js"
  "$SCRIPT_DIR/convert_script.js"
)

for required_file in "${required_files[@]}"; do
  if [[ ! -f "$required_file" ]]; then
    printf 'Required file not found: %s\n' "$required_file" >&2
    exit 1
  fi
done

log_step 'Python parquet -> source.json'
run_step "$DATA_TRANSFER_DIR" python transfer.py

log_step 'Python source.json -> output_graph.json'
run_step "$DATA_TRANSFER_DIR" python convert.py

if [[ ! -f "$DATA_TRANSFER_DIR/output_graph.json" ]]; then
  printf 'Expected generated file not found: %s\n' "$DATA_TRANSFER_DIR/output_graph.json" >&2
  exit 1
fi

cp "$DATA_TRANSFER_DIR/output_graph.json" "$SCRIPT_DIR/output_graph.json"

log_step 'Filter isolated nodes'
run_step "$SCRIPT_DIR" node filter_isolated_nodes.js

log_step 'Generate layout and compliance artifacts'
run_step "$SCRIPT_DIR" node convert_script.js

if [[ "$SKIP_CONVERT_SCRIPT2" != "1" && -f "$SCRIPT_DIR/convert_script2.js" ]]; then
  log_step 'Run secondary conversion stage'
  run_step "$SCRIPT_DIR" node convert_script2.js
fi

printf '\nPipeline finished.\n'
printf 'Output: %s\n' "$SCRIPT_DIR/galaxy_output_data"
