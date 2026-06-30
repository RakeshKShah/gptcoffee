#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
SHORT_EMAIL="five+${CASE_SUFFIX}@test.com"
BOUNDARY_EMAIL="six+${CASE_SUFFIX}@test.com"
LONG_EMAIL="long+${CASE_SUFFIX}@test.com"
SHORT_RESPONSE_FILE="/tmp/signup_password_various_lengths_short_${CASE_SUFFIX}.json"
SHORT_STATUS_FILE="/tmp/signup_password_various_lengths_short_${CASE_SUFFIX}.status"
BOUNDARY_RESPONSE_FILE="/tmp/signup_password_various_lengths_boundary_${CASE_SUFFIX}.json"
BOUNDARY_STATUS_FILE="/tmp/signup_password_various_lengths_boundary_${CASE_SUFFIX}.status"
LONG_RESPONSE_FILE="/tmp/signup_password_various_lengths_long_${CASE_SUFFIX}.json"
LONG_STATUS_FILE="/tmp/signup_password_various_lengths_long_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$SHORT_RESPONSE_FILE" "$SHORT_STATUS_FILE" \
    "$BOUNDARY_RESPONSE_FILE" "$BOUNDARY_STATUS_FILE" \
    "$LONG_RESPONSE_FILE" "$LONG_STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Prepare three unique emails to exercise 5-char, 6-char, and long passwords"

# When
curl -sS -o "$SHORT_RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Five Char\",\"email\":\"${SHORT_EMAIL}\",\"password\":\"12345\"}" > "$SHORT_STATUS_FILE"
curl -sS -o "$BOUNDARY_RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Six Char\",\"email\":\"${BOUNDARY_EMAIL}\",\"password\":\"123456\"}" > "$BOUNDARY_STATUS_FILE"
curl -sS -o "$LONG_RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Long Pass\",\"email\":\"${LONG_EMAIL}\",\"password\":\"VeryLongPassword123456\"}" > "$LONG_STATUS_FILE"

# Then
[ "$(cat "$SHORT_STATUS_FILE")" = "400" ]
grep -F '"message":"Name, email, and a 6+ character password are required."' "$SHORT_RESPONSE_FILE" >/dev/null
[ "$(cat "$BOUNDARY_STATUS_FILE")" = "201" ]
grep -F "\"email\":\"${BOUNDARY_EMAIL}\"" "$BOUNDARY_RESPONSE_FILE" >/dev/null
[ "$(cat "$LONG_STATUS_FILE")" = "201" ]
grep -F "\"email\":\"${LONG_EMAIL}\"" "$LONG_RESPONSE_FILE" >/dev/null
echo "CODEVALID_TEST_ASSERTION_OK:signup_password_various_lengths"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
