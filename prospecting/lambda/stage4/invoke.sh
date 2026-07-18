#!/usr/bin/env bash
# Invoke the apollo_stage_4 Lambda (Stage 4 fit scoring). Reads AWS creds from ../../.env.
# Synchronous — waits for the run and prints the JSON result.
#
# Usage:
#   ./invoke.sh                               # full run: both blocks (cdp + map), live
#   ./invoke.sh --blocks map                  # MAP only  (merges, preserves CDP)
#   ./invoke.sh --blocks cdp                   # CDP only
#   ./invoke.sh --blocks cdp,map               # explicit both
#   ./invoke.sh --dry-run                      # do everything but the upsert
#   ./invoke.sh --blocks map --max-uids 3 --dry-run   # cheap smoke test
#
# Notes: a full run probes 53 uids and can take a few minutes; MAP is credit-heavy
# (~40-70 credits). Use --dry-run / --max-uids first if unsure.
set -euo pipefail
cd "$(dirname "$0")"

FN=apollo_stage_4
ENV_FILE=../../.env

set -a; source <(grep -E '^AWS_(ACCESS|SECRET|REGION)' "$ENV_FILE"); set +a
export AWS_DEFAULT_REGION="${AWS_REGION:-ap-south-1}"

BLOCKS=""; DRY="false"; MAXU=""
while [ $# -gt 0 ]; do
  case "$1" in
    --blocks)   BLOCKS="${2:-}"; shift 2 ;;
    --dry-run)  DRY="true"; shift ;;
    --max-uids) MAXU="${2:-}"; shift 2 ;;
    -h|--help)  grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown arg: $1 (see --help)"; exit 1 ;;
  esac
done

PAYLOAD=$(mktemp); OUT=$(mktemp)
trap 'rm -f "$PAYLOAD" "$OUT"' EXIT

python3 - "$PAYLOAD" "$BLOCKS" "$DRY" "$MAXU" <<'PY'
import json, sys
_, path, blocks, dry, maxu = sys.argv
p = {}
if blocks: p["blocks"] = [b.strip() for b in blocks.split(",") if b.strip()]
if dry == "true": p["dry_run"] = True
if maxu: p["max_uids"] = int(maxu)
json.dump(p, open(path, "w"))
print("payload:", json.dumps(p) if p else "{}  (full run: both blocks, live upsert)")
PY

echo "invoking $FN ... (a full run can take a few minutes)"
aws lambda invoke --function-name "$FN" \
  --payload "file://$PAYLOAD" \
  --cli-read-timeout 900 \
  "$OUT" --query '{Status:StatusCode,FunctionError:FunctionError}' --output json

echo "--- response ---"
python3 -m json.tool "$OUT" 2>/dev/null || cat "$OUT"
echo
