#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
DB_FILE="${DB_FILE:-/tmp/test_gen_emqnzrqe/GPTCoffeeServer/src/data/db.json}"
USER_ID="user-invalid-password-${CASE_SUFFIX}"
USER_EMAIL="customer-${CASE_SUFFIX}@test.com"
RESPONSE_FILE="/tmp/login_invalid_password_${CASE_SUFFIX}.json"
STATUS_FILE="/tmp/login_invalid_password_${CASE_SUFFIX}.status"

cleanup_files() {
  rm -f "$RESPONSE_FILE" "$STATUS_FILE"
}
trap cleanup_files EXIT

# Given
mkdir -p "$(dirname "$DB_FILE")"
node - <<'NODE' "$DB_FILE" "$USER_ID" "$USER_EMAIL"
const fs = require('fs');
const dbPath = process.argv[2];
const userId = process.argv[3];
const email = process.argv[4];
let db = { users: [], products: [], customizations: { sizes: [], milks: [], extras: [] }, orders: [] };
if (fs.existsSync(dbPath)) {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}
db.users = (db.users || []).filter((u) => u.id !== userId && String(u.email || '').toLowerCase() !== String(email).toLowerCase());
db.users.push({ id: userId, name: 'Customer Wrong Password', email, password: 'SecurePass123', role: 'customer' });
fs.mkdirSync(require('path').dirname(dbPath), { recursive: true });
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
NODE

# When
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "{\"email\":\"${USER_EMAIL}\",\"password\":\"WrongPassword999\"}" > "$STATUS_FILE"

# Then
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "401" ]
grep -F 'No user found with that email and password.' "$RESPONSE_FILE" >/dev/null

echo "CODEVALID_TEST_ASSERTION_OK:login_invalid_password"

# Cleanup
node - <<'NODE' "$DB_FILE" "$USER_ID" "$USER_EMAIL"
const fs = require('fs');
const dbPath = process.argv[2];
const userId = process.argv[3];
const email = process.argv[4];
if (!fs.existsSync(dbPath)) process.exit(0);
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
db.users = (db.users || []).filter((u) => u.id !== userId && String(u.email || '').toLowerCase() !== String(email).toLowerCase());
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
NODE
