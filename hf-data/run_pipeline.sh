#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_TRANSFER_DIR="$SCRIPT_DIR/dataTransfer"
DATA_PARQUET_PATH="${1:-}"
SKIP_CONVERT_SCRIPT2="${SKIP_CONVERT_SCRIPT2:-0}"
NODE_HEAP_MB="${NODE_HEAP_MB:-8192}"
KEEP_INTERMEDIATES="${KEEP_INTERMEDIATES:-0}"
NODE_MEMORY_ARGS=("--max-old-space-size=${NODE_HEAP_MB}")
INTERMEDIATE_FILES=(
  "$DATA_TRANSFER_DIR/source.json"
  "$DATA_TRANSFER_DIR/output_graph.json"
  "$SCRIPT_DIR/output_graph.json"
  "$SCRIPT_DIR/output_graph_filtered.json"
)

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

cleanup_intermediates() {
  local path
  for path in "${INTERMEDIATE_FILES[@]}"; do
    if [[ -f "$path" ]]; then
      rm -f "$path"
      printf 'Removed intermediate: %s\n' "$path"
    fi
  done
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

cleanup_on_exit() {
  if [[ "$KEEP_INTERMEDIATES" != "1" ]]; then
    log_step 'Cleanup intermediates'
    cleanup_intermediates
  fi
}

trap cleanup_on_exit EXIT

log_step 'Python parquet -> source.json'
run_step "$DATA_TRANSFER_DIR" python transfer.py

log_step 'Python source.json -> output_graph.json'
run_step "$DATA_TRANSFER_DIR" python convert.py

if [[ ! -f "$DATA_TRANSFER_DIR/output_graph.json" ]]; then
  printf 'Expected generated file not found: %s\n' "$DATA_TRANSFER_DIR/output_graph.json" >&2
  exit 1
fi

cp "$DATA_TRANSFER_DIR/output_graph.json" "$SCRIPT_DIR/output_graph.json"

log_step "Filter isolated nodes (Node heap: ${NODE_HEAP_MB} MB)"
run_step "$SCRIPT_DIR" node "${NODE_MEMORY_ARGS[@]}" filter_isolated_nodes.js

log_step "Generate layout and compliance artifacts (Node heap: ${NODE_HEAP_MB} MB)"
run_step "$SCRIPT_DIR" node "${NODE_MEMORY_ARGS[@]}" convert_script.js

if [[ "$SKIP_CONVERT_SCRIPT2" != "1" && -f "$SCRIPT_DIR/convert_script2.js" ]]; then
  log_step "Run secondary conversion stage (Node heap: ${NODE_HEAP_MB} MB)"
  run_step "$SCRIPT_DIR" node "${NODE_MEMORY_ARGS[@]}" convert_script2.js
fi

printf '\nPipeline finished.\n'
printf 'Output: %s\n' "$SCRIPT_DIR/galaxy_output_data"
