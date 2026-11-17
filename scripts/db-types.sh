#!/usr/bin/env bash
# Generates the TypeScript types from the local database (the single source of data types).
#
#   scripts/db-types.sh           write supabase/functions/_shared/database.types.ts
#   scripts/db-types.sh --check   fail when the committed file is out of date
#
# Needs the local stack: `npm run db:start`. The CLI targets the local database by default.
set -euo pipefail

TARGET="supabase/functions/_shared/database.types.ts"
TMP="$(mktemp)"
ERR="$(mktemp)"
trap 'rm -f "$TMP" "$ERR"' EXIT

# Generate into a temp file first, so a failing CLI never truncates the committed file.
# The CLI output is unformatted, so it goes through Prettier (a pinned dev dependency) to keep
# the diffs readable. A different file name is used because the real one is in .prettierignore.
# The CLI's "output is unformatted" note on stderr is noise, so stderr is shown only on failure.
if ! npx supabase gen types typescript 2> "$ERR" | npx prettier --stdin-filepath database.types.ts > "$TMP"; then
  cat "$ERR" >&2
  echo "Could not generate the types. Is the local stack running? (npm run db:start)" >&2
  exit 1
fi

if [ ! -s "$TMP" ]; then
  echo "The CLI produced no output. Is the local stack running? (npm run db:start)" >&2
  exit 1
fi

if [ "${1:-}" = "--check" ]; then
  if ! diff -u "$TARGET" "$TMP" > /dev/null; then
    echo "$TARGET is out of date. Run: npm run db:types" >&2
    diff -u "$TARGET" "$TMP" | head -40 >&2 || true
    exit 1
  fi
  echo "$TARGET is up to date."
else
  mkdir -p "$(dirname "$TARGET")"
  mv "$TMP" "$TARGET"
  trap - EXIT
  echo "Wrote $TARGET"
fi
