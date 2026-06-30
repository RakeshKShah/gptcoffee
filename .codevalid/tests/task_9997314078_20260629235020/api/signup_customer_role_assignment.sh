#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="customer.role+${CASE_SUFFIX}@example.com"
RESPONSE_FILE="/tmp/signup_customer_role_assignment_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/signup_customer_role_assignment_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Use a unique email for a standard signup request"

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Customer User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"Customer123\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
grep -F '"role":"buyer"' "$RESPONSE_FILE" >/dev/null
echo "CODEVALID_TEST_ASSERTION_OK:signup_customer_role_assignment"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
