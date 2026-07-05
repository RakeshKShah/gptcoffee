#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
DB_FILE="${DB_FILE:-/tmp/test_gen_emqnzrqe/GPTCoffeeServer/src/data/db.json}"
USER_EMAIL="nonexistent-${CASE_SUFFIX}@test.com"
RESPONSE_FILE="/tmp/login_invalid_email_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/login_invalid_email_${CASE_SUFFIX}.status"

cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
mkdir -p "$(dirname "$DB_FILE")"
node - <<'NODE' "$DB_FILE" "$USER_EMAIL"
const fs = require('fs');
const dbPath = process.argv[2];
const email = process.argv[3];
if (!fs.existsSync(dbPath)) process.exit(0);
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.users = (db.users || []).filter((u) => String(u.email || '').toLowerCase() !== String(email).toLowerCase());
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
NODE

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"${USER_EMAIL}\",\"password\":\"SomePassword123\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "401" ]
grep -F 'No user found with that email and password.' "$RESPONSE_FILE" >/dev/null

echo "CODEVALID_TEST_ASSERTION_OK:login_invalid_email"

# Cleanup
node - <<'NODE' "$DB_FILE" "$USER_EMAIL"
const fs = require('fs');
const dbPath = process.argv[2];
const email = process.argv[3];
if (!fs.existsSync(dbPath)) process.exit(0);
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.users = (db.users || []).filter((u) => String(u.email || '').toLowerCase() !== String(email).toLowerCase());
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
NODE
