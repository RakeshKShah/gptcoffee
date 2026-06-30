#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="duplicate-exact-${CASE_SUFFIX}@example.com"
TEST_PASSWORD="ExistingPass123"
SETUP_RESPONSE_FILE="/tmp/signup_duplicate_email_exact_match_setup_${CASE_SUFFIX}.json"
SETUP_STATUS_FILE="/tmp/signup_duplicate_email_exact_match_setup_${CASE_SUFFIX}.status"
RESPONSE_FILE="/tmp/signup_duplicate_email_exact_match_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/signup_duplicate_email_exact_match_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$SETUP_RESPONSE_FILE" "$SETUP_STATUS_FILE" "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
curl -sS -o "$SETUP_RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Existing User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" > "$SETUP_STATUS_FILE"
[ "$(cat "$SETUP_STATUS_FILE")" = "201" ]

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"New User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"NewPass123\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "409" ]
grep -F '"message":"That email is already registered."' "$RESPONSE_FILE" >/dev/null
echo "CODEVALID_TEST_ASSERTION_OK:signup_duplicate_email_exact_match"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
