#!/usr/bin/env bash
# Apply feature-pack migration to Supabase via psql.
# Requires SUPABASE_DB_PASSWORD in .env.local

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"
MIGRATION="$ROOT_DIR/scripts/migrations/001-feature-pack.sql"

PSQL="${PSQL:-/opt/homebrew/opt/postgresql@17/bin/psql}"
if ! command -v psql >/dev/null 2>&1; then
  PSQL="$(command -v psql)"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.local"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

if [[ -z "$PROJECT_REF" && -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  PROJECT_REF="$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's#https://([^.]+)\.supabase\.co.*#\1#')"
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "Set SUPABASE_PROJECT_REF in .env.local"
  exit 1
fi

if [[ -z "$DB_PASSWORD" ]]; then
  echo "Set SUPABASE_DB_PASSWORD in .env.local"
  echo "Or paste scripts/migrations/001-feature-pack.sql into Supabase SQL Editor."
  exit 1
fi

if [[ ! -f "$MIGRATION" ]]; then
  echo "Missing $MIGRATION"
  exit 1
fi

POOLER_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo "Applying migration to project: $PROJECT_REF"

if psql "$POOLER_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"; then
  echo "Migration applied via session pooler."
  exit 0
fi

echo "Pooler failed, trying direct connection..."
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"
echo "Migration applied via direct connection."
