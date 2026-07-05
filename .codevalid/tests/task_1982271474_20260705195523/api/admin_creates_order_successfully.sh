#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
DB_PATH="${DB_PATH:-/app/GPTCoffeeServer/src/data/db.json}"
TMP_DIR="$(mktemp -d)"
cleanup_all() {
  if [ -f "$TMP_DIR/original-db.json" ]; then
    cp "$TMP_DIR/original-db.json" "$DB_PATH"
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup_all EXIT

# Given — seed a unique admin user directly into the file-backed database and construct a valid token
cp "$DB_PATH" "$TMP_DIR/original-db.json"
ADMIN_ID="admin-${CASE_SUFFIX}"
ADMIN_NAME="John Admin ${CASE_SUFFIX}"
ADMIN_EMAIL="john.admin.${CASE_SUFFIX}@example.test"
ADMIN_PASSWORD="adminpw-${CASE_SUFFIX}"
jq --arg id "$ADMIN_ID" --arg name "$ADMIN_NAME" --arg email "$ADMIN_EMAIL" --arg password "$ADMIN_PASSWORD" '.users += [{id:$id,name:$name,email:$email,password:$password,role:"admin"}]' "$TMP_DIR/original-db.json" > "$TMP_DIR/updated-db.json"
cp "$TMP_DIR/updated-db.json" "$DB_PATH"
TOKEN="$(printf '{"userId":"%s","role":"admin"}' "$ADMIN_ID" | basenc --base64url | tr -d '\n')"
RESPONSE_FILE="$TMP_DIR/response.json"
STATUS_FILE="$TMP_DIR/status.txt"

# When — submit an order using the seeded admin identity
curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X POST "$BASE_URL/api/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${TOKEN}" \
  --data '{"items":[{"name":"Cappuccino","quantity":1,"total":5.00}]}' \
  > "$STATUS_FILE"

# Then — verify admins can access customer ordering functionality
STATUS="$(cat "$STATUS_FILE")"
[ "$STATUS" = "201" ]
[ "$(jq -r '.order.buyerId' "$RESPONSE_FILE")" = "$ADMIN_ID" ]
[ "$(jq -r '.order.buyerName' "$RESPONSE_FILE")" = "$ADMIN_NAME" ]
[ "$(jq -r '.order.status' "$RESPONSE_FILE")" = "Placed" ]
[ "$(jq -r '.order.total' "$RESPONSE_FILE")" = "5" ]
[ "$(jq -r '.order.items | length' "$RESPONSE_FILE")" = "1" ]
[ "$(jq -r '.order.items[0].name' "$RESPONSE_FILE")" = "Cappuccino" ]

echo "CODEVALID_TEST_ASSERTION_OK:admin_creates_order_successfully"

# Cleanup — restore the original file-backed database snapshot
