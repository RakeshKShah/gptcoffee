#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
RESPONSE_FILE="/tmp/order_rejected_unauthenticated_user_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/order_rejected_unauthenticated_user_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given — no valid authentication token/session exists for the request
INVALID_TOKEN="invalid-token-${CASE_SUFFIX}"

# When — submit an order without a valid authenticated session
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${INVALID_TOKEN}" \
  --data '{"items":[{"name":"Latte","quantity":1,"total":5.50}]}' \
  > "$STATUS_FILE"

# Then — verify authentication rejection
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "401" ]
MESSAGE="$(jq -r '.message' "$RESPONSE_FILE")"
[ "$MESSAGE" = "Missing or invalid session." ] || [ "$MESSAGE" = "Invalid session." ]

echo "CODEVALID_TEST_ASSERTION_OK:order_rejected_unauthenticated_user"

# Cleanup — stateless negative test
