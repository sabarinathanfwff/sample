#!/usr/bin/env bash
# =============================================================
# setup-rds.sh - Initialize the RDS PostgreSQL database
# -------------------------------------------------------------
# Connects to the RDS instance, creates the application database
# (if not present), creates a least-privilege application user,
# grants permissions, loads the schema, and inserts seed data.
#
# Prerequisites:
#   - psql client installed (postgresql-client)
#   - Network access to the RDS endpoint (from EC2 or via tunnel)
#   - Master credentials (DBMasterUsername / DBMasterPassword)
#
# Usage:
#   DB_ENDPOINT=xxx.rds.amazonaws.com \
#   DB_MASTER_USERNAME=postgres \
#   DB_MASTER_PASSWORD=secret \
#   ./setup-rds.sh
# =============================================================

set -euo pipefail

# ---------------- Configuration ----------------
DB_ENDPOINT="${DB_ENDPOINT:-}"
DB_PORT="${DB_PORT:-5432}"
DB_MASTER_USERNAME="${DB_MASTER_USERNAME:-postgres}"
DB_MASTER_PASSWORD="${DB_MASTER_PASSWORD:-}"
APP_DB_NAME="${APP_DB_NAME:-food_delivery}"
APP_DB_USER="${APP_DB_USER:-food_delivery_app}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:-$(openssl rand -base64 18)}"
SCHEMA_FILE="${SCHEMA_FILE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../database" && pwd)/schema.sql}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@fooddelivery.com}"

LOG_FILE="/tmp/setup-rds-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO  $*"; }
die() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR $*" >&2; exit 1; }

[[ -n "$DB_ENDPOINT" ]] || die "DB_ENDPOINT is required."
[[ -n "$DB_MASTER_PASSWORD" ]] || die "DB_MASTER_PASSWORD is required."
[[ -f "$SCHEMA_FILE" ]] || die "Schema file not found: $SCHEMA_FILE"
command -v psql >/dev/null || die "psql client is required (install postgresql-client)."

export PGPASSWORD="$DB_MASTER_PASSWORD"

PSQL="psql -h $DB_ENDPOINT -p $DB_PORT -U $DB_MASTER_USERNAME -d postgres"

# ---------------- Create database ----------------
log "Ensuring database '$APP_DB_NAME' exists..."
if $PSQL -tc "SELECT 1 FROM pg_database WHERE datname='$APP_DB_NAME'" | grep -q 1; then
  log "Database already exists; skipping creation."
else
  $PSQL -c "CREATE DATABASE \"$APP_DB_NAME\" WITH ENCODING='UTF8' LC_COLLATE='C' LC_CTYPE='C';"
  log "Database created."
fi

# ---------------- Create application user ----------------
log "Ensuring application user '$APP_DB_USER' exists..."
if $PSQL -tc "SELECT 1 FROM pg_roles WHERE rolname='$APP_DB_USER'" | grep -q 1; then
  log "User already exists; updating password."
  $PSQL -c "ALTER USER \"$APP_DB_USER\" WITH PASSWORD '$APP_DB_PASSWORD';"
else
  $PSQL -c "CREATE USER \"$APP_DB_USER\" WITH PASSWORD '$APP_DB_PASSWORD' LOGIN;"
  log "User created."
fi

$PSQL -c "GRANT ALL PRIVILEGES ON DATABASE \"$APP_DB_NAME\" TO \"$APP_DB_USER\";"

# ---------------- Load schema ----------------
log "Loading schema from $SCHEMA_FILE ..."
# The schema uses the food_delivery_app role for grants; ensure it owns objects.
PGPASSWORD="$DB_MASTER_PASSWORD" psql \
  -h "$DB_ENDPOINT" -p "$DB_PORT" -U "$DB_MASTER_USERNAME" -d "$APP_DB_NAME" \
  -v ON_ERROR_STOP=1 \
  -c "GRANT ALL ON SCHEMA public TO \"$APP_DB_USER\";" \
  -f "$SCHEMA_FILE"
log "Schema loaded."

# ---------------- Seed data (idempotent) ----------------
log "Inserting seed data (admin user) if missing..."
PGPASSWORD="$DB_MASTER_PASSWORD" psql \
  -h "$DB_ENDPOINT" -p "$DB_PORT" -U "$DB_MASTER_USERNAME" -d "$APP_DB_NAME" \
  -v ON_ERROR_STOP=0 <<SQL
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
SELECT '$ADMIN_EMAIL',
       '\$2b\$10\$rQ7H8qZ8vX7Y8Z9aBcDeEeO2pQ3rS4tU5vW6xY7zA8bC9dE0fG1hI2',
       'Admin', 'User', 'admin', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = '$ADMIN_EMAIL');
SQL
log "Seed data complete."

# ---------------- Output ----------------
log "=== RDS initialization complete ==="
cat <<OUT
Database : $APP_DB_NAME
Host     : $DB_ENDPOINT:$DB_PORT
App user : $APP_DB_USER
App pass : $APP_DB_PASSWORD   <-- store securely (Secrets Manager / SSM)
OUT
log "Credentials also written to $LOG_FILE"
echo "APP_DB_USER=$APP_DB_USER" >> "$LOG_FILE"
echo "APP_DB_PASSWORD=$APP_DB_PASSWORD" >> "$LOG_FILE"
