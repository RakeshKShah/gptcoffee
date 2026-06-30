#!/usr/bin/env sh
set -eu
BASE_URL="${BASE_URL:-http://app:6713}"
CASE_SUFFIX="$(date +%s)-$$"
MISSING_EMAIL="nonexistent-${CASE_SUFFIX}@example.com"
MISSING_PASSWORD="wrongPass"
TMP_DIR="$(mktemp -d)"
RESPONSE_FILE="$TMP_DIR/response.json"
cleanup_files() { rm -rf "$TMP_DIR"; }
trap cleanup_files EXIT

# Given — use a unique email so no matching user exists
:

# When — attempt login with invalid credentials
STATUS="$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"email":"%s","password":"%s"}' "$MISSING_EMAIL" "$MISSING_PASSWORD")")"

# Then — authentication is rejected
[ "$STATUS" = "401" ]
jq -e '.message == "No user found with that email and password."' "$RESPONSE_FILE" >/dev/null

# Cleanup — no side effects created
printf 'CODEVALID_TEST_ASSERTION_OK:invalid_credentials_failure\n'
