#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="persist.test+${CASE_SUFFIX}@example.com"
TEST_PASSWORD="Persist123"
SIGNUP_RESPONSE_FILE="/tmp/signup_persists_to_database_signup_${CASE_SUFFIX}.json"
SIGNUP_STATUS_FILE="/tmp/signup_persists_to_database_signup_${CASE_SUFFIX}.status"
LOGIN_RESPONSE_FILE="/tmp/signup_persists_to_database_login_${CASE_SUFFIX}.json"
LOGIN_STATUS_FILE="/tmp/signup_persists_to_database_login_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$SIGNUP_RESPONSE_FILE" "$SIGNUP_STATUS_FILE" "$LOGIN_RESPONSE_FILE" "$LOGIN_STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Use a unique email and verify persistence through the public login API"

# When
curl -sS -o "$SIGNUP_RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Persist User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" > "$SIGNUP_STATUS_FILE"
curl -sS -o "$LOGIN_RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" > "$LOGIN_STATUS_FILE"

# Then
[ "$(cat "$SIGNUP_STATUS_FILE")" = "201" ]
grep -F "\"email\":\"${TEST_EMAIL}\"" "$SIGNUP_RESPONSE_FILE" >/dev/null
[ "$(cat "$LOGIN_STATUS_FILE")" = "200" ]
grep -F '"name":"Persist User"' "$LOGIN_RESPONSE_FILE" >/dev/null
grep -F "\"email\":\"${TEST_EMAIL}\"" "$LOGIN_RESPONSE_FILE" >/dev/null
grep -F '"role":"buyer"' "$LOGIN_RESPONSE_FILE" >/dev/null
echo "CODEVALID_TEST_ASSERTION_OK:signup_persists_to_database"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
