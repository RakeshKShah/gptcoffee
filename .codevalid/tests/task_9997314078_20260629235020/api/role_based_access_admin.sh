#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
TMP_DIR="$(mktemp -d)"
RESPONSE_FILE="$TMP_DIR/response.json"
cleanup_files() { rm -rf "$TMP_DIR"; }
trap cleanup_files EXIT

# Given — use the application's built-in seeded admin account
ADMIN_EMAIL="admin@gptcoffee.test"
ADMIN_PASSWORD="admin123"

# When — log in as admin
STATUS="$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"email":"%s","password":"%s"}' "$ADMIN_EMAIL" "$ADMIN_PASSWORD")")"

# Then — response includes admin role
[ "$STATUS" = "200" ]
jq -e '.token | type == "string" and length > 0' "$RESPONSE_FILE" >/dev/null
jq -e --arg email "$ADMIN_EMAIL" '.user.email == $email and .user.role == "admin" and (.user.password | not)' "$RESPONSE_FILE" >/dev/null

# Cleanup — stateless login only
printf 'CODEVALID_TEST_ASSERTION_OK:role_based_access_admin\n'
