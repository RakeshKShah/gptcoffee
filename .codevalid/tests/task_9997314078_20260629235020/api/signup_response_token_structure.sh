#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="token.test+${CASE_SUFFIX}@example.com"
RESPONSE_FILE="/tmp/signup_response_token_structure_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/signup_response_token_structure_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Use a unique email for a new account creation request"

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Token User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"TokenPass99\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
TOKEN="$(sed -n 's/.*"token":"\([^"]*\)".*/\1/p' "$RESPONSE_FILE" | head -n 1)"
[ -n "$TOKEN" ]
grep -F '"user":{' "$RESPONSE_FILE" >/dev/null
echo "CODEVALID_TEST_ASSERTION_OK:signup_response_token_structure"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
