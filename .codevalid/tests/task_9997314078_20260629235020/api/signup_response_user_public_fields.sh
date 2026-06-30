#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="public.fields+${CASE_SUFFIX}@example.com"
RESPONSE_FILE="/tmp/signup_response_user_public_fields_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/signup_response_user_public_fields_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Use a unique email for a successful signup"

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Public Fields User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"SecurePassword12\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
grep -Eq '"id":"buyer-[0-9]+"' "$RESPONSE_FILE"
grep -F '"name":"Public Fields User"' "$RESPONSE_FILE" >/dev/null
grep -F "\"email\":\"${TEST_EMAIL}\"" "$RESPONSE_FILE" >/dev/null
grep -F '"role":"buyer"' "$RESPONSE_FILE" >/dev/null
if grep -F '"password"' "$RESPONSE_FILE" >/dev/null; then
  echo "password leaked in signup response"
  exit 1
fi
echo "CODEVALID_TEST_ASSERTION_OK:signup_response_user_public_fields"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
