#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
EMAIL="buyer@gptcoffee.test"
TMP_DIR="$(mktemp -d)"
RESPONSE_FILE="$TMP_DIR/response.json"
STATUS_FILE="$TMP_DIR/status.txt"
trap 'rm -rf "$TMP_DIR"' EXIT

# Given
cat >"$TMP_DIR/request.json" <<EOF
{"name":"Existing User","email":"${EMAIL}","password":"validPass123"}
EOF

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data @"$TMP_DIR/request.json" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "409" ]
grep -F 'That email is already registered.' "$RESPONSE_FILE" >/dev/null

echo "CODEVALID_TEST_ASSERTION_OK:signup_duplicate_email_exact_match"

# Cleanup
# Stateless negative test; no cleanup required.
