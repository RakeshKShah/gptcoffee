#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
USER_NAME="Customer ${CASE_SUFFIX}"
USER_EMAIL="customer-${CASE_SUFFIX}@example.com"
USER_PASSWORD="customerPass"
TMP_DIR="$(mktemp -d)"
SIGNUP_BODY="$TMP_DIR/signup.json"
LOGIN_BODY="$TMP_DIR/login.json"
cleanup_files() { rm -rf "$TMP_DIR"; }
trap cleanup_files EXIT

# Given — create a fresh buyer account via the public signup API
SIGNUP_STATUS="$(curl -sS -o "$SIGNUP_BODY" -w '%{http_code}' -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"name":"%s","email":"%s","password":"%s"}' "$USER_NAME" "$USER_EMAIL" "$USER_PASSWORD")")"
[ "$SIGNUP_STATUS" = "201" ]
jq -e --arg email "$USER_EMAIL" '.user.email == $email and .user.role == "buyer" and (.token | type == "string" and length > 0)' "$SIGNUP_BODY" >/dev/null

# When — log in with the created credentials
LOGIN_STATUS="$(curl -sS -o "$LOGIN_BODY" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"email":"%s","password":"%s"}' "$USER_EMAIL" "$USER_PASSWORD")")"

# Then — authentication succeeds and returns token plus public user
[ "$LOGIN_STATUS" = "200" ]
jq -e --arg email "$USER_EMAIL" '.token | type == "string" and length > 0' "$LOGIN_BODY" >/dev/null
jq -e --arg email "$USER_EMAIL" '.user.email == $email and .user.role == "buyer" and (.user.password | not)' "$LOGIN_BODY" >/dev/null

# Cleanup — no public delete API exists for users in this service; unique email keeps test isolated
printf 'CODEVALID_TEST_ASSERTION_OK:customer_login_success\n'
