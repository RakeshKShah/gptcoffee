#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
CUSTOMER_NAME="Total Calc ${CASE_SUFFIX}"
CUSTOMER_EMAIL="total-calc.${CASE_SUFFIX}@example.test"
CUSTOMER_PASSWORD="secret-${CASE_SUFFIX}"
AUTH_RESPONSE="/tmp/order_calculates_total_correctly_auth_${CASE_SUFFIX}.json"
AUTH_STATUS_FILE="/tmp/order_calculates_total_correctly_auth_${CASE_SUFFIX}.status"
RESPONSE_FILE="/tmp/order_calculates_total_correctly_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/order_calculates_total_correctly_${CASE_SUFFIX}.status"
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

# When — submit an order with multiple item totals
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${TOKEN}" \
  --data '{"items":[{"name":"Coffee","quantity":1,"total":3.50},{"name":"Tea","quantity":1,"total":2.25},{"name":"Cookie","quantity":2,"total":5.00}]}' \
  > "$STATUS_FILE"

# Then — verify total equals the sum of all item totals
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
[ "$(jq -r '.order.total' "$RESPONSE_FILE")" = "10.75" ]
[ "$(jq -r '.order.items | length' "$RESPONSE_FILE")" = "3" ]

echo "CODEVALID_TEST_ASSERTION_OK:order_calculates_total_correctly"

# Cleanup — unique account data only; no dedicated delete endpoint exists
