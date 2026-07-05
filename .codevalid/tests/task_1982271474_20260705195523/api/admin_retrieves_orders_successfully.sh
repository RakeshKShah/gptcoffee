#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="${CASE_SUFFIX:-$(date +%s)-$$}"
RESPONSE_FILE="/tmp/admin_retrieves_orders_successfully_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/admin_retrieves_orders_successfully_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
LOGIN_RESPONSE="$(curl -sS -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data '{"email":"admin@gptcoffee.test","password":"admin123"}')"
TOKEN="$(printf '%s' "$LOGIN_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"
[ -n "$TOKEN" ]
printf '%s' "$LOGIN_RESPONSE" | grep -F '"role":"admin"' >/dev/null

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X GET "$BASE_URL/api/admin/orders" \
  -H "Authorization: Bearer $TOKEN" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "200" ]
grep -F '"orders":' "$RESPONSE_FILE" >/dev/null
grep -F '"id":"ORD-1001"' "$RESPONSE_FILE" >/dev/null
grep -F '"id":"ORD-1000"' "$RESPONSE_FILE" >/dev/null
grep -F '"buyerName":"Maya Buyer"' "$RESPONSE_FILE" >/dev/null

echo "CODEVALID_TEST_ASSERTION_OK:admin_retrieves_orders_successfully"

# Cleanup
# No persistent side effects: test only authenticates and reads seeded data.
