#!/usr/bin/env bash
# API-level checks of the rules that only the running API enforces (database tests cannot):
#   - bucket size and type limits
#   - audio upload, signed links (and their expiry), and the public URL refusal
#   - anonymous access over HTTP, and the one function an anonymous visitor may call (ping)
#   - email sign-in: a six digit code in a code-only email, wrong code, resend limit, and the
#     profile row of a new user (it reads the code from the local test mailbox, Mailpit)
#
# Runs against the LOCAL stack (npm run db:start). It reads the URL and keys from
# `supabase status`, so no key is stored anywhere. It creates throwaway users and
# removes them (and their files and test emails) when it ends.
#
#   npm run db:smoke
set -uo pipefail

eval "$(npx supabase status -o env 2>/dev/null)"
if [ -z "${API_URL:-}" ] || [ -z "${PUBLISHABLE_KEY:-}" ] || [ -z "${SECRET_KEY:-}" ]; then
  echo "Could not read the local stack settings. Is it running? (npm run db:start)" >&2
  exit 2
fi

WORK="$(mktemp -d)"
RUN_ID="$(date +%s)$$"
FAILURES=0
USER_IDS=()
OBJECT_PATHS=()

pass() { echo "  ok    $1"; }
fail() { echo "  FAIL  $1" >&2; FAILURES=$((FAILURES + 1)); }

# expect_status "description" actual "pattern"   (pattern is a regex for the HTTP status)
expect_status() {
  if [[ "$2" =~ ^($3)$ ]]; then pass "$1 (HTTP $2)"; else fail "$1 (got HTTP $2, wanted $3)"; fi
}

new_uuid() { node -e 'console.log(require("crypto").randomUUID())'; }

cleanup() {
  for p in "${OBJECT_PATHS[@]:-}"; do
    [ -n "$p" ] && curl -s -o /dev/null -X DELETE "$API_URL/storage/v1/object/audio/$p" \
      -H "apikey: $SECRET_KEY"
  done
  for id in "${USER_IDS[@]:-}"; do
    [ -n "$id" ] && curl -s -o /dev/null -X DELETE "$API_URL/auth/v1/admin/users/$id" \
      -H "apikey: $SECRET_KEY"
  done
  if [ -n "${OTP_EMAIL:-}" ] && [ -n "${MAILPIT_URL:-}" ]; then
    curl -s -o /dev/null -X DELETE "$MAILPIT_URL/api/v1/search?query=to:$OTP_EMAIL"
  fi
  rm -rf "$WORK"
}
trap cleanup EXIT

# create_user <label>  -> sets USER_ID and TOKEN
create_user() {
  local email="api-check-$1-$RUN_ID@example.test" password="check-password-$RUN_ID"
  local created
  created="$(curl -s -X POST "$API_URL/auth/v1/admin/users" -H "apikey: $SECRET_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"email_confirm\":true}")"
  USER_ID="$(echo "$created" | jq -r '.id')"
  USER_IDS+=("$USER_ID")
  TOKEN="$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" -H "apikey: $PUBLISHABLE_KEY" \
    -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
    | jq -r '.access_token')"
  if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ] || [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "Could not create or sign in the test user $1." >&2
    exit 2
  fi
}

# create_entry <token> <user_id>  -> sets ENTRY_ID and AUDIO_PATH (through the real API, with RLS)
create_entry() {
  ENTRY_ID="$(new_uuid)"
  AUDIO_PATH="$2/$ENTRY_ID.m4a"
  local status
  status="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API_URL/rest/v1/entries" \
    -H "apikey: $PUBLISHABLE_KEY" -H "Authorization: Bearer $1" -H "Content-Type: application/json" \
    -d "{\"id\":\"$ENTRY_ID\",\"local_date\":\"2026-11-17\",\"recorded_at\":\"2026-11-17T08:00:00Z\",\"duration_sec\":60,\"audio_path\":\"$AUDIO_PATH\"}")"
  if [ "$status" != "201" ]; then
    echo "Could not create the test entry (HTTP $status)." >&2
    exit 2
  fi
}

# upload <token> <path> <file> <content-type>  -> prints the HTTP status
upload() {
  curl -s -o "$WORK/upload.out" -w '%{http_code}' -X POST "$API_URL/storage/v1/object/audio/$2" \
    -H "apikey: $PUBLISHABLE_KEY" -H "Authorization: Bearer $1" \
    -H "Content-Type: $4" --data-binary "@$3"
}

head -c 700000 /dev/urandom > "$WORK/small.m4a"      # about a 3-minute recording at 32 kbps
head -c 6000000 /dev/urandom > "$WORK/large.m4a"     # over the 5 MB bucket limit
head -c 2000 /dev/urandom > "$WORK/image.png"

echo "API checks against $API_URL"
create_user a; A_ID="$USER_ID"; A_TOKEN="$TOKEN"
create_user b; B_ID="$USER_ID"; B_TOKEN="$TOKEN"

echo "Uploads"
create_entry "$A_TOKEN" "$A_ID"; E1="$ENTRY_ID"; P1="$AUDIO_PATH"; OBJECT_PATHS+=("$P1")
expect_status "a normal recording is accepted" "$(upload "$A_TOKEN" "$P1" "$WORK/small.m4a" audio/mp4)" "200"

# For each refusal, a following valid upload to the SAME path must work: that proves the
# refusal came from the limit, not from a wrong path or a missing entry.
create_entry "$A_TOKEN" "$A_ID"; P2="$AUDIO_PATH"; OBJECT_PATHS+=("$P2")
expect_status "a 6 MB file is refused" "$(upload "$A_TOKEN" "$P2" "$WORK/large.m4a" audio/mp4)" "4[0-9][0-9]"
expect_status "...and the same path accepts a normal file afterwards" \
  "$(upload "$A_TOKEN" "$P2" "$WORK/small.m4a" audio/mp4)" "200"

create_entry "$A_TOKEN" "$A_ID"; P3="$AUDIO_PATH"; OBJECT_PATHS+=("$P3")
expect_status "a PNG image is refused" "$(upload "$A_TOKEN" "$P3" "$WORK/image.png" image/png)" "4[0-9][0-9]"
expect_status "...and the same path accepts audio afterwards" \
  "$(upload "$A_TOKEN" "$P3" "$WORK/small.m4a" audio/mp4)" "200"

create_entry "$B_TOKEN" "$B_ID"; P_B="$AUDIO_PATH"; OBJECT_PATHS+=("$P_B")
expect_status "A cannot upload into B's folder" \
  "$(upload "$A_TOKEN" "$P_B" "$WORK/small.m4a" audio/mp4)" "4[0-9][0-9]"
expect_status "an upload with no matching entry is refused" \
  "$(upload "$A_TOKEN" "$A_ID/$(new_uuid).m4a" "$WORK/small.m4a" audio/mp4)" "4[0-9][0-9]"
expect_status "a retried upload at the same path is accepted with upsert" \
  "$(curl -s -o /dev/null -w '%{http_code}' -X PUT "$API_URL/storage/v1/object/audio/$P1" \
      -H "apikey: $PUBLISHABLE_KEY" -H "Authorization: Bearer $A_TOKEN" \
      -H "Content-Type: audio/mp4" --data-binary "@$WORK/small.m4a")" "200"

echo "Signed links and the public URL"
expect_status "the public URL does not serve a private file" \
  "$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/storage/v1/object/public/audio/$P1")" "400|401|403|404"

SIGNED="$(curl -s -X POST "$API_URL/storage/v1/object/sign/audio/$P1" \
  -H "apikey: $PUBLISHABLE_KEY" -H "Authorization: Bearer $A_TOKEN" \
  -H "Content-Type: application/json" -d '{"expiresIn": 3}' | jq -r '.signedURL // empty')"
if [ -n "$SIGNED" ]; then
  pass "the owner gets a signed link"
  expect_status "the signed link works before it expires" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/storage/v1$SIGNED")" "200"
  sleep 4
  expect_status "the signed link stops working after it expires" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/storage/v1$SIGNED")" "400|401|403"
else
  fail "the owner could not get a signed link"
fi

OTHER="$(curl -s -X POST "$API_URL/storage/v1/object/sign/audio/$P1" \
  -H "apikey: $PUBLISHABLE_KEY" -H "Authorization: Bearer $B_TOKEN" \
  -H "Content-Type: application/json" -d '{"expiresIn": 60}' | jq -r '.signedURL // empty')"
if [ -z "$OTHER" ]; then pass "B cannot get a signed link for A's file"; else fail "B got a signed link for A's file"; fi

echo "Anonymous access and ping"
ANON_BODY="$(curl -s -w '\n%{http_code}' "$API_URL/rest/v1/entries?select=id" -H "apikey: $PUBLISHABLE_KEY")"
ANON_STATUS="$(echo "$ANON_BODY" | tail -n1)"
ANON_ROWS="$(echo "$ANON_BODY" | sed '$d')"
if [[ "$ANON_STATUS" =~ ^(401|403)$ ]] || { [ "$ANON_STATUS" = "200" ] && [ "$ANON_ROWS" = "[]" ]; }; then
  pass "an anonymous visitor reads no entries (HTTP $ANON_STATUS)"
else
  fail "an anonymous visitor read entries (HTTP $ANON_STATUS)"
fi

for table in profiles ask_logs plan_limits; do
  S="$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/rest/v1/$table?select=*" -H "apikey: $PUBLISHABLE_KEY")"
  expect_status "an anonymous visitor cannot read $table" "$S" "401|403"
done

A_COUNT="$(curl -s "$API_URL/rest/v1/entries?select=id" -H "apikey: $PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $A_TOKEN" | jq 'length')"
if [ "$A_COUNT" = "3" ]; then pass "A reads exactly their own 3 entries"; else fail "A reads $A_COUNT entries, wanted 3"; fi

PING="$(curl -s -w '\n%{http_code}' -X POST "$API_URL/rest/v1/rpc/ping" \
  -H "apikey: $PUBLISHABLE_KEY" -H "Content-Type: application/json" -d '{}')"
if [ "$(echo "$PING" | tail -n1)" = "200" ] && [ "$(echo "$PING" | sed '$d')" = '"ok"' ]; then
  pass "ping returns ok with only the publishable key"
else
  fail "ping did not return ok ($PING)"
fi

expect_status "a helper function is not exposed as an API endpoint" \
  "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API_URL/rest/v1/rpc/tags_are_valid" \
      -H "apikey: $PUBLISHABLE_KEY" -H "Content-Type: application/json" -d '{"tags":[]}')" "404"


echo "Email sign-in code"
if [ -z "${MAILPIT_URL:-}" ]; then
  fail "the local mail service is not running (no MAILPIT_URL), so the sign-in code cannot be read"
else
  OTP_EMAIL="api-check-otp-$RUN_ID@example.test"

  # Wait (up to about 10 s) for the email to reach the test mailbox, and print its id.
  wait_for_mail() {
    local id="" tries=0
    while [ -z "$id" ] && [ "$tries" -lt 20 ]; do
      id="$(curl -s "$MAILPIT_URL/api/v1/search?query=to:$OTP_EMAIL" | jq -r '.messages[0].ID // empty')"
      [ -z "$id" ] && { sleep 0.5; tries=$((tries + 1)); }
    done
    echo "$id"
  }

  otp_request() {
    curl -s -w '\n%{http_code}' -X POST "$API_URL/auth/v1/otp" -H "apikey: $PUBLISHABLE_KEY" \
      -H "Content-Type: application/json" -d "{\"email\":\"$OTP_EMAIL\",\"create_user\":true}"
  }

  otp_verify() {
    curl -s -w '\n%{http_code}' -X POST "$API_URL/auth/v1/verify" -H "apikey: $PUBLISHABLE_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"type\":\"email\",\"email\":\"$OTP_EMAIL\",\"token\":\"$1\"}"
  }

  REQ="$(otp_request)"
  expect_status "a code is requested for a new address" "$(echo "$REQ" | tail -n1)" "200"

  MAIL_ID="$(wait_for_mail)"
  if [ -z "$MAIL_ID" ]; then
    fail "no sign-in email reached the test mailbox"
  else
    # Lines are joined: the formatter may put the code on its own line between the tags.
    MAIL_HTML="$(curl -s "$MAILPIT_URL/api/v1/message/$MAIL_ID" | jq -r '.HTML' | tr '\n' ' ')"
    # The code sits alone between two tags: >123456<
    CODE="$(echo "$MAIL_HTML" | grep -oE '>[[:space:]]*[0-9]{6}[[:space:]]*<' | grep -oE '[0-9]{6}' | head -n1)"
    if [ -n "$CODE" ]; then pass "the email holds a six digit code"; else fail "the email holds no six digit code"; fi
    if echo "$MAIL_HTML" | grep -qiE '<a[[:space:]>]|href='; then
      fail "the email holds a link (it must hold only the code)"
    else
      pass "the email holds no link"
    fi

    # The new user exists as soon as the code is requested: remember it for the cleanup.
    OTP_USER_ID="$(curl -s "$API_URL/auth/v1/admin/users?per_page=200" -H "apikey: $SECRET_KEY" \
      | jq -r --arg e "$OTP_EMAIL" '.users[]? | select(.email == $e) | .id' | head -n1)"
    [ -n "$OTP_USER_ID" ] && USER_IDS+=("$OTP_USER_ID")

    expect_status "asking again within 60 seconds is refused" "$(otp_request | tail -n1)" "429"

    WRONG="000000"; [ "$CODE" = "$WRONG" ] && WRONG="111111"
    BAD="$(otp_verify "$WRONG")"
    expect_status "a wrong code is refused" "$(echo "$BAD" | tail -n1)" "4[0-9][0-9]"
    if [ "$(echo "$BAD" | sed '$d' | jq -r '.error_code // empty')" = "otp_expired" ]; then
      pass "a wrong code answers otp_expired (the same answer as an expired one, so the app tells them apart by time)"
    else
      fail "a wrong code did not answer otp_expired: $(echo "$BAD" | sed '$d')"
    fi

    GOOD="$(otp_verify "$CODE")"
    expect_status "the right code is accepted" "$(echo "$GOOD" | tail -n1)" "200"
    OTP_TOKEN="$(echo "$GOOD" | sed '$d' | jq -r '.access_token // empty')"
    OTP_SESSION_USER="$(echo "$GOOD" | sed '$d' | jq -r '.user.id // empty')"
    if [ -n "$OTP_TOKEN" ]; then pass "the right code gives a session"; else fail "the right code gave no session"; fi

    PROFILE="$(curl -s "$API_URL/rest/v1/profiles?select=id" -H "apikey: $PUBLISHABLE_KEY" \
      -H "Authorization: Bearer $OTP_TOKEN" | jq -r '.[0].id // empty')"
    if [ -n "$PROFILE" ] && [ "$PROFILE" = "$OTP_SESSION_USER" ]; then
      pass "a profile row exists for the new user right after the first sign-in"
    else
      fail "no profile row for the new user"
    fi

    expect_status "the same code cannot be used twice" "$(otp_verify "$CODE" | tail -n1)" "4[0-9][0-9]"
  fi
fi
echo
if [ "$FAILURES" -eq 0 ]; then
  echo "All API checks passed."
else
  echo "$FAILURES API check(s) failed." >&2
  exit 1
fi
