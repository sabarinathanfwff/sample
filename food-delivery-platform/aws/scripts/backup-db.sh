#!/usr/bin/env bash
# =============================================================
# backup-db.sh - Backup PostgreSQL (RDS) to S3
# -------------------------------------------------------------
# Creates a compressed, timestamped pg_dump of the application
# database, uploads it to the S3 backup bucket, applies a
# retention policy (removes files older than RETENTION_DAYS),
# and writes a JSON manifest. Designed to run from cron.
#
# Prerequisites:
#   - pg_dump client (postgresql-client)
#   - aws CLI configured
#   - Network access to the DB endpoint
#
# Usage (cron example - daily at 02:30):
#   30 2 * * * /path/to/backup-db.sh >> /var/log/backup-db.log 2>&1
# =============================================================

set -euo pipefail

# ---------------- Configuration (override via env) ----------------
DB_ENDPOINT="${DB_ENDPOINT:-}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-food_delivery}"
DB_USER="${DB_USER:-food_delivery_app}"
DB_PASSWORD="${DB_PASSWORD:-}"
S3_BUCKET="${S3_BUCKET:-}"                 # e.g. env-fdp-images-123456789-us-east-1
S3_PREFIX="${S3_PREFIX:-db-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TMP_DIR="${TMP_DIR:-/tmp/db-backups}"
ENCRYPT="${ENCRYPT:-false}"                # set true to use gpg (optional)
KMS_KEY_ID="${KMS_KEY_ID:-}"               # if set, uses aws kms / server-side encryption

LOG_FILE="/var/log/backup-db.log"
mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO  $*"; }
die() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR $*" >&2; exit 1; }

[[ -n "$DB_ENDPOINT" ]] || die "DB_ENDPOINT is required."
[[ -n "$DB_PASSWORD" ]] || die "DB_PASSWORD is required."
[[ -n "$S3_BUCKET" ]]  || die "S3_BUCKET is required."
command -v pg_dump >/dev/null || die "pg_dump client is required."
command -v aws >/dev/null || die "aws CLI is required."

export PGPASSWORD="$DB_PASSWORD"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${TMP_DIR}/${DB_NAME}-${TIMESTAMP}.sql.gz"
mkdir -p "$TMP_DIR"

# ---------------- Dump ----------------
log "Starting backup of $DB_NAME from $DB_ENDPOINT..."
if pg_dump -h "$DB_ENDPOINT" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     --no-owner --no-privileges --verbose 2>>"$LOG_FILE" \
   | gzip -9 > "$BACKUP_FILE"; then
  log "Dump complete: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  die "pg_dump failed."
fi

# ---------------- Optional encryption ----------------
if [[ "$ENCRYPT" == "true" ]]; then
  command -v gpg >/dev/null || die "gpg required when ENCRYPT=true."
  gpg --batch --yes --symmetric --cipher-algo AES256 \
      --passphrase "$DB_PASSWORD" -o "${BACKUP_FILE}.gpg" "$BACKUP_FILE" \
      && rm -f "$BACKUP_FILE" && BACKUP_FILE="${BACKUP_FILE}.gpg"
  log "Backup encrypted with gpg."
fi

# ---------------- Upload ----------------
S3_KEY="${S3_PREFIX}/${DB_NAME}-${TIMESTAMP}.sql.gz${ENCRYPT/true/.gpg/}"
S3_URI="s3://${S3_BUCKET}/${S3_KEY}"

UPLOAD_ARGS=()
[[ -n "$KMS_KEY_ID" ]] && UPLOAD_ARGS+=(--sse aws:kms --sse-kms-key-id "$KMS_KEY_ID")

log "Uploading to $S3_URI ..."
aws s3 cp "$BACKUP_FILE" "$S3_URI" "${UPLOAD_ARGS[@]}" || die "S3 upload failed."

# ---------------- Retention cleanup ----------------
log "Applying retention policy ($RETENTION_DAYS days)..."
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | while read -r _ _ _ key; do
  obj_date=$(aws s3api head-object --bucket "$S3_BUCKET" --key "$key" \
             --query LastModified --output text 2>/dev/null || true)
  [[ -z "$obj_date" ]] && continue
  if [[ $(date -d "$obj_date" +%s 2>/dev/null || echo 0) -lt \
        $(date -d "-${RETENTION_DAYS} days" +%s) ]]; then
    log "  deleting expired: $key"
    aws s3 rm "s3://${S3_BUCKET}/${key}" || true
  fi
done

# ---------------- Manifest ----------------
MANIFEST="${TMP_DIR}/${DB_NAME}-${TIMESTAMP}-manifest.json"
cat > "$MANIFEST" <<JSON
{
  "database": "$DB_NAME",
  "endpoint": "$DB_ENDPOINT",
  "timestamp": "$TIMESTAMP",
  "file": "$BACKUP_FILE",
  "s3_uri": "$S3_URI",
  "size_bytes": $(stat -c%s "$BACKUP_FILE"),
  "retention_days": $RETENTION_DAYS
}
JSON
aws s3 cp "$MANIFEST" "s3://${S3_BUCKET}/${S3_PREFIX}/manifest-latest.json" "${UPLOAD_ARGS[@]}" || true

# ---------------- Cleanup ----------------
rm -f "$BACKUP_FILE" "$MANIFEST"
log "=== Backup complete and uploaded to $S3_URI ==="
