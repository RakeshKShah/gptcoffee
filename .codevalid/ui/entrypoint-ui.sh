#!/bin/sh
# Entrypoint for the GPT Coffee UI Playwright test container.
# 1. Starts the mock API server in the background on port 4100.
# 2. Waits until the mock server is healthy.
# 3. Executes the Playwright command passed as arguments.

set -e

MOCK_PORT="${MOCK_API_PORT:-4100}"
MOCK_SERVER_FILE="/app/.codevalid/ui/mock/mock-server.js"

echo "[entrypoint-ui] Starting mock API server on port ${MOCK_PORT}..."
node "${MOCK_SERVER_FILE}" &
MOCK_PID=$!

# Wait for mock server to be ready (max 30s)
echo "[entrypoint-ui] Waiting for mock server to be ready..."
i=0
until wget -q -O /dev/null "http://localhost:${MOCK_PORT}/api/health" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "[entrypoint-ui] ERROR: mock server did not start in 30 seconds" >&2
    kill "$MOCK_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done
echo "[entrypoint-ui] Mock server is ready."

# Execute the playwright command (passed as ENTRYPOINT args)
exec "$@"
