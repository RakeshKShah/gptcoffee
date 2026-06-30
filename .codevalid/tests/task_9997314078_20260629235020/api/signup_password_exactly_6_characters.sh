#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="boundary+${CASE_SUFFIX}@test.com"
TEST_PASSWORD="123456"
RESPONSE_FILE="/tmp/signup_password_exactly_6_characters_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/signup_password_exactly_6_characters_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Use a unique email with a 6-character password boundary value"

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Boundary User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
grep -Eq '"token":"[^"]+"' "$RESPONSE_FILE"
grep -F '"name":"Boundary User"' "$RESPONSE_FILE" >/dev/null
grep -F "\"email\":\"${TEST_EMAIL}\"" "$RESPONSE_FILE" >/dev/null
grep -F '"role":"buyer"' "$RESPONSE_FILE" >/dev/null
echo "CODEVALID_TEST_ASSERTION_OK:signup_password_exactly_6_characters"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
