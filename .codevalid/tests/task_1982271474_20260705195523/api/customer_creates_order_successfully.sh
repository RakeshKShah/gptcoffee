#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
CUSTOMER_NAME="Jane Doe ${CASE_SUFFIX}"
CUSTOMER_EMAIL="jane.doe.${CASE_SUFFIX}@example.test"
CUSTOMER_PASSWORD="secret-${CASE_SUFFIX}"
AUTH_RESPONSE="/tmp/customer_creates_order_successfully_auth_${CASE_SUFFIX}.json"
AUTH_STATUS_FILE="/tmp/customer_creates_order_successfully_auth_${CASE_SUFFIX}.status"
RESPONSE_FILE="/tmp/customer_creates_order_successfully_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/customer_creates_order_successfully_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$AUTH_RESPONSE" "$AUTH_STATUS_FILE" "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given — create an authenticated customer account for this test case
curl -sS -o "$AUTH_RESPONSE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"${CUSTOMER_NAME}\",\"email\":\"${CUSTOMER_EMAIL}\",\"password\":\"${CUSTOMER_PASSWORD}\"}" \
  > "$AUTH_STATUS_FILE"
SIGNUP_STATUS="$(cat "$AUTH_STATUS_FILE")"
[ "$SIGNUP_STATUS" = "201" ]
TOKEN="$(jq -r '.token' "$AUTH_RESPONSE")"
BUYER_ID="$(jq -r '.user.id' "$AUTH_RESPONSE")"
BUYER_ROLE="$(jq -r '.user.role' "$AUTH_RESPONSE")"
[ "$BUYER_ROLE" = "buyer" ]

# When — submit a valid order as the authenticated customer
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${TOKEN}" \
  --data '{"items":[{"name":"Espresso","quantity":2,"total":6.00},{"name":"Croissant","quantity":1,"total":4.50}]}' \
  > "$STATUS_FILE"

# Then — verify order creation details and calculated timestamps/total
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
[ "$(jq -r '.order.buyerId' "$RESPONSE_FILE")" = "$BUYER_ID" ]
[ "$(jq -r '.order.buyerName' "$RESPONSE_FILE")" = "$CUSTOMER_NAME" ]
[ "$(jq -r '.order.status' "$RESPONSE_FILE")" = "Placed" ]
[ "$(jq -r '.order.total' "$RESPONSE_FILE")" = "10.5" ]
[ "$(jq -r '.order.items | length' "$RESPONSE_FILE")" = "2" ]
[ "$(jq -r '.order.items[0].name' "$RESPONSE_FILE")" = "Espresso" ]
[ "$(jq -r '.order.items[0].quantity' "$RESPONSE_FILE")" = "2" ]
[ "$(jq -r '.order.items[0].total' "$RESPONSE_FILE")" = "6" ]
[ "$(jq -r '.order.items[1].name' "$RESPONSE_FILE")" = "Croissant" ]
[ "$(jq -r '.order.items[1].quantity' "$RESPONSE_FILE")" = "1" ]
[ "$(jq -r '.order.items[1].total' "$RESPONSE_FILE")" = "4.5" ]
CREATED_AT="$(jq -r '.order.createdAt' "$RESPONSE_FILE")"
READY_AT="$(jq -r '.order.readyAt' "$RESPONSE_FILE")"
[ "$CREATED_AT" != "null" ]
[ "$READY_AT" != "null" ]
CREATED_EPOCH="$(date -d "$CREATED_AT" +%s)"
READY_EPOCH="$(date -d "$READY_AT" +%s)"
[ $((READY_EPOCH - CREATED_EPOCH)) -eq 900 ]

echo "CODEVALID_TEST_ASSERTION_OK:customer_creates_order_successfully"

# Cleanup — unique account/order data only; no delete endpoint exists in the public API
