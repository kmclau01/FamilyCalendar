#!/usr/bin/env bash
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

npm start &
SERVER_PID=$!

# Give Express some time to bind the port
sleep 2

#Launch fill-screen chrome kiosk pointing to the local server
google-chrome --kiosk --no-first-run http://localhost:3000 || chromium --kiosk http://localhost:3000

kill "$SERVER_PID" 2>/dev/null || true