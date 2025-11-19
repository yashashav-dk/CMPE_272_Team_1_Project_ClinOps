#!/bin/bash

# ========================================
# ClinOps EC2 Deployment Script
# ========================================
# This script automates the deployment of the ClinOps application on EC2
# Run as: sudo ./deploy.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="clinops"
APP_DIR="/home/ubuntu/CMPE_272_Team_1_Project_ClinOps"
APP_SUBDIR="clin-ops"
NODE_VERSION="20"
DOMAIN_NAME=""  # Set your domain or leave empty for IP-based setup

# ========================================
# Helper Functions
# ========================================

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# ========================================
# System Setup
# ========================================

setup_system() {
    print_info "Updating system packages..."
    apt-get update
    apt-get upgrade -y
    
    print_info "Installing essential packages..."
    apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx
}

# ========================================
# Node.js Setup
# ========================================

setup_nodejs() {
    print_info "Installing Node.js ${NODE_VERSION}..."
    
    # Install Node.js from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    npm install -g pnpm  # Optional: if you prefer pnpm
    
    print_info "Node.js version: $(node -v)"
    print_info "NPM version: $(npm -v)"
    print_info "PM2 version: $(pm2 -v)"
}

# ========================================
# Docker Setup
# ========================================

setup_docker() {
    print_info "Installing Docker and Docker Compose..."
    
    # Install prerequisites
    apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add ubuntu user to docker group
    usermod -aG docker ubuntu
    
    print_info "Docker version: $(docker --version)"
    print_info "Docker Compose version: $(docker compose version)"
}

# ========================================
# PostgreSQL Setup (SKIPPED - Using External Database)
# ========================================
# Note: This deployment assumes you're using an external PostgreSQL database
# (e.g., AWS RDS, Azure Database, Google Cloud SQL, etc.)

# ========================================
# Application Setup
# ========================================

setup_application() {
    print_info "Setting up application..."
    
    # Navigate to app directory
    cd "$APP_DIR/$APP_SUBDIR"
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_info "Creating environment configuration template..."
        cat > .env <<EOF
# Database (External Cloud Database)
# Add your DATABASE_URL here
DATABASE_URL=postgresql://user:password@your-db-host:5432/clinops?schema=public

# Application
NODE_ENV=production
PORT=3000

# JWT Secret (generate a secure random string)
JWT_SECRET=$(openssl rand -base64 64)

# Google Generative AI (Add your API key)
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# OpenTelemetry (for observability)
OTEL_SERVICE_NAME=clinops-app
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
        
        chmod 600 .env
        chown ubuntu:ubuntu .env
        
        print_warning "IMPORTANT: Edit /home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env"
        print_warning "  1. Add your DATABASE_URL"
        print_warning "  2. Add your Google AI API key"
    else
        print_info ".env file already exists, skipping creation"
    fi
    
    # Install dependencies
    print_info "Installing Node.js dependencies..."
    sudo -u ubuntu npm install
    
    # Sync Prisma schema with database
    print_info "Syncing database schema..."
    sudo -u ubuntu npx prisma generate
    
    # Use db push instead of migrate for external databases
    # This handles existing schemas gracefully without migration files
    print_info "Pushing schema to database (external DB-safe)..."
    sudo -u ubuntu npx prisma db push --accept-data-loss || {
        print_warning "Schema sync had warnings, but continuing..."
    }
    
    # Build application
    print_info "Building Next.js application..."
    sudo -u ubuntu npm run build
    
    print_info "Application setup complete"
}

# ========================================
# Observability Stack Setup
# ========================================

setup_observability() {
    print_info "Setting up observability stack with Docker Compose..."
    
    cd "$APP_DIR"
    
    # Create .env for observability if needed
    if [ ! -f .env.observability ]; then
        cat > .env.observability <<EOF
# Grafana Configuration
GF_ADMIN_USER=admin
GF_ADMIN_PASSWORD=admin

# Prometheus Configuration
PROMETHEUS_RETENTION_TIME=15d

# Loki Configuration
LOKI_RETENTION_PERIOD=168h
EOF
        chmod 600 .env.observability
        chown ubuntu:ubuntu .env.observability
    fi
    
    # Use production docker-compose file
    print_info "Starting observability services (Prometheus, Grafana, Loki, Tempo)..."
    sudo -u ubuntu docker compose -f docker-compose.production.yml --env-file .env.observability up -d
    
    # Wait for services to be healthy
    print_info "Waiting for services to start..."
    sleep 15
    
    # Check health
    print_info "Checking service health..."
    sudo -u ubuntu docker compose -f docker-compose.production.yml ps
    
    print_info "Observability stack started:"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001 (admin/admin)"
    echo "  - Loki: http://localhost:3100"
    echo "  - Tempo: http://localhost:3200"
    echo "  - AlertManager: http://localhost:9093"
}

# ========================================
# PM2 Setup
# ========================================

setup_pm2() {
    print_info "Configuring PM2 process manager..."
    
    cd "$APP_DIR/$APP_SUBDIR"
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'npm',
    args: 'start',
    cwd: '${APP_DIR}/${APP_SUBDIR}',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '${APP_DIR}/logs/pm2-error.log',
    out_file: '${APP_DIR}/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    exp_backoff_restart_delay: 100
  }]
};
EOF
    
    chown ubuntu:ubuntu ecosystem.config.js
    
    # Create logs directory
    mkdir -p "$APP_DIR/logs"
    chown -R ubuntu:ubuntu "$APP_DIR/logs"
    
    # Start application with PM2
    print_info "Starting application with PM2..."
    sudo -u ubuntu pm2 delete ${APP_NAME} 2>/dev/null || true
    sudo -u ubuntu pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    sudo -u ubuntu pm2 save
    
    # Setup PM2 to start on boot
    env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
    
    print_info "PM2 setup complete"
}

# ========================================
# Nginx Setup
# ========================================

setup_nginx() {
    print_info "Configuring Nginx..."
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Determine server name
    if [ -z "$DOMAIN_NAME" ]; then
        # Hardcoded EC2 public IP
        SERVER_NAME="54.242.66.82"
        print_info "Using hardcoded EC2 public IP: $SERVER_NAME"
    else
        SERVER_NAME="$DOMAIN_NAME"
        print_info "Using domain: $SERVER_NAME"
    fi
    
    # Create Nginx configuration
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
    
    # Test Nginx configuration
    print_info "Testing Nginx configuration..."
    if nginx -t; then
        print_info "Nginx configuration is valid"
        
        # Restart Nginx
        systemctl restart nginx
        systemctl enable nginx
        
        print_info "Nginx setup complete"
    else
        print_error "Nginx configuration test failed!"
        print_error "Check the configuration at: /etc/nginx/sites-available/${APP_NAME}"
        print_error "View the config with: cat /etc/nginx/sites-available/${APP_NAME}"
        exit 1
    fi
}

# ========================================
# SSL Setup (Optional)
# ========================================

setup_ssl() {
    if [ -z "$DOMAIN_NAME" ]; then
        print_warning "No domain name set. Skipping SSL setup."
        print_info "To enable SSL later, set DOMAIN_NAME and run: sudo certbot --nginx -d your-domain.com"
        return
    fi
    
    print_info "Setting up SSL with Let's Encrypt..."
    
    # Run certbot
    certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --register-unsafely-without-email --redirect
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    print_info "SSL setup complete"
}

# ========================================
# Firewall Setup
# ========================================

setup_firewall() {
    print_info "Configuring UFW firewall..."
    
    # Install UFW if not present
    apt-get install -y ufw
    
    # Set default policies
    ufw --force default deny incoming
    ufw --force default allow outgoing
    
    # Allow SSH, HTTP, and HTTPS
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow observability ports (optional - for direct access)
    # Comment these out if you only want access through Nginx reverse proxy
    ufw allow 3001/tcp  # Grafana
    ufw allow 9090/tcp  # Prometheus
    ufw allow 9093/tcp  # AlertManager
    ufw allow 3100/tcp  # Loki
    ufw allow 3200/tcp  # Tempo
    
    # Enable firewall
    ufw --force enable
    
    print_info "Firewall setup complete"
    print_info "Note: Observability tools are accessible via Nginx reverse proxy"
}

# ========================================
# Monitoring & Health Check
# ========================================

setup_monitoring() {
    print_info "Setting up basic monitoring..."
    
    # Create health check script
    cat > /usr/local/bin/clinops-health-check.sh <<'EOF'
#!/bin/bash

# Check if application is responding
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ "$response" != "200" ]; then
    echo "Application health check failed. Restarting..."
    pm2 restart clinops
    logger "ClinOps application was restarted due to health check failure"
fi
EOF
    
    chmod +x /usr/local/bin/clinops-health-check.sh
    
    # Add to crontab (run every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/clinops-health-check.sh") | crontab -
    
    print_info "Monitoring setup complete"
}

# ========================================
# Deployment Summary
# ========================================

print_summary() {
    print_info "========================================="
    print_info "Deployment Complete!"
    print_info "========================================="
    echo ""
    print_info "Application URLs:"
    echo "  - Main App: http://${SERVER_NAME}"
    echo "  - Grafana: http://${SERVER_NAME}/grafana/ or http://${SERVER_NAME}:3001"
    echo "  - Prometheus: http://${SERVER_NAME}/prometheus/ or http://${SERVER_NAME}:9090"
    echo "  - AlertManager: http://${SERVER_NAME}/alertmanager/ or http://${SERVER_NAME}:9093"
    echo ""
    print_info "Application Directory: ${APP_DIR}/${APP_SUBDIR}"
    print_info "Database: External Cloud Database (configured in .env)"
    echo ""
    print_info "Useful Commands:"
    echo "  Application:"
    echo "    - View logs: pm2 logs ${APP_NAME}"
    echo "    - Restart: pm2 restart ${APP_NAME}"
    echo "    - Status: pm2 status"
    echo ""
    echo "  Observability:"
    echo "    - View all containers: docker compose ps"
    echo "    - View logs: docker compose logs -f [service]"
    echo "    - Restart: docker compose restart [service]"
    echo "    - Stop all: docker compose down"
    echo "    - Start all: docker compose up -d"
    echo ""
    echo "  System:"
    echo "    - Nginx logs: tail -f /var/log/nginx/${APP_NAME}_*.log"
    echo "    - Restart Nginx: systemctl restart nginx"
    echo ""
    print_warning "IMPORTANT NEXT STEPS:"
    echo "  1. Edit ${APP_DIR}/${APP_SUBDIR}/.env"
    echo "     - Add your DATABASE_URL"
    echo "     - Add your GOOGLE_GENERATIVE_AI_API_KEY"
    echo "  2. Restart the application: pm2 restart ${APP_NAME}"
    echo "  3. Access Grafana at http://${SERVER_NAME}:3001 (admin/admin)"
    if [ -z "$DOMAIN_NAME" ]; then
        echo "  4. (Optional) Set up a domain and run SSL setup"
    fi
    echo ""
}

# ========================================
# Main Execution
# ========================================

main() {
    check_root
    
    print_info "Starting ClinOps deployment..."
    print_info "This may take 10-15 minutes..."
    echo ""
    
    # Check if app directory exists
    if [ ! -d "$APP_DIR" ]; then
        print_error "Application directory not found: $APP_DIR"
        print_error "Please clone the repository first:"
        print_error "  git clone https://github.com/your-repo/CMPE_272_Team_1_Project_ClinOps.git /home/ubuntu/CMPE_272_Team_1_Project_ClinOps"
        exit 1
    fi
    
    # Prompt for domain name
    read -p "Enter your domain name (press Enter to use IP address): " input_domain
    if [ ! -z "$input_domain" ]; then
        DOMAIN_NAME="$input_domain"
    fi
    
    # Execute setup steps
    setup_system
    setup_nodejs
    setup_docker
    setup_application
    setup_observability
    setup_pm2
    setup_nginx
    
    if [ ! -z "$DOMAIN_NAME" ]; then
        read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " setup_ssl_confirm
        if [ "$setup_ssl_confirm" = "y" ]; then
            setup_ssl
        fi
    fi
    
    setup_firewall
    setup_monitoring
    
    print_summary
}

# Run main function
main "$@"
