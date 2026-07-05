#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
CUSTOMER_NAME="Missing Total ${CASE_SUFFIX}"
CUSTOMER_EMAIL="missing-total.${CASE_SUFFIX}@example.test"
CUSTOMER_PASSWORD="secret-${CASE_SUFFIX}"
AUTH_RESPONSE="/tmp/order_handles_missing_item_total_auth_${CASE_SUFFIX}.json"
AUTH_STATUS_FILE="/tmp/order_handles_missing_item_total_auth_${CASE_SUFFIX}.status"
RESPONSE_FILE="/tmp/order_handles_missing_item_total_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/order_handles_missing_item_total_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$AUTH_RESPONSE" "$AUTH_STATUS_FILE" "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given — create an authenticated customer
curl -sS -o "$AUTH_RESPONSE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"${CUSTOMER_NAME}\",\"email\":\"${CUSTOMER_EMAIL}\",\"password\":\"${CUSTOMER_PASSWORD}\"}" \
  > "$AUTH_STATUS_FILE"
[ "$(cat "$AUTH_STATUS_FILE")" = "201" ]
TOKEN="$(jq -r '.token' "$AUTH_RESPONSE")"

# When — submit an order where one item has no total field and another has zero total
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${TOKEN}" \
  --data '{"items":[{"name":"Water","quantity":1},{"name":"Napkin","quantity":1,"total":0}]}' \
  > "$STATUS_FILE"

# Then — verify missing item totals default to 0 in the aggregate total
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
[ "$(jq -r '.order.total' "$RESPONSE_FILE")" = "0" ]
[ "$(jq -r '.order.items | length' "$RESPONSE_FILE")" = "2" ]
[ "$(jq -r '.order.items[0].name' "$RESPONSE_FILE")" = "Water" ]
[ "$(jq -r '.order.items[1].total' "$RESPONSE_FILE")" = "0" ]

echo "CODEVALID_TEST_ASSERTION_OK:order_handles_missing_item_total"

# Cleanup — unique account data only; no dedicated delete endpoint exists
