#!/bin/bash

# ========================================
# Quick Fix for Nginx Configuration
# ========================================
# Run this on your EC2 instance to fix the empty server_name issue

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root: sudo ./fix-nginx.sh"
    exit 1
fi

APP_NAME="clinops"

print_info "Fixing Nginx configuration..."

# Hardcoded server IP (EC2 public IP)
SERVER_NAME="54.242.66.82"
print_info "Using hardcoded server IP: $SERVER_NAME"

# Backup existing config
if [ -f /etc/nginx/sites-available/${APP_NAME} ]; then
    cp /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-available/${APP_NAME}.backup.$(date +%Y%m%d_%H%M%S)
    print_info "Backed up existing config"
fi

# Create new Nginx configuration
print_info "Creating new Nginx configuration..."
cat > /etc/nginx/sites-available/${APP_NAME} <<EOF
# Upstream configuration
upstream ${APP_NAME}_app {
    server localhost:3000;
    keepalive 64;
}

# HTTP Server
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAME};
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Client body size limit
    client_max_body_size 50M;
    
    # Logging
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;
    
    # Main application
    location / {
        proxy_pass http://${APP_NAME}_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location /_next/static {
        proxy_pass http://${APP_NAME}_app;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
    
    # Health check endpoint
    location /api/health {
        proxy_pass http://${APP_NAME}_app;
        access_log off;
    }
    
    # Grafana (Observability Dashboard)
    location /grafana/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Buffering settings
        proxy_buffering off;
    }
    
    # Prometheus (Metrics)
    location /prometheus/ {
        proxy_pass http://localhost:9090/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
    
    # AlertManager
    location /alertmanager/ {
        proxy_pass http://localhost:9093/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/

# Test configuration
print_info "Testing Nginx configuration..."
if nginx -t; then
    print_info "Nginx configuration is valid!"
    
    # Restart Nginx
    print_info "Restarting Nginx..."
    systemctl restart nginx
    
    print_info "========================================="
    print_info "Nginx Fix Complete!"
    print_info "========================================="
    echo ""
    echo "Your application should now be accessible at:"
    echo "  http://${SERVER_NAME}"
    echo ""
    echo "Observability tools:"
    echo "  - Grafana: http://${SERVER_NAME}/grafana/"
    echo "  - Prometheus: http://${SERVER_NAME}/prometheus/"
    echo "  - AlertManager: http://${SERVER_NAME}/alertmanager/"
    echo ""
    print_info "Check application status: pm2 status"
    print_info "Check Nginx logs: tail -f /var/log/nginx/${APP_NAME}_*.log"
else
    print_error "Nginx configuration test failed!"
    print_error "Please check the configuration manually:"
    echo ""
    echo "  cat /etc/nginx/sites-available/${APP_NAME}"
    echo ""
    exit 1
fi
