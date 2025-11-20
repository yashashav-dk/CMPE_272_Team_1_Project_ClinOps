#!/bin/bash

# ========================================
# Grafana Troubleshooting Script
# ========================================
# Run this on EC2 to diagnose Grafana issues

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_step() {
    echo -e "\n${BLUE}▶${NC} $1"
}

echo "========================================"
echo "  Grafana Troubleshooting"
echo "========================================"
echo ""

# Check 1: Docker is running
print_step "1. Checking if Docker is running..."
if systemctl is-active --quiet docker; then
    print_info "Docker is running"
else
    print_error "Docker is NOT running"
    echo "  Fix: sudo systemctl start docker"
    exit 1
fi

# Check 2: Grafana container status
print_step "2. Checking Grafana container status..."
if docker ps --format '{{.Names}}' | grep -q clinops-grafana; then
    print_info "Grafana container is running"
    
    # Get container details
    echo ""
    docker ps --filter name=clinops-grafana --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    print_error "Grafana container is NOT running"
    
    # Check if container exists but is stopped
    if docker ps -a --format '{{.Names}}' | grep -q clinops-grafana; then
        print_warning "Grafana container exists but is stopped"
        echo "  Fix: cd ~/CMPE_272_Team_1_Project_ClinOps && docker compose -f docker-compose.production.yml up -d grafana"
    else
        print_error "Grafana container does not exist"
        echo "  Fix: cd ~/CMPE_272_Team_1_Project_ClinOps && docker compose -f docker-compose.production.yml up -d"
    fi
    exit 1
fi

# Check 3: Grafana logs
print_step "3. Checking Grafana logs (last 10 lines)..."
echo ""
docker logs --tail 10 clinops-grafana

# Check 4: Port 3001 is listening
print_step "4. Checking if Grafana port (3001) is listening..."
if netstat -tuln 2>/dev/null | grep -q ":3001" || ss -tuln 2>/dev/null | grep -q ":3001"; then
    print_info "Port 3001 is listening"
else
    print_error "Port 3001 is NOT listening"
    echo "  This means Grafana is not accessible on port 3001"
fi

# Check 5: Can access Grafana directly
print_step "5. Testing direct access to Grafana..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/grafana/ | grep -q "200\|302"; then
    print_info "Grafana responds on http://localhost:3001/grafana/"
else
    print_warning "Cannot access Grafana directly"
    echo "  Response code: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/grafana/)"
fi

# Check 6: Nginx configuration
print_step "6. Checking Nginx configuration..."
if [ -f /etc/nginx/sites-available/clinops ]; then
    if grep -q "location /grafana/" /etc/nginx/sites-available/clinops; then
        print_info "Nginx has Grafana proxy configuration"
    else
        print_error "Nginx is missing Grafana proxy configuration"
        echo "  Fix: Run sudo ./fix-nginx.sh"
    fi
else
    print_error "Nginx configuration file not found"
    echo "  Fix: Run sudo ./fix-nginx.sh"
fi

# Check 7: Nginx is running
print_step "7. Checking Nginx status..."
if systemctl is-active --quiet nginx; then
    print_info "Nginx is running"
else
    print_error "Nginx is NOT running"
    echo "  Fix: sudo systemctl start nginx"
    exit 1
fi

# Check 8: Test Nginx proxy to Grafana
print_step "8. Testing Nginx proxy to Grafana..."
RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://54.89.161.15/grafana/ 2>/dev/null || echo "000")
if [ "$RESPONSE_CODE" = "200" ] || [ "$RESPONSE_CODE" = "302" ]; then
    print_info "Grafana is accessible via Nginx at http://54.89.161.15/grafana/"
    echo ""
    echo "========================================"
    echo "  ✓ Grafana is working!"
    echo "========================================"
    echo ""
    echo "Access URLs:"
    echo "  - Via Nginx: http://54.89.161.15/grafana/"
    echo "  - Direct:    http://54.89.161.15:3001"
    echo ""
    echo "Default credentials:"
    echo "  Username: admin"
    echo "  Password: admin"
else
    print_error "Cannot access Grafana via Nginx (HTTP $RESPONSE_CODE)"
    
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Update Nginx configuration:"
    echo "   sudo ./fix-nginx.sh"
    echo ""
    echo "2. Restart Nginx:"
    echo "   sudo systemctl restart nginx"
    echo ""
    echo "3. Check Nginx error logs:"
    echo "   sudo tail -f /var/log/nginx/clinops_error.log"
    echo ""
    echo "4. Restart Grafana container:"
    echo "   cd ~/CMPE_272_Team_1_Project_ClinOps"
    echo "   docker compose -f docker-compose.production.yml restart grafana"
fi

# Check 9: Firewall
print_step "9. Checking firewall rules..."
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "3001.*ALLOW"; then
        print_info "Firewall allows port 3001"
    else
        print_warning "Firewall may be blocking port 3001"
        echo "  Fix: sudo ufw allow 3001/tcp"
    fi
else
    print_info "UFW not installed (firewall check skipped)"
fi

echo ""
echo "========================================"
echo "  Quick Commands"
echo "========================================"
echo ""
echo "View Grafana logs:"
echo "  docker logs -f clinops-grafana"
echo ""
echo "Restart Grafana:"
echo "  cd ~/CMPE_272_Team_1_Project_ClinOps"
echo "  docker compose -f docker-compose.production.yml restart grafana"
echo ""
echo "Fix Nginx config:"
echo "  sudo ./fix-nginx.sh"
echo ""
echo "Test Grafana directly:"
echo "  curl -I http://localhost:3001/grafana/"
echo ""
