#!/usr/bin/env bash
# Supabase leads CRM backend -> http://localhost:3001
set -e
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd "$(dirname "$0")/../hubspot/ui"
echo "Starting Supabase leads UI on http://localhost:3001 ..."
npm run dev
