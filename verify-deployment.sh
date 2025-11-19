#!/bin/bash

# ========================================
# ClinOps Deployment Verification Script
# ========================================
# Checks if all components are running correctly

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
}

print_check() {
    echo -e "\n${YELLOW}→${NC} Checking: $1"
}

print_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAILED++))
}

print_info() {
    echo -e "  ${BLUE}ℹ${NC} $1"
}

# ========================================
# Verification Functions
# ========================================

check_node() {
    print_check "Node.js Installation"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_pass "Node.js installed: $NODE_VERSION"
    else
        print_fail "Node.js not found"
        return 1
    fi
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_pass "NPM installed: v$NPM_VERSION"
    else
        print_fail "NPM not found"
        return 1
    fi
}

check_pm2() {
    print_check "PM2 Process Manager"
    
    if command -v pm2 &> /dev/null; then
        print_pass "PM2 installed"
        
        if pm2 list | grep -q "clinops"; then
            STATUS=$(pm2 jlist | grep -A 10 '"name":"clinops"' | grep '"status"' | cut -d'"' -f4)
            if [ "$STATUS" = "online" ]; then
                print_pass "ClinOps application is running"
            else
                print_fail "ClinOps application status: $STATUS"
            fi
        else
            print_fail "ClinOps application not found in PM2"
        fi
    else
        print_fail "PM2 not installed"
    fi
}

check_postgresql() {
    print_check "PostgreSQL Database"
    
    if systemctl is-active --quiet postgresql; then
        print_pass "PostgreSQL service is running"
        
        if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "clinops"; then
            print_pass "ClinOps database exists"
            
            # Check database size
            DB_SIZE=$(sudo -u postgres psql -d clinops -t -c "SELECT pg_size_pretty(pg_database_size('clinops'));" 2>/dev/null || echo "unknown")
            print_info "Database size: $DB_SIZE"
        else
            print_fail "ClinOps database not found"
        fi
    else
        print_fail "PostgreSQL service not running"
    fi
}

check_nginx() {
    print_check "Nginx Web Server"
    
    if systemctl is-active --quiet nginx; then
        print_pass "Nginx service is running"
        
        if [ -f /etc/nginx/sites-available/clinops ]; then
            print_pass "ClinOps Nginx config exists"
            
            if [ -L /etc/nginx/sites-enabled/clinops ]; then
                print_pass "ClinOps Nginx config is enabled"
            else
                print_fail "ClinOps Nginx config not enabled"
            fi
        else
            print_fail "ClinOps Nginx config not found"
        fi
        
        # Test Nginx config
        if sudo nginx -t &> /dev/null; then
            print_pass "Nginx configuration is valid"
        else
            print_fail "Nginx configuration has errors"
        fi
    else
        print_fail "Nginx service not running"
    fi
}

check_firewall() {
    print_check "Firewall (UFW)"
    
    if command -v ufw &> /dev/null; then
        if sudo ufw status | grep -q "Status: active"; then
            print_pass "UFW firewall is active"
            
            if sudo ufw status | grep -q "80/tcp"; then
                print_pass "Port 80 (HTTP) is open"
            else
                print_fail "Port 80 (HTTP) is not open"
            fi
            
            if sudo ufw status | grep -q "443/tcp"; then
                print_pass "Port 443 (HTTPS) is open"
            else
                print_info "Port 443 (HTTPS) is not open (SSL may not be configured)"
            fi
        else
            print_fail "UFW firewall is not active"
        fi
    else
        print_fail "UFW not installed"
    fi
}

check_app_health() {
    print_check "Application Health"
    
    # Check if app is listening on port 3000
    if netstat -tulpn 2>/dev/null | grep -q ":3000"; then
        print_pass "Application is listening on port 3000"
    else
        print_fail "Application not listening on port 3000"
        return 1
    fi
    
    # Check health endpoint
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "")
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        print_pass "Health endpoint responding correctly"
        
        # Extract uptime if available
        UPTIME=$(echo "$HEALTH_RESPONSE" | grep -o '"uptime":[0-9.]*' | cut -d: -f2 | cut -d. -f1)
        if [ ! -z "$UPTIME" ]; then
            UPTIME_MIN=$((UPTIME / 60))
            print_info "Application uptime: ${UPTIME_MIN} minutes"
        fi
    else
        print_fail "Health endpoint not responding"
    fi
}

check_external_access() {
    print_check "External Access"
    
    # Try to get public IP
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
    
    if [ ! -z "$PUBLIC_IP" ]; then
        print_info "Public IP: $PUBLIC_IP"
        
        # Check if Nginx is proxying correctly
        NGINX_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
        if [ "$NGINX_RESPONSE" = "200" ]; then
            print_pass "Nginx reverse proxy is working"
        else
            print_fail "Nginx reverse proxy returned: $NGINX_RESPONSE"
        fi
    else
        print_info "Could not determine public IP (may not be EC2)"
    fi
}

check_environment() {
    print_check "Environment Configuration"
    
    ENV_FILE="/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env"
    
    if [ -f "$ENV_FILE" ]; then
        print_pass "Environment file exists"
        
        # Check for required variables
        if grep -q "DATABASE_URL=" "$ENV_FILE"; then
            print_pass "DATABASE_URL is set"
        else
            print_fail "DATABASE_URL not found in .env"
        fi
        
        if grep -q "GOOGLE_GENERATIVE_AI_API_KEY=" "$ENV_FILE"; then
            VALUE=$(grep "GOOGLE_GENERATIVE_AI_API_KEY=" "$ENV_FILE" | cut -d= -f2)
            if [ "$VALUE" != "your_api_key_here" ] && [ ! -z "$VALUE" ]; then
                print_pass "Google AI API key is configured"
            else
                print_fail "Google AI API key not configured"
            fi
        else
            print_fail "GOOGLE_GENERATIVE_AI_API_KEY not found in .env"
        fi
        
        if grep -q "JWT_SECRET=" "$ENV_FILE"; then
            print_pass "JWT_SECRET is set"
        else
            print_fail "JWT_SECRET not found in .env"
        fi
    else
        print_fail "Environment file not found"
    fi
}

check_backups() {
    print_check "Backup Configuration"
    
    BACKUP_DIR="/home/ubuntu/backups"
    
    if [ -d "$BACKUP_DIR" ]; then
        print_pass "Backup directory exists"
        
        BACKUP_COUNT=$(find "$BACKUP_DIR" -name "clinops_backup_*.sql.gz" 2>/dev/null | wc -l)
        print_info "Number of backups: $BACKUP_COUNT"
        
        if [ $BACKUP_COUNT -gt 0 ]; then
            LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/clinops_backup_*.sql.gz 2>/dev/null | head -1)
            if [ ! -z "$LATEST_BACKUP" ]; then
                BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 86400 ))
                print_info "Latest backup age: $BACKUP_AGE days"
            fi
        fi
    else
        print_info "Backup directory not found (backups not yet created)"
    fi
    
    # Check if backup cron is configured
    if sudo crontab -l 2>/dev/null | grep -q "backup.sh"; then
        print_pass "Automated backup is configured"
    else
        print_info "Automated backup not configured in crontab"
    fi
}

check_logs() {
    print_check "Log Files"
    
    LOGS_DIR="/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/logs"
    
    if [ -d "$LOGS_DIR" ]; then
        print_pass "Logs directory exists"
        
        if [ -f "$LOGS_DIR/pm2-out.log" ]; then
            LOG_SIZE=$(du -h "$LOGS_DIR/pm2-out.log" | cut -f1)
            print_info "PM2 output log size: $LOG_SIZE"
        fi
        
        if [ -f "$LOGS_DIR/pm2-error.log" ]; then
            ERROR_COUNT=$(wc -l < "$LOGS_DIR/pm2-error.log")
            if [ $ERROR_COUNT -gt 0 ]; then
                print_info "PM2 error log has $ERROR_COUNT lines"
            fi
        fi
    else
        print_fail "Logs directory not found"
    fi
    
    # Check Nginx logs
    if [ -f "/var/log/nginx/clinops_access.log" ]; then
        print_pass "Nginx access log exists"
    fi
    
    if [ -f "/var/log/nginx/clinops_error.log" ]; then
        ERROR_COUNT=$(wc -l < "/var/log/nginx/clinops_error.log")
        if [ $ERROR_COUNT -eq 0 ]; then
            print_pass "No Nginx errors"
        else
            print_info "Nginx error log has $ERROR_COUNT lines"
        fi
    fi
}

check_ssl() {
    print_check "SSL/HTTPS Configuration"
    
    if command -v certbot &> /dev/null; then
        print_pass "Certbot is installed"
        
        if sudo certbot certificates 2>/dev/null | grep -q "Certificate Name"; then
            print_pass "SSL certificates are configured"
            
            # Check certificate expiry
            CERT_INFO=$(sudo certbot certificates 2>/dev/null)
            if echo "$CERT_INFO" | grep -q "VALID"; then
                EXPIRY=$(echo "$CERT_INFO" | grep "Expiry Date" | head -1 | cut -d: -f2-)
                print_info "Certificate expiry: $EXPIRY"
            fi
        else
            print_info "No SSL certificates found (HTTP only)"
        fi
        
        # Check if auto-renewal is configured
        if systemctl is-enabled certbot.timer &> /dev/null; then
            print_pass "SSL auto-renewal is enabled"
        else
            print_info "SSL auto-renewal not configured"
        fi
    else
        print_info "Certbot not installed (SSL not configured)"
    fi
}

# ========================================
# System Resource Checks
# ========================================

check_resources() {
    print_check "System Resources"
    
    # Disk space
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -lt 80 ]; then
        print_pass "Disk usage: ${DISK_USAGE}%"
    else
        print_fail "Disk usage high: ${DISK_USAGE}%"
    fi
    
    # Memory
    MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
    if [ $MEM_USAGE -lt 90 ]; then
        print_pass "Memory usage: ${MEM_USAGE}%"
    else
        print_fail "Memory usage high: ${MEM_USAGE}%"
    fi
    
    # CPU load
    LOAD=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
    print_info "CPU load average: $LOAD"
    
    # Check if swap is configured
    SWAP=$(free -h | awk 'NR==3 {print $2}')
    if [ "$SWAP" != "0B" ]; then
        print_pass "Swap space configured: $SWAP"
    else
        print_info "No swap space configured"
    fi
}

# ========================================
# Main Execution
# ========================================

main() {
    clear
    echo -e "${GREEN}"
    cat << "EOF"
   _____ _ _       ____             
  / ____| (_)     / __ \            
 | |    | |_ _ __ | |  | |_ __  ___
 | |    | | | '_ \| |  | | '_ \/ __|
 | |____| | | | | | |__| | |_) \__ \
  \_____|_|_|_| |_|\____/| .__/|___/
                         | |        
                         |_|        
  Deployment Verification
EOF
    echo -e "${NC}"
    
    print_header "Starting Verification Checks"
    
    # Run all checks
    check_node
    check_pm2
    check_postgresql
    check_nginx
    check_firewall
    check_app_health
    check_external_access
    check_environment
    check_backups
    check_logs
    check_ssl
    check_resources
    
    # Summary
    print_header "Verification Summary"
    echo ""
    echo -e "  ${GREEN}Passed:${NC} $PASSED"
    echo -e "  ${RED}Failed:${NC} $FAILED"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Deployment is healthy.${NC}"
        echo ""
        
        # Show access information
        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
        if [ ! -z "$PUBLIC_IP" ]; then
            echo -e "${BLUE}Access your application at:${NC}"
            echo -e "  ${GREEN}→${NC} http://$PUBLIC_IP"
            echo ""
        fi
        
        return 0
    else
        echo -e "${RED}✗ Some checks failed. Please review the issues above.${NC}"
        echo ""
        echo -e "${YELLOW}Common fixes:${NC}"
        echo "  - Application not running: pm2 restart clinops"
        echo "  - Database not running: sudo systemctl start postgresql"
        echo "  - Nginx not running: sudo systemctl start nginx"
        echo "  - API key not configured: nano ~/.env and pm2 restart clinops"
        echo ""
        return 1
    fi
}

# Run verification
main "$@"
