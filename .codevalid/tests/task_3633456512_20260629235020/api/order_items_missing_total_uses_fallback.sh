#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
EMAIL="missing-total-${CASE_SUFFIX}@example.com"
NAME="Bob ${CASE_SUFFIX}"
PASSWORD="pass-${CASE_SUFFIX}-123"
TMP_DIR="$(mktemp -d)"
SIGNUP_BODY="$TMP_DIR/signup.json"
ORDER_BODY="$TMP_DIR/order.json"
ORDER_STATUS="$TMP_DIR/order.status"
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
curl -sS -o "$ORDER_BODY" -w '%{http_code}' -X POST "$BASE_URL/api/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  --data '{"items":[{"id":"item-001","name":"Espresso","quantity":1,"total":3.0},{"id":"item-002","name":"Muffin","quantity":1}]}' > "$ORDER_STATUS"

# Then
STATUS="$(cat "$ORDER_STATUS")"
[ "$STATUS" = "201" ]
jq -e '.order.total == 3' "$ORDER_BODY" >/dev/null
jq -e '.order.items | length == 2' "$ORDER_BODY" >/dev/null
jq -e '.order.items[0].name == "Espresso" and .order.items[0].total == 3' "$ORDER_BODY" >/dev/null
jq -e '.order.items[1].name == "Muffin" and (.order.items[1] | has("total") | not)' "$ORDER_BODY" >/dev/null
jq -e '.order.status == "Placed"' "$ORDER_BODY" >/dev/null

echo "CODEVALID_TEST_ASSERTION_OK:order_items_missing_total_uses_fallback"

# Cleanup
# No public API exists to delete created users/orders; only temporary files are removed by trap.
