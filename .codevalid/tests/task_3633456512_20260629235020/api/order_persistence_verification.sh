#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
EMAIL="persist-${CASE_SUFFIX}@example.com"
NAME="Persistent User ${CASE_SUFFIX}"
PASSWORD="pass-${CASE_SUFFIX}-123"
TMP_DIR="$(mktemp -d)"
SIGNUP_BODY="$TMP_DIR/signup.json"
ORDER_BODY="$TMP_DIR/order.json"
ORDER_STATUS="$TMP_DIR/order.status"
MY_ORDERS_BODY="$TMP_DIR/my-orders.json"
MY_ORDERS_STATUS="$TMP_DIR/my-orders.status"
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
  --data '{"items":[{"id":"item-001","name":"Mocha","quantity":2,"total":8.0}]}' > "$ORDER_STATUS"
ORDER_ID="$(jq -r '.order.id' "$ORDER_BODY")"
[ -n "$ORDER_ID" ]
[ "$ORDER_ID" != "null" ]
curl -sS -o "$MY_ORDERS_BODY" -w '%{http_code}' -X GET "$BASE_URL/api/orders/my" \
  -H "Authorization: Bearer $TOKEN" > "$MY_ORDERS_STATUS"

# Then
STATUS="$(cat "$ORDER_STATUS")"
[ "$STATUS" = "201" ]
MY_STATUS="$(cat "$MY_ORDERS_STATUS")"
[ "$MY_STATUS" = "200" ]
jq -e --arg order_id "$ORDER_ID" '.orders[0].id == $order_id' "$MY_ORDERS_BODY" >/dev/null
jq -e --arg expected_name "$NAME" --arg order_id "$ORDER_ID" '.orders[] | select(.id == $order_id) | .buyerName == $expected_name and .status == "Placed" and .total == 8 and (.items | length == 1) and .items[0].name == "Mocha" and .items[0].quantity == 2 and .items[0].total == 8' "$MY_ORDERS_BODY" >/dev/null
CREATED_AT="$(jq -r --arg order_id "$ORDER_ID" '.orders[] | select(.id == $order_id) | .createdAt' "$MY_ORDERS_BODY")"
READY_AT="$(jq -r --arg order_id "$ORDER_ID" '.orders[] | select(.id == $order_id) | .readyAt' "$MY_ORDERS_BODY")"
python3 - <<'PY' "$CREATED_AT" "$READY_AT"
import datetime, sys
created = datetime.datetime.fromisoformat(sys.argv[1].replace('Z', '+00:00'))
ready = datetime.datetime.fromisoformat(sys.argv[2].replace('Z', '+00:00'))
assert int((ready - created).total_seconds()) == 900
PY

echo "CODEVALID_TEST_ASSERTION_OK:order_persistence_verification"

# Cleanup
# No public API exists to delete created users/orders; only temporary files are removed by trap.
