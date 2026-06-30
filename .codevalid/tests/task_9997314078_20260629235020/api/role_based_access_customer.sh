#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
USER_NAME="Buyer Role ${CASE_SUFFIX}"
USER_EMAIL="customer2-${CASE_SUFFIX}@example.com"
USER_PASSWORD="custPass"
TMP_DIR="$(mktemp -d)"
SIGNUP_BODY="$TMP_DIR/signup.json"
RESPONSE_FILE="$TMP_DIR/response.json"
cleanup_files() { rm -rf "$TMP_DIR"; }
trap cleanup_files EXIT

# Given — create a fresh end-user account via signup
SIGNUP_STATUS="$(curl -sS -o "$SIGNUP_BODY" -w '%{http_code}' -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"name":"%s","email":"%s","password":"%s"}' "$USER_NAME" "$USER_EMAIL" "$USER_PASSWORD")")"
[ "$SIGNUP_STATUS" = "201" ]

# When — log in with that account
STATUS="$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"email":"%s","password":"%s"}' "$USER_EMAIL" "$USER_PASSWORD")")"

# Then — response contains the authenticated buyer role used by the implementation
[ "$STATUS" = "200" ]
jq -e '.token | type == "string" and length > 0' "$RESPONSE_FILE" >/dev/null
jq -e --arg email "$USER_EMAIL" '.user.email == $email and .user.role == "buyer"' "$RESPONSE_FILE" >/dev/null

# Cleanup — no public delete API exists for users in this service; unique email keeps test isolated
printf 'CODEVALID_TEST_ASSERTION_OK:role_based_access_customer\n'
