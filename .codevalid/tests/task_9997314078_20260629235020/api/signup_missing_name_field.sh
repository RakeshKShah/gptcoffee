#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="missing-name+${CASE_SUFFIX}@example.com"
RESPONSE_FILE="/tmp/signup_missing_name_field_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/signup_missing_name_field_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Prepare a unique email; request omits the required name field"

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"${TEST_EMAIL}\",\"password\":\"ValidPass123\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "400" ]
grep -F '"message":"Name, email, and a 6+ character password are required."' "$RESPONSE_FILE" >/dev/null
echo "CODEVALID_TEST_ASSERTION_OK:signup_missing_name_field"

# Cleanup
: "Stateless negative validation case; no side effects to undo"
