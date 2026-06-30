#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
USER_NAME="Wrong Password ${CASE_SUFFIX}"
USER_EMAIL="user-${CASE_SUFFIX}@example.com"
CORRECT_PASSWORD="correctPass"
WRONG_PASSWORD="incorrectPass"
TMP_DIR="$(mktemp -d)"
SIGNUP_BODY="$TMP_DIR/signup.json"
RESPONSE_FILE="$TMP_DIR/response.json"
cleanup_files() { rm -rf "$TMP_DIR"; }
trap cleanup_files EXIT

# Given — create a valid account
SIGNUP_STATUS="$(curl -sS -o "$SIGNUP_BODY" -w '%{http_code}' -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"name":"%s","email":"%s","password":"%s"}' "$USER_NAME" "$USER_EMAIL" "$CORRECT_PASSWORD")")"
[ "$SIGNUP_STATUS" = "201" ]

# When — attempt login with the correct email but wrong password
STATUS="$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"email":"%s","password":"%s"}' "$USER_EMAIL" "$WRONG_PASSWORD")")"

# Then — authentication is rejected
[ "$STATUS" = "401" ]
jq -e '.message == "No user found with that email and password."' "$RESPONSE_FILE" >/dev/null

# Cleanup — no public delete API exists for users in this service; unique email keeps test isolated
printf 'CODEVALID_TEST_ASSERTION_OK:wrong_password_for_existing_email\n'
