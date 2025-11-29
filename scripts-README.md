# Deployment Scripts Documentation

This directory contains all the scripts you need to deploy and manage your ClinOps application on EC2.

## Scripts Overview

### 🚀 Main Deployment Script

**`deploy.sh`** - Complete initial deployment automation

**What it does:**
- Installs Node.js 20, PostgreSQL, Nginx, and dependencies
- Sets up PostgreSQL database with secure credentials
- Creates and configures environment variables
- Builds the Next.js application
- Sets up PM2 process manager with clustering
- Configures Nginx as reverse proxy
- Sets up UFW firewall
- Configures basic health monitoring
- Optional SSL setup with Let's Encrypt

**Usage:**
```bash
sudo ./deploy.sh
```

**Time:** ~10-15 minutes

---

### 🔄 Redeployment Script

**`redeploy.sh`** - Quick updates after code changes

**What it does:**
- Pulls latest code from git
- Installs/updates dependencies
- Runs database migrations
- Rebuilds the application
- Restarts PM2 processes

**Usage:**
```bash
./redeploy.sh  # No sudo needed
```

**Time:** ~3-5 minutes

---

### 💾 Backup Script

**`backup.sh`** - Database backup automation

**What it does:**
- Creates timestamped PostgreSQL dump
- Compresses backup file
- Cleans up old backups (7-day retention)
- Stores in `/home/ubuntu/backups/`

**Usage:**
```bash
sudo ./backup.sh
```

**Automated backups:**
```bash
# Add to crontab for daily 2 AM backups
sudo crontab -e
# Add: 0 2 * * * /path/to/backup.sh >> /var/log/clinops-backup.log 2>&1
```

---

### 🔧 Restore Script

**`restore.sh`** - Database restoration

**What it does:**
- Stops application
- Restores database from backup
- Restarts application

**Usage:**
```bash
sudo ./restore.sh /home/ubuntu/backups/clinops_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

### 📋 Quick Start Script

**`quick-start.sh`** - Display setup instructions

**Usage:**
```bash
./quick-start.sh
```

---

## Step-by-Step Deployment Guide

### 1. Prepare EC2 Instance

**Requirements:**
- Ubuntu 22.04 LTS
- Minimum: t2.small (2GB RAM, 2 vCPUs)
- Recommended: t2.medium (4GB RAM, 2 vCPUs)
- Storage: 20GB minimum
- Security Group:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)

### 2. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3. Clone Repository

```bash
cd ~
git clone https://github.com/your-username/CMPE_272_Team_1_Project_ClinOps.git
cd CMPE_272_Team_1_Project_ClinOps
```

### 4. Make Scripts Executable

```bash
chmod +x deploy.sh redeploy.sh backup.sh restore.sh quick-start.sh
```

### 5. Run Deployment

```bash
sudo ./deploy.sh
```

**During deployment:**
- You'll be prompted for an optional domain name
- If you provide a domain, you can set up SSL
- Database password will be auto-generated
- All credentials saved to `/root/.clinops_db_password`

### 6. Configure API Keys

```bash
nano ~/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env
```

Update these values:
```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
```

### 7. Restart Application

```bash
pm2 restart clinops
```

### 8. Verify Deployment

```bash
# Check application status
pm2 status

# View logs
pm2 logs clinops

# Test health endpoint
curl http://localhost:3000/api/health

# Check external access
curl http://your-ec2-ip
```

---

## Common Commands Reference

### Application Management (PM2)

```bash
# View all processes
pm2 list

# View logs (real-time)
pm2 logs clinops

# View logs (last 100 lines)
pm2 logs clinops --lines 100

# Restart application
pm2 restart clinops

# Stop application
pm2 stop clinops

# Start application
pm2 start clinops

# Delete process
pm2 delete clinops

# Monitor resources
pm2 monit

# View detailed info
pm2 show clinops

# Flush logs
pm2 flush
```

### Database Management

```bash
# Connect to database as postgres user
sudo -u postgres psql

# Connect to clinops database
sudo -u postgres psql -d clinops

# List databases
sudo -u postgres psql -c "\l"

# Check database size
sudo -u postgres psql -d clinops -c "SELECT pg_size_pretty(pg_database_size('clinops'));"

# Run SQL query
sudo -u postgres psql -d clinops -c "SELECT COUNT(*) FROM users;"

# Backup manually
sudo -u postgres pg_dump clinops > backup.sql

# Restore manually
sudo -u postgres psql -d clinops < backup.sql
```

### Prisma Commands

```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name description

# Reset database (DANGER!)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
# Access at: http://your-ec2-ip:5555
# Make sure port 5555 is open in security group
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration (no downtime)
sudo nginx -s reload

# Restart Nginx
sudo systemctl restart nginx

# Stop Nginx
sudo systemctl stop nginx

# Start Nginx
sudo systemctl start nginx

# View status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/clinops_access.log

# View error logs
sudo tail -f /var/log/nginx/clinops_error.log

# Edit configuration
sudo nano /etc/nginx/sites-available/clinops
```

### System Management

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
# or
htop  # (install with: sudo apt install htop)

# Check running processes
ps aux | grep node

# Check ports in use
sudo netstat -tulpn | grep LISTEN

# View system logs
sudo journalctl -xe

# View systemd service logs
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f

# Restart server
sudo reboot
```

### Firewall (UFW)

```bash
# Check status
sudo ufw status

# Allow port
sudo ufw allow 80/tcp

# Deny port
sudo ufw deny 8080/tcp

# Delete rule
sudo ufw delete allow 80/tcp

# Enable firewall
sudo ufw enable

# Disable firewall
sudo ufw disable

# Reset firewall
sudo ufw reset
```

---

## Troubleshooting Guide

### Application Won't Start

```bash
# 1. Check PM2 logs
pm2 logs clinops --lines 50

# 2. Check if database is running
sudo systemctl status postgresql

# 3. Verify environment variables
cat ~/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env

# 4. Check if port 3000 is available
sudo netstat -tulpn | grep 3000

# 5. Try manual start
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops
npm start
```

### Database Connection Errors

```bash
# 1. Check PostgreSQL status
sudo systemctl status postgresql

# 2. Test connection
sudo -u postgres psql -d clinops -c "SELECT version();"

# 3. Check database exists
sudo -u postgres psql -c "\l" | grep clinops

# 4. Verify credentials
cat /root/.clinops_db_password

# 5. Check pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf

# 6. Restart PostgreSQL
sudo systemctl restart postgresql
```

### Nginx Issues

```bash
# 1. Test configuration
sudo nginx -t

# 2. Check if running
sudo systemctl status nginx

# 3. View error logs
sudo tail -100 /var/log/nginx/error.log

# 4. Check if port 80 is free
sudo netstat -tulpn | grep :80

# 5. Restart Nginx
sudo systemctl restart nginx
```

### Permission Issues

```bash
# Fix ownership of application directory
sudo chown -R ubuntu:ubuntu ~/CMPE_272_Team_1_Project_ClinOps

# Fix .env permissions
chmod 600 ~/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env

# Fix logs directory
sudo chown -R ubuntu:ubuntu ~/CMPE_272_Team_1_Project_ClinOps/logs
```

### High Memory Usage

```bash
# 1. Check memory
free -h

# 2. View process memory
pm2 monit

# 3. Restart application
pm2 restart clinops

# 4. Reduce PM2 instances
# Edit ecosystem.config.js: change instances from 'max' to 1 or 2
pm2 restart clinops
```

### SSL Certificate Issues

```bash
# 1. Check certificate
sudo certbot certificates

# 2. Renew certificate
sudo certbot renew

# 3. Test renewal
sudo certbot renew --dry-run

# 4. Restart Nginx after renewal
sudo systemctl restart nginx
```

---

## File Locations

| Item | Location |
|------|----------|
| Application | `/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops` |
| Environment | `/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env` |
| PM2 Config | `/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops/ecosystem.config.js` |
| Nginx Config | `/etc/nginx/sites-available/clinops` |
| Application Logs | `/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/logs/` |
| Nginx Logs | `/var/log/nginx/clinops_*.log` |
| Backups | `/home/ubuntu/backups/` |
| DB Password | `/root/.clinops_db_password` |
| PostgreSQL Config | `/etc/postgresql/*/main/postgresql.conf` |
| UFW Rules | `/etc/ufw/` |

---

## Security Best Practices

### 1. SSH Security

```bash
# Disable password authentication (use keys only)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Change SSH port (optional)
# Edit /etc/ssh/sshd_config: Port 2222
# Update security group and UFW
```

### 2. Database Security

```bash
# Use strong passwords
# Store .env securely (chmod 600)
# Regularly backup database
# Use SSL for database connections (production)
```

### 3. Application Security

```bash
# Keep dependencies updated
npm audit
npm audit fix

# Use environment variables for secrets
# Never commit .env to git
# Rotate JWT secrets regularly
```

### 4. System Security

```bash
# Keep system updated
sudo apt update && sudo apt upgrade -y

# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

---

## Performance Optimization

### 1. PM2 Clustering

Edit `ecosystem.config.js`:
```javascript
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

### 2. Nginx Caching

Add to Nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### 3. Database Connection Pool

In `.env`:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/clinops?schema=public&connection_limit=10&pool_timeout=20"
```

### 4. Node.js Optimization

```bash
# Increase Node.js memory limit
# In ecosystem.config.js:
node_args: '--max-old-space-size=2048'
```

---

## Monitoring & Logging

### Set up Log Rotation

```bash
sudo nano /etc/logrotate.d/clinops
```

Add:
```
/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Set up Monitoring Alerts

```bash
# Install monitoring tools
sudo apt install prometheus-node-exporter

# Configure alerts (see DEPLOYMENT.md)
```

---

## Backup Strategy

### Automated Daily Backups

1. Create backup script (already provided: `backup.sh`)
2. Add to crontab:
```bash
sudo crontab -e
```

Add:
```
0 2 * * * /home/ubuntu/CMPE_272_Team_1_Project_ClinOps/backup.sh >> /var/log/clinops-backup.log 2>&1
```

### Backup to S3 (Optional)

```bash
# Install AWS CLI
sudo apt install awscli

# Configure
aws configure

# Add to backup script
aws s3 cp /home/ubuntu/backups/ s3://your-bucket/clinops-backups/ --recursive
```

---

## Quick Reference Card

```bash
# Application
pm2 logs clinops              # View logs
pm2 restart clinops           # Restart app
pm2 monit                     # Monitor resources

# Database
sudo -u postgres psql -d clinops  # Connect to DB
sudo ./backup.sh              # Backup database
sudo ./restore.sh <file>      # Restore database

# Deployment
./redeploy.sh                 # Update application
sudo systemctl restart nginx  # Restart web server

# Monitoring
pm2 status                    # App status
df -h                         # Disk space
free -h                       # Memory usage
top                           # CPU usage
```

---

**For detailed deployment guide, see:** [DEPLOYMENT.md](./DEPLOYMENT.md)

**Last Updated:** November 2024
