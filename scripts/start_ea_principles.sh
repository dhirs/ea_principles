#!/usr/bin/env bash
# EA principles app (S3 standards viewer) -> http://localhost:3000
set -e
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd "$(dirname "$0")/../s3-json-viewer"
echo "Starting EA principles app on http://localhost:3000 ..."
npm run dev
