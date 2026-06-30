#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
USER_NAME="Missing Password ${CASE_SUFFIX}"
USER_EMAIL="valid-${CASE_SUFFIX}@example.com"
USER_PASSWORD="validPass"
TMP_DIR="$(mktemp -d)"
SIGNUP_BODY="$TMP_DIR/signup.json"
RESPONSE_FILE="$TMP_DIR/response.json"
cleanup_files() { rm -rf "$TMP_DIR"; }
trap cleanup_files EXIT

# Given — create a valid account, then omit password in the login request
SIGNUP_STATUS="$(curl -sS -o "$SIGNUP_BODY" -w '%{http_code}' -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"name":"%s","email":"%s","password":"%s"}' "$USER_NAME" "$USER_EMAIL" "$USER_PASSWORD")")"
[ "$SIGNUP_STATUS" = "201" ]

# When — attempt login without the password field
STATUS="$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"email":"%s"}' "$USER_EMAIL")")"

# Then — authentication fails with the standard 401 message
[ "$STATUS" = "401" ]
jq -e '.message == "No user found with that email and password."' "$RESPONSE_FILE" >/dev/null

# Cleanup — no public delete API exists for users in this service; unique email keeps test isolated
printf 'CODEVALID_TEST_ASSERTION_OK:missing_password_field\n'
