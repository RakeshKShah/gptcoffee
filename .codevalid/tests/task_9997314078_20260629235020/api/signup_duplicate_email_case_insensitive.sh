#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
BASE_LOCAL="cased-${CASE_SUFFIX}"
STORED_EMAIL="${BASE_LOCAL}@example.com"
ATTEMPT_EMAIL="CASED-${CASE_SUFFIX}@EXAMPLE.COM"
SETUP_RESPONSE_FILE="/tmp/signup_duplicate_email_case_insensitive_setup_${CASE_SUFFIX}.json"
SETUP_STATUS_FILE="/tmp/signup_duplicate_email_case_insensitive_setup_${CASE_SUFFIX}.status"
RESPONSE_FILE="/tmp/signup_duplicate_email_case_insensitive_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/signup_duplicate_email_case_insensitive_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$SETUP_RESPONSE_FILE" "$SETUP_STATUS_FILE" "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
curl -sS -o "$SETUP_RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Case Seed\",\"email\":\"${STORED_EMAIL}\",\"password\":\"ValidPass12\"}" > "$SETUP_STATUS_FILE"
[ "$(cat "$SETUP_STATUS_FILE")" = "201" ]

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Another User\",\"email\":\"${ATTEMPT_EMAIL}\",\"password\":\"ValidPass12\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "409" ]
grep -F '"message":"That email is already registered."' "$RESPONSE_FILE" >/dev/null
echo "CODEVALID_TEST_ASSERTION_OK:signup_duplicate_email_case_insensitive"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
