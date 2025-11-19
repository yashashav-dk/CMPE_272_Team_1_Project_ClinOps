#!/bin/bash

# ========================================
# ClinOps Database Backup Script
# ========================================
# Creates backups of the PostgreSQL database
# Run as: sudo ./backup.sh

set -e

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
DB_NAME="clinops"
DB_USER="clinops_user"
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"

print_info "Starting database backup..."

# Create backup
sudo -u postgres pg_dump -U postgres $DB_NAME > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

print_info "Backup created: $BACKUP_FILE"

# Remove old backups
print_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List recent backups
print_info "Recent backups:"
ls -lh "$BACKUP_DIR" | grep "${DB_NAME}_backup_"

print_info "Backup complete!"
