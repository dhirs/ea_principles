#!/usr/bin/env bash
# Deploy/update the apollo_stage_4 Lambda. Zips the handler (no deps — stdlib + boto3),
# then create-or-update. AWS creds + function env values are read from ../../.env; secrets
# are passed to the AWS CLI via files, never printed.
set -euo pipefail
cd "$(dirname "$0")"

FN=apollo_stage_4
ROLE=arn:aws:iam::863372932275:role/lambda-execution-role
RUNTIME=python3.12
HANDLER=lambda_function.lambda_handler
ENV_FILE=../../.env

# AWS creds into this shell (not printed)
set -a; source <(grep -E '^AWS_(ACCESS|SECRET|REGION)' "$ENV_FILE"); set +a
export AWS_DEFAULT_REGION="${AWS_REGION:-ap-south-1}"

echo "zipping handler..."
rm -f function.zip
zip -q function.zip lambda_function.py

# Build the Lambda env-vars JSON from .env (values never echoed)
ENVJSON=$(mktemp)
trap 'rm -f "$ENVJSON"' EXIT
python3 - "$ENV_FILE" "$ENVJSON" <<'PY'
import json, sys
env={}
for line in open(sys.argv[1]):
    line=line.strip()
    if not line or line.startswith('#') or '=' not in line: continue
    k,_,v=line.partition('='); env[k.strip()]=v.strip().strip('"').strip("'")
vars={
  "APOLLO_API_KEY": env["APOLLO_API_KEY"],
  "SUPABASE_URL": env["SUPABASE_URL"],
  "SUPABASE_KEY": env["SUPABASE_KEY"],
  "S3_BUCKET_NAME": env.get("S3_BUCKET_NAME","datawhistl"),
  "TECH_S3_KEY": "companies/technologies/stage4_target_technologies.json",
  "PRODUCT": "cdp-selection",
  "RULES_VERSION": "area1-v2",
}
json.dump({"Variables":vars}, open(sys.argv[2],'w'))
PY

if aws lambda get-function --function-name "$FN" >/dev/null 2>&1; then
  echo "updating existing $FN..."
  aws lambda update-function-code --function-name "$FN" --zip-file fileb://function.zip >/dev/null
  aws lambda wait function-updated --function-name "$FN"
  aws lambda update-function-configuration --function-name "$FN" \
    --runtime "$RUNTIME" --handler "$HANDLER" --timeout 900 --memory-size 512 \
    --environment "file://$ENVJSON" >/dev/null
else
  echo "creating $FN..."
  aws lambda create-function --function-name "$FN" \
    --runtime "$RUNTIME" --role "$ROLE" --handler "$HANDLER" \
    --timeout 900 --memory-size 512 \
    --zip-file fileb://function.zip \
    --environment "file://$ENVJSON" >/dev/null
fi
aws lambda wait function-updated --function-name "$FN"
echo "deployed $FN"
