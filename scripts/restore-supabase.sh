#!/usr/bin/env bash
# Restore Supabase dashboard backup per:
# https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"
BACKUP_FILE="$ROOT_DIR/db_cluster-25-08-2025@16-18-11.backup"
PSQL="/opt/homebrew/opt/postgresql@17/bin/psql"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.local"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Missing backup file: $BACKUP_FILE"
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
  echo "Get it from: Supabase Dashboard → Project Settings → Database → Reset database password"
  exit 1
fi

if [[ ! -x "$PSQL" ]]; then
  echo "psql not found at $PSQL"
  echo "Install: brew install postgresql@17"
  exit 1
fi

# Session pooler (recommended by Supabase docs)
POOLER_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo "Restoring backup to project: $PROJECT_REF"
echo "Backup file: $BACKUP_FILE"
echo ""
echo "Note: errors like 'already exists' are expected per Supabase docs."
echo ""

restore_with() {
  local url="$1"
  local label="$2"
  echo "Trying $label..."
  if "$PSQL" "$url" -v ON_ERROR_STOP=0 -f "$BACKUP_FILE"; then
    echo ""
    echo "Restore finished via $label."
    return 0
  fi
  return 1
}

if restore_with "$POOLER_URL" "session pooler"; then
  exit 0
fi

echo ""
echo "Pooler failed, trying direct connection..."
restore_with "$DIRECT_URL" "direct connection"
