#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="${CASE_SUFFIX:-$(date +%s)-$$}"
EMAIL="response.test.${CASE_SUFFIX}@example.com"
TMP_DIR="$(mktemp -d)"
RESPONSE_FILE="$TMP_DIR/response.json"
STATUS_FILE="$TMP_DIR/status.txt"
trap 'rm -rf "$TMP_DIR"' EXIT

# Given
cat >"$TMP_DIR/request.json" <<EOF
{"name":"Response Test","email":"${EMAIL}","password":"testPass123"}
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
grep -E '"id":"buyer-[0-9]+"' "$RESPONSE_FILE" >/dev/null
grep -F '"name":"Response Test"' "$RESPONSE_FILE" >/dev/null
grep -F '"email":"'"$EMAIL"'"' "$RESPONSE_FILE" >/dev/null
grep -F '"role":"buyer"' "$RESPONSE_FILE" >/dev/null
if grep -F '"password":' "$RESPONSE_FILE" >/dev/null; then
  echo "password leaked in public user response"
  exit 1
fi

echo "CODEVALID_TEST_ASSERTION_OK:signup_response_structure"

# Cleanup
# No cleanup required because this test uses a unique email and does not rely on shared state.
