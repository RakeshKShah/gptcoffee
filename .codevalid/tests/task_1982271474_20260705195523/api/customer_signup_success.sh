#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="${CASE_SUFFIX:-$(date +%s)-$$}"
NAME="John Doe"
EMAIL="john.doe.${CASE_SUFFIX}@example.com"
PASSWORD="securePass123"
TMP_DIR="$(mktemp -d)"
RESPONSE_FILE="$TMP_DIR/response.json"
STATUS_FILE="$TMP_DIR/status.txt"
trap 'rm -rf "$TMP_DIR"' EXIT

# Given
cat >"$TMP_DIR/request.json" <<EOF
{"name":"${NAME}","email":"${EMAIL}","password":"${PASSWORD}"}
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
grep -F '"name":"John Doe"' "$RESPONSE_FILE" >/dev/null
grep -F '"email":"'"$EMAIL"'"' "$RESPONSE_FILE" >/dev/null
grep -F '"role":"buyer"' "$RESPONSE_FILE" >/dev/null
if grep -F '"password":' "$RESPONSE_FILE" >/dev/null; then
  echo "password leaked in signup response"
  exit 1
fi

echo "CODEVALID_TEST_ASSERTION_OK:customer_signup_success"

# Cleanup
# No cleanup required because this test uses a unique email and does not rely on shared state.
