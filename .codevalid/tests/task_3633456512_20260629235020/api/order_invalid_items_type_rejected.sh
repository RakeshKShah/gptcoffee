#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
EMAIL="invalid-items-${CASE_SUFFIX}@example.com"
NAME="Alice ${CASE_SUFFIX}"
PASSWORD="pass-${CASE_SUFFIX}-123"
TMP_DIR="$(mktemp -d)"
SIGNUP_BODY="$TMP_DIR/signup.json"
RESPONSE_BODY="$TMP_DIR/response.json"
STATUS_FILE="$TMP_DIR/response.status"
cleanup_files() {
  rm -rf "$TMP_DIR"
}
trap cleanup_files EXIT

# Given
SIGNUP_STATUS="$(curl -sS -o "$SIGNUP_BODY" -w '%{http_code}' -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"${NAME}\",\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")"
[ "$SIGNUP_STATUS" = "201" ]
TOKEN="$(jq -r '.token' "$SIGNUP_BODY")"
[ -n "$TOKEN" ]
[ "$TOKEN" != "null" ]

# When
curl -sS -o "$RESPONSE_BODY" -w '%{http_code}' -X POST "$BASE_URL/api/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  --data '{"items":{"item1":"Latte"}}' > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "400" ]
jq -e '.message == "Order must include at least one item."' "$RESPONSE_BODY" >/dev/null

echo "CODEVALID_TEST_ASSERTION_OK:order_invalid_items_type_rejected"

# Cleanup
# No public API exists to delete created users; only temporary files are removed by trap.
