# ClinOps Quick Reference Card

## 🚀 Deployment Commands

```bash
# Initial deployment (run once)
sudo ./deploy.sh

# Update after code changes
./redeploy.sh

# Verify deployment health
./verify-deployment.sh

# Backup database (if using local DB)
sudo ./backup.sh

# Restore database (if using local DB)
sudo ./restore.sh <backup-file>
```

## 🔧 Application Management (PM2)

```bash
# View logs (live)
pm2 logs clinops

# View logs (last 100 lines)
pm2 logs clinops --lines 100

# Check status
pm2 status

# Restart app
pm2 restart clinops

# Stop app
pm2 stop clinops

# Start app
pm2 start clinops

# Resource monitor
pm2 monit

# Flush logs
pm2 flush
```

## 🐳 Docker Management

```bash
# View all containers
docker compose -f docker-compose.production.yml ps

# View logs (all services)
docker compose -f docker-compose.production.yml logs -f

# View logs (specific service)
docker compose -f docker-compose.production.yml logs -f grafana

# Restart all services
docker compose -f docker-compose.production.yml restart

# Restart specific service
docker compose -f docker-compose.production.yml restart prometheus

# Stop all
docker compose -f docker-compose.production.yml down

# Start all
docker compose -f docker-compose.production.yml up -d

# Update images
docker compose -f docker-compose.production.yml pull

# View resource usage
docker stats
```

## 🌐 Access URLs

| Service | Direct | Reverse Proxy |
|---------|--------|---------------|
| App | `http://your-ip:3000` | `http://your-ip/` |
| Grafana | `http://your-ip:3001` | `http://your-ip/grafana/` |
| Prometheus | `http://your-ip:9090` | `http://your-ip/prometheus/` |
| AlertManager | `http://your-ip:9093` | `http://your-ip/alertmanager/` |
| Loki | `http://your-ip:3100` | - |
| Tempo | `http://your-ip:3200` | - |

**Grafana Credentials**: admin/admin (change on first login)

## 🔍 Troubleshooting

```bash
# Check app health
curl http://localhost:3000/api/health

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/clinops_error.log

# Check Docker daemon
sudo systemctl status docker

# Check database connection
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops
npx prisma db execute --stdin < /dev/null

# System resources
free -h              # Memory
df -h                # Disk
top                  # CPU
docker stats         # Container resources

# View all logs
pm2 logs clinops
docker compose -f docker-compose.production.yml logs
sudo journalctl -xe
```

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `clin-ops/.env` | App config (DB, API keys) |
| `.env.observability` | Observability config |
| `clin-ops/ecosystem.config.js` | PM2 configuration |
| `/etc/nginx/sites-available/clinops` | Nginx config |
| `observability/prometheus.yml` | Prometheus config |
| `observability/alertmanager.yml` | Alert config |

## 🔄 Common Workflows

### Deploy Changes
```bash
cd ~/CMPE_272_Team_1_Project_ClinOps
./redeploy.sh
```

### View App Logs
```bash
pm2 logs clinops
```

### View Observability Logs
```bash
docker compose -f docker-compose.production.yml logs -f
```

### Restart Everything
```bash
pm2 restart clinops
docker compose -f docker-compose.production.yml restart
sudo systemctl restart nginx
```

### Update Environment
```bash
nano ~/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env
pm2 restart clinops
```

### Check System Health
```bash
./verify-deployment.sh
```

## 🛑 Emergency Commands

```bash
# Stop everything
pm2 stop clinops
docker compose -f docker-compose.production.yml down
sudo systemctl stop nginx

# Start everything
sudo systemctl start nginx
docker compose -f docker-compose.production.yml up -d
pm2 start clinops

# Reset PM2
pm2 delete all
pm2 start ecosystem.config.js

# Reset Docker
docker compose -f docker-compose.production.yml down -v
docker compose -f docker-compose.production.yml up -d
```

## 📊 Metrics & Monitoring

### Key Grafana Dashboards
- Node Exporter (System metrics)
- Container metrics
- Application logs (Loki)
- Distributed traces (Tempo)

### Prometheus Queries
```promql
# Request rate
rate(http_requests_total[5m])

# Memory usage
process_resident_memory_bytes

# Error rate
rate(http_requests_total{status=~"5.."}[5m])
```

## 🔐 Security

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Check firewall
sudo ufw status

# View failed logins
sudo journalctl -u ssh | grep Failed

# Change Grafana password
# Login to Grafana → Settings → Profile → Change Password

# Rotate JWT secret
nano ~/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env
# Update JWT_SECRET
pm2 restart clinops
```

## 📁 Important Directories

```bash
# Application
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops

# Logs
cd ~/CMPE_272_Team_1_Project_ClinOps/logs
cd /var/log/nginx

# Backups
cd ~/backups

# Docker volumes
docker volume ls
docker volume inspect <volume-name>
```

## 🎯 Performance Tuning

```bash
# Reduce PM2 instances (low memory)
nano ~/CMPE_272_Team_1_Project_ClinOps/clin-ops/ecosystem.config.js
# Change: instances: 1
pm2 restart clinops

# Increase PM2 instances (more CPU)
# Change: instances: 'max'
pm2 restart clinops

# Limit Docker memory
docker compose -f docker-compose.production.yml down
# Edit docker-compose.production.yml, add to services:
#   mem_limit: 512m
docker compose -f docker-compose.production.yml up -d
```

## 🆘 Get Help

1. Check logs: `pm2 logs clinops`
2. Check Docker: `docker compose -f docker-compose.production.yml logs`
3. Run health check: `./verify-deployment.sh`
4. Check documentation: `DEPLOYMENT_SUMMARY.md`

---

💡 **Tip**: Bookmark this page for quick reference!
