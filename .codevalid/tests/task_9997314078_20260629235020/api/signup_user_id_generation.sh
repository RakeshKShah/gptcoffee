#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="idtest+${CASE_SUFFIX}@example.com"
RESPONSE_FILE="/tmp/signup_user_id_generation_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/signup_user_id_generation_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Use a unique email to create a fresh buyer account"

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"ID Test User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"TestPass123\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
USER_ID="$(sed -n 's/.*"id":"\(buyer-[0-9][0-9]*\)".*/\1/p' "$RESPONSE_FILE" | head -n 1)"
[ -n "$USER_ID" ]
case "$USER_ID" in
  buyer-[0-9]*) ;;
  *)
    echo "unexpected user id: $USER_ID"
    exit 1
    ;;
esac
echo "CODEVALID_TEST_ASSERTION_OK:signup_user_id_generation"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
