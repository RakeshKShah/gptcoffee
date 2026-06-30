#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
USER_NAME="Case Mix ${CASE_SUFFIX}"
CANONICAL_EMAIL="MixedCase-${CASE_SUFFIX}@example.com"
LOGIN_EMAIL="mixedcase-${CASE_SUFFIX}@EXAMPLE.com"
USER_PASSWORD="mixedPass"
TMP_DIR="$(mktemp -d)"
SIGNUP_BODY="$TMP_DIR/signup.json"
RESPONSE_FILE="$TMP_DIR/response.json"
cleanup_files() { rm -rf "$TMP_DIR"; }
trap cleanup_files EXIT

# Given — create an account with mixed-case email
SIGNUP_STATUS="$(curl -sS -o "$SIGNUP_BODY" -w '%{http_code}' -X POST "$BASE_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"name":"%s","email":"%s","password":"%s"}' "$USER_NAME" "$CANONICAL_EMAIL" "$USER_PASSWORD")")"
[ "$SIGNUP_STATUS" = "201" ]

# When — log in using different email casing
STATUS="$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"email":"%s","password":"%s"}' "$LOGIN_EMAIL" "$USER_PASSWORD")")"

# Then — authentication succeeds despite case differences
[ "$STATUS" = "200" ]
jq -e '.token | type == "string" and length > 0' "$RESPONSE_FILE" >/dev/null
jq -e --arg email "$CANONICAL_EMAIL" '.user.email == $email and .user.role == "buyer"' "$RESPONSE_FILE" >/dev/null

# Cleanup — no public delete API exists for users in this service; unique email keeps test isolated
printf 'CODEVALID_TEST_ASSERTION_OK:case_insensitive_email\n'
