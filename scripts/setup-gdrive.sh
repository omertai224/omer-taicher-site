#!/bin/bash
# Google Drive setup script - runs automatically at session start
# Decodes credentials from GDRIVE_CREDS_B64 env var or .gdrive-creds file

set -e

CONFIG_DIR="/root/.config/gws"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CREDS_FILE="$REPO_DIR/.gdrive-creds"

mkdir -p "$CONFIG_DIR"

# Read base64 credentials from env var, file, or extract from CLAUDE.md
CREDS_B64=""
if [ -n "$GDRIVE_CREDS_B64" ]; then
  CREDS_B64="$GDRIVE_CREDS_B64"
elif [ -f "$CREDS_FILE" ]; then
  CREDS_B64=$(cat "$CREDS_FILE")
elif [ -f "$REPO_DIR/CLAUDE.md" ]; then
  # Auto-extract credentials from CLAUDE.md
  CREDS_B64=$(python3 -c "
import re
with open('$REPO_DIR/CLAUDE.md') as f: text = f.read()
m = re.search(r'### Credentials \(base64\)\s*\n\`\`\`\s*\n(.+?)\s*\n\`\`\`', text)
if m: print(m.group(1))
" 2>/dev/null)
  if [ -n "$CREDS_B64" ]; then
    echo "$CREDS_B64" > "$CREDS_FILE"
    echo "Google Drive: created .gdrive-creds from CLAUDE.md"
  fi
fi

if [ -z "$CREDS_B64" ]; then
  echo "ERROR: No credentials found. Set GDRIVE_CREDS_B64 env var or create $CREDS_FILE"
  exit 1
fi

# Decode and extract values
DECODED=$(echo "$CREDS_B64" | base64 -d)
CLIENT_ID=$(echo "$DECODED" | python3 -c "import sys,json; print(json.load(sys.stdin)['client_id'])")
CLIENT_SECRET=$(echo "$DECODED" | python3 -c "import sys,json; print(json.load(sys.stdin)['client_secret'])")
REFRESH_TOKEN=$(echo "$DECODED" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])")
PROJECT_ID=$(echo "$DECODED" | python3 -c "import sys,json; print(json.load(sys.stdin)['project_id'])")

# Write OAuth client config
cat > "$CONFIG_DIR/client_secret.json" << EOF
{"installed":{"client_id":"$CLIENT_ID","project_id":"$PROJECT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"$CLIENT_SECRET","redirect_uris":["http://localhost"]}}
EOF

# Refresh access token
RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "grant_type=refresh_token" 2>/dev/null)

NEW_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "" ]; then
  cat > "$CONFIG_DIR/credentials.json" << EOF
{"access_token":"$NEW_TOKEN","refresh_token":"$REFRESH_TOKEN","token_type":"Bearer"}
EOF
  echo "Google Drive: authenticated as omertaidats@gmail.com"
else
  echo "Google Drive: WARNING - token refresh failed"
fi

# Install gdrive helper
cp "$SCRIPT_DIR/gdrive.sh" /usr/local/bin/gdrive 2>/dev/null || true
chmod +x /usr/local/bin/gdrive 2>/dev/null || true

# Install GWS CLI if not present
if ! command -v gws &> /dev/null; then
  echo "Installing GWS CLI..."
  curl -sL "https://github.com/googleworkspace/cli/releases/download/v0.18.1/gws-x86_64-unknown-linux-gnu.tar.gz" -o /tmp/gws.tar.gz 2>/dev/null
  cd /tmp && tar -xzf gws.tar.gz 2>/dev/null
  mv /tmp/gws-x86_64-unknown-linux-gnu/gws /usr/local/bin/gws 2>/dev/null || true
  chmod +x /usr/local/bin/gws 2>/dev/null || true
  rm -rf /tmp/gws.tar.gz /tmp/gws-x86_64-unknown-linux-gnu
  echo "GWS CLI installed"
fi

echo "Google Drive setup complete!"
