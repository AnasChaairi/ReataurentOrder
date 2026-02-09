#!/bin/bash
# Database backup script for restaurant ordering platform
# Usage: ./scripts/backup.sh
# Schedule via cron: 0 2 * * * /path/to/scripts/backup.sh

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_CONTAINER="${DB_CONTAINER:-restaurant_db}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/restaurant_db_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting database backup..."

# Perform backup using docker exec
docker exec "${DB_CONTAINER}" pg_dump \
  -U "${DB_USER:-postgres}" \
  -d "${DB_NAME:-restaurant_order_db}" \
  --no-owner \
  --clean \
  --if-exists \
  | gzip > "${BACKUP_FILE}"

# Verify backup
if [ -s "${BACKUP_FILE}" ]; then
  SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "[$(date)] Backup successful: ${BACKUP_FILE} (${SIZE})"
else
  echo "[$(date)] ERROR: Backup file is empty!"
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Clean up old backups
echo "[$(date)] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "restaurant_db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# List remaining backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "restaurant_db_*.sql.gz" | wc -l)
echo "[$(date)] Total backups: ${BACKUP_COUNT}"

echo "[$(date)] Backup complete."
