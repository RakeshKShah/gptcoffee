#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="john.doe+${CASE_SUFFIX}@example.com"
TEST_NAME="John Doe"
TEST_PASSWORD="SecurePass123"
RESPONSE_FILE="/tmp/successful_customer_signup_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/successful_customer_signup_${CASE_SUFFIX}.status"
LOGIN_RESPONSE_FILE="/tmp/successful_customer_signup_login_${CASE_SUFFIX}.json"
LOGIN_STATUS_FILE="/tmp/successful_customer_signup_login_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE" "$LOGIN_RESPONSE_FILE" "$LOGIN_STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Use a unique email so no pre-existing user is required"

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"${TEST_NAME}\",\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
grep -Eq '"token":"[^"]+"' "$RESPONSE_FILE"
grep -Eq '"user":\{' "$RESPONSE_FILE"
grep -Eq '"id":"buyer-[0-9]+"' "$RESPONSE_FILE"
grep -F '"name":"John Doe"' "$RESPONSE_FILE" >/dev/null
grep -F "\"email\":\"${TEST_EMAIL}\"" "$RESPONSE_FILE" >/dev/null
grep -F '"role":"buyer"' "$RESPONSE_FILE" >/dev/null
if grep -F '"password"' "$RESPONSE_FILE" >/dev/null; then
  echo "password leaked in response"
  exit 1
fi
curl -sS -o "$LOGIN_RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" > "$LOGIN_STATUS_FILE"
[ "$(cat "$LOGIN_STATUS_FILE")" = "200" ]
grep -F "\"email\":\"${TEST_EMAIL}\"" "$LOGIN_RESPONSE_FILE" >/dev/null
echo "CODEVALID_TEST_ASSERTION_OK:successful_customer_signup"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
