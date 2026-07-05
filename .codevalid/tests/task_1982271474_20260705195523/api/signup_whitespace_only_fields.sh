#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="${CASE_SUFFIX:-$(date +%s)-$$}"
EMAIL="whitespace.${CASE_SUFFIX}@example.com"
TMP_DIR="$(mktemp -d)"
RESPONSE_FILE="$TMP_DIR/response.json"
STATUS_FILE="$TMP_DIR/status.txt"
trap 'rm -rf "$TMP_DIR"' EXIT

# Given
# The implementation only checks truthiness; whitespace-only strings are accepted when non-empty.
cat >"$TMP_DIR/request.json" <<EOF
{"name":"   ","email":"${EMAIL}","password":"validPass123"}
EOF

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data @"$TMP_DIR/request.json" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
grep -F '"name":"   "' "$RESPONSE_FILE" >/dev/null
grep -F '"email":"'"$EMAIL"'"' "$RESPONSE_FILE" >/dev/null
grep -F '"role":"buyer"' "$RESPONSE_FILE" >/dev/null

echo "CODEVALID_TEST_ASSERTION_OK:signup_whitespace_only_fields"

# Cleanup
# No cleanup required because this test uses a unique email and does not rely on shared state.
