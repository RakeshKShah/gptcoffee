#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
CUSTOMER_NAME="Missing Items ${CASE_SUFFIX}"
CUSTOMER_EMAIL="missing-items.${CASE_SUFFIX}@example.test"
CUSTOMER_PASSWORD="secret-${CASE_SUFFIX}"
AUTH_RESPONSE="/tmp/order_rejected_missing_items_field_auth_${CASE_SUFFIX}.json"
AUTH_STATUS_FILE="/tmp/order_rejected_missing_items_field_auth_${CASE_SUFFIX}.status"
RESPONSE_FILE="/tmp/order_rejected_missing_items_field_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/order_rejected_missing_items_field_${CASE_SUFFIX}.status"
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

# When — submit an order body without the items field
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${TOKEN}" \
  --data '{"buyerNotes":"Please hurry"}' \
  > "$STATUS_FILE"

# Then — verify validation failure
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "400" ]
[ "$(jq -r '.message' "$RESPONSE_FILE")" = "Order must include at least one item." ]

echo "CODEVALID_TEST_ASSERTION_OK:order_rejected_missing_items_field"

# Cleanup — unique account data only; no dedicated delete endpoint exists
