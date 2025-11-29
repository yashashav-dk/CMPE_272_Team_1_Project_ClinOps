#!/bin/bash

# ========================================
# ClinOps Database Restore Script
# ========================================
# Restores database from backup
# Run as: sudo ./restore.sh <backup_file>

set -e

# Configuration
DB_NAME="clinops"
DB_USER="clinops_user"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "Usage: sudo ./restore.sh <backup_file>"
    print_info "Available backups:"
    ls -lh /home/ubuntu/backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

print_warning "WARNING: This will replace the current database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_info "Restore cancelled."
    exit 0
fi

# Stop application
print_info "Stopping application..."
pm2 stop clinops

# Create temporary directory
TEMP_DIR=$(mktemp -d)
TEMP_SQL="$TEMP_DIR/restore.sql"

print_info "Decompressing backup..."
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

print_info "Dropping existing database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"

print_info "Creating new database..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

print_info "Restoring database..."
sudo -u postgres psql -d $DB_NAME < "$TEMP_SQL"

print_info "Granting privileges..."
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"

# Cleanup
rm -rf "$TEMP_DIR"

# Start application
print_info "Starting application..."
pm2 start clinops

print_info "Database restored successfully!"
print_info "Checking application status..."
pm2 status
