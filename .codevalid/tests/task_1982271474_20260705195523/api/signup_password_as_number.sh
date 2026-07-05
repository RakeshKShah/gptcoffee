#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="${CASE_SUFFIX:-$(date +%s)-$$}"
EMAIL="numeric.pass.${CASE_SUFFIX}@example.com"
TMP_DIR="$(mktemp -d)"
RESPONSE_FILE="$TMP_DIR/response.json"
STATUS_FILE="$TMP_DIR/status.txt"
trap 'rm -rf "$TMP_DIR"' EXIT

# Given
cat >"$TMP_DIR/request.json" <<EOF
{"name":"Numeric Pass","email":"${EMAIL}","password":123456}
EOF

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data @"$TMP_DIR/request.json" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
grep -F '"token":' "$RESPONSE_FILE" >/dev/null
grep -F '"name":"Numeric Pass"' "$RESPONSE_FILE" >/dev/null
grep -F '"email":"'"$EMAIL"'"' "$RESPONSE_FILE" >/dev/null
grep -F '"role":"buyer"' "$RESPONSE_FILE" >/dev/null

echo "CODEVALID_TEST_ASSERTION_OK:signup_password_as_number"

# Cleanup
# No cleanup required because this test uses a unique email and does not rely on shared state.
