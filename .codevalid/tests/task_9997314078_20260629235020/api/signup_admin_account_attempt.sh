#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
TEST_EMAIL="admin.test+${CASE_SUFFIX}@example.com"
RESPONSE_FILE="/tmp/signup_admin_account_attempt_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/signup_admin_account_attempt_${CASE_SUFFIX}.status"
cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
: "Use the public signup endpoint only; implementation under test exposes no admin-role input"

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "{\"name\":\"Admin User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"AdminPass123\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
grep -F '"name":"Admin User"' "$RESPONSE_FILE" >/dev/null
grep -F "\"email\":\"${TEST_EMAIL}\"" "$RESPONSE_FILE" >/dev/null
grep -F '"role":"buyer"' "$RESPONSE_FILE" >/dev/null
if grep -F '"role":"admin"' "$RESPONSE_FILE" >/dev/null; then
  echo "unexpected admin assignment from public signup"
  exit 1
fi
echo "CODEVALID_TEST_ASSERTION_OK:signup_admin_account_attempt"

# Cleanup
: "No public delete-user endpoint or DB client is available for JSON-file-backed users created by this test"
