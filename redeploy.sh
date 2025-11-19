#!/bin/bash

# ========================================
# ClinOps Quick Redeploy Script
# ========================================
# Use this script to redeploy after making code changes
# Run as: ./redeploy.sh (no sudo needed)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="/home/ubuntu/CMPE_272_Team_1_Project_ClinOps"
APP_DIR="$ROOT_DIR/clin-ops"
APP_NAME="clinops"

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

# Navigate to root directory
cd "$ROOT_DIR"

print_info "Starting redeployment..."
echo ""

# Pull latest changes
print_step "Pulling latest changes from Git..."
git pull origin main || git pull origin master

# Update observability stack
print_step "Updating observability stack..."
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d

# Navigate to app directory
cd "$APP_DIR"

# Install/update dependencies
print_step "Installing/updating dependencies..."
npm install

# Run Prisma migrations
print_step "Running database migrations..."
npx prisma generate
npx prisma migrate deploy

# Build application
print_step "Building application..."
npm run build

# Restart application
print_step "Restarting application..."
pm2 restart $APP_NAME

# Wait a moment for restart
sleep 3

# Show status
print_step "Deployment Status:"
echo ""
print_info "Application:"
pm2 status

echo ""
print_info "Observability Services:"
cd "$ROOT_DIR"
docker compose -f docker-compose.production.yml ps

echo ""
print_info "Redeployment complete!"
echo ""
echo "Useful commands:"
echo "  - View app logs: pm2 logs $APP_NAME"
echo "  - View Docker logs: docker compose logs -f [service]"
echo "  - Check health: curl http://localhost:3000/api/health"
