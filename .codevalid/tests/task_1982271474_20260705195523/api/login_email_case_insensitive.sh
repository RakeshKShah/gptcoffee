#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
DB_FILE="${DB_FILE:-/tmp/test_gen_emqnzrqe/GPTCoffeeServer/src/data/db.json}"
USER_ID="user-case-insensitive-${CASE_SUFFIX}"
STORED_EMAIL="Customer-${CASE_SUFFIX}@Test.COM"
LOWER_EMAIL="customer-${CASE_SUFFIX}@test.com"
UPPER_EMAIL="CUSTOMER-${CASE_SUFFIX}@TEST.COM"
RESPONSE_FILE_1="/tmp/login_email_case_insensitive_${CASE_SUFFIX}_1.json"
STATUS_FILE_1="/tmp/login_email_case_insensitive_${CASE_SUFFIX}_1.status"
RESPONSE_FILE_2="/tmp/login_email_case_insensitive_${CASE_SUFFIX}_2.json"
STATUS_FILE_2="/tmp/login_email_case_insensitive_${CASE_SUFFIX}_2.status"

cleanup_files() {
  rm -f "$RESPONSE_FILE_1" "$STATUS_FILE_1" "$RESPONSE_FILE_2" "$STATUS_FILE_2"
}
trap cleanup_files EXIT

# Given
mkdir -p "$(dirname "$DB_FILE")"
node - <<'NODE' "$DB_FILE" "$USER_ID" "$STORED_EMAIL"
const fs = require('fs');
const dbPath = process.argv[2];
const userId = process.argv[3];
const email = process.argv[4];
let db = { users: [], products: [], customizations: { sizes: [], milks: [], extras: [] }, orders: [] };
if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.users = (db.users || []).filter((u) => u.id !== userId && String(u.email || '').toLowerCase() !== String(email).toLowerCase());
db.users.push({ id: userId, name: 'Customer Mixed Case', email, password: 'SecurePass123', role: 'customer' });
fs.mkdirSync(require('path').dirname(dbPath), { recursive: true });
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
NODE

# When
curl -sS -o "$RESPONSE_FILE_1" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"${LOWER_EMAIL}\",\"password\":\"SecurePass123\"}" > "$STATUS_FILE_1"
curl -sS -o "$RESPONSE_FILE_2" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"${UPPER_EMAIL}\",\"password\":\"SecurePass123\"}" > "$STATUS_FILE_2"

# Then
STATUS_1="$(cat "$STATUS_FILE_1")"
STATUS_2="$(cat "$STATUS_FILE_2")"
[ "$STATUS_1" = "200" ]
[ "$STATUS_2" = "200" ]
grep -Eq '"token"[[:space:]]*:[[:space:]]*"[^"]+"' "$RESPONSE_FILE_1"
grep -Eq '"token"[[:space:]]*:[[:space:]]*"[^"]+"' "$RESPONSE_FILE_2"
grep -F "$USER_ID" "$RESPONSE_FILE_1" >/dev/null
grep -F "$USER_ID" "$RESPONSE_FILE_2" >/dev/null

echo "CODEVALID_TEST_ASSERTION_OK:login_email_case_insensitive"

# Cleanup
node - <<'NODE' "$DB_FILE" "$USER_ID" "$STORED_EMAIL"
const fs = require('fs');
const dbPath = process.argv[2];
const userId = process.argv[3];
const email = process.argv[4];
if (!fs.existsSync(dbPath)) process.exit(0);
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.users = (db.users || []).filter((u) => u.id !== userId && String(u.email || '').toLowerCase() !== String(email).toLowerCase());
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
NODE
