#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
EMAIL="create-order-${CASE_SUFFIX}@example.com"
NAME="John Doe ${CASE_SUFFIX}"
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
  --data '{"items":[{"id":"item-001","name":"Latte","quantity":1,"total":4.5},{"id":"item-002","name":"Cappuccino","quantity":2,"total":9.0}]}' > "$ORDER_STATUS"

# Then
STATUS="$(cat "$ORDER_STATUS")"
[ "$STATUS" = "201" ]
jq -e '.order.id | startswith("ORD-")' "$ORDER_BODY" >/dev/null
jq -e '.order.buyerId | startswith("buyer-")' "$ORDER_BODY" >/dev/null
jq -e --arg expected_name "$NAME" '.order.buyerName == $expected_name' "$ORDER_BODY" >/dev/null
jq -e '.order.status == "Placed"' "$ORDER_BODY" >/dev/null
jq -e '.order.total == 13.5' "$ORDER_BODY" >/dev/null
jq -e '.order.items | length == 2' "$ORDER_BODY" >/dev/null
jq -e '.order.items[0].id == "item-001" and .order.items[0].name == "Latte" and .order.items[0].quantity == 1 and .order.items[0].total == 4.5' "$ORDER_BODY" >/dev/null
jq -e '.order.items[1].id == "item-002" and .order.items[1].name == "Cappuccino" and .order.items[1].quantity == 2 and .order.items[1].total == 9' "$ORDER_BODY" >/dev/null
CREATED_AT="$(jq -r '.order.createdAt' "$ORDER_BODY")"
READY_AT="$(jq -r '.order.readyAt' "$ORDER_BODY")"
python3 - <<'PY' "$CREATED_AT" "$READY_AT"
import datetime, sys
created = datetime.datetime.fromisoformat(sys.argv[1].replace('Z', '+00:00'))
ready = datetime.datetime.fromisoformat(sys.argv[2].replace('Z', '+00:00'))
assert int((ready - created).total_seconds()) == 900
PY

echo "CODEVALID_TEST_ASSERTION_OK:create_order_success"

# Cleanup
# No public API exists to delete created users/orders; only temporary files are removed by trap.
