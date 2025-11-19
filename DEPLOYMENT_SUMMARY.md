# ClinOps Deployment Summary

## 🚀 Quick Deployment Overview

Your ClinOps application is deployed using a **hybrid approach**:
- **Application (Next.js)**: Runs with PM2 for clustering and process management
- **Observability Stack**: Fully dockerized (Prometheus, Grafana, Loki, Tempo, AlertManager)
- **Database**: External cloud PostgreSQL (managed separately)

## 📋 What's Included

### Main Scripts

1. **`deploy.sh`** - Complete initial deployment
   - Installs Node.js, Docker, Nginx
   - Sets up PM2 for the Next.js app
   - Deploys dockerized observability stack
   - Configures Nginx reverse proxy
   - Sets up firewall and SSL

2. **`redeploy.sh`** - Quick updates
   - Pulls latest code
   - Updates Docker containers
   - Rebuilds and restarts application
   - Runs database migrations

3. **`verify-deployment.sh`** - Health checks
   - Verifies all services are running
   - Checks configurations
   - Reports system status

4. **`backup.sh`** - Database backup (if needed)
5. **`restore.sh`** - Database restore (if needed)

### Docker Configuration

- **`docker-compose.production.yml`** - Production observability stack
- **`clin-ops/Dockerfile.production`** - Optional app containerization

## 🎯 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / Users                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx (Port 80/443)                         │
│  Routes:                                                 │
│    /              → Next.js App (PM2)                   │
│    /grafana/      → Grafana Container                   │
│    /prometheus/   → Prometheus Container                │
│    /alertmanager/ → AlertManager Container              │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────┐          ┌──────────────────────┐
│   Next.js App    │          │  Docker Observability │
│   (PM2 Cluster)  │          │     Stack             │
│   Port 3000      │          │  - Prometheus :9090   │
│                  │          │  - Grafana    :3001   │
│  - API Routes    │          │  - Loki       :3100   │
│  - SSR/SSG       │          │  - Tempo      :3200   │
│  - WebSockets    │          │  - AlertMgr   :9093   │
└────────┬─────────┘          │  - Promtail          │
         │                    └──────────────────────┘
         │
         ▼
┌──────────────────┐
│  External Cloud  │
│    PostgreSQL    │
│  (RDS/Azure/GCP) │
└──────────────────┘
```

## 🔧 Initial Setup

### Step 1: Clone and Deploy

```bash
# On your EC2 instance
git clone https://github.com/your-repo/CMPE_272_Team_1_Project_ClinOps.git
cd CMPE_272_Team_1_Project_ClinOps
chmod +x *.sh
sudo ./deploy.sh
```

### Step 2: Configure Environment

Edit `.env` file:
```bash
nano ~/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env
```

Update:
```bash
DATABASE_URL=postgresql://user:pass@your-db-host:5432/clinops?schema=public
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

### Step 3: Restart Application

```bash
pm2 restart clinops
```

## 🌐 Access URLs

After deployment, access:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Main App** | `http://your-ip` | - |
| **Grafana** | `http://your-ip:3001` or `/grafana/` | admin/admin |
| **Prometheus** | `http://your-ip:9090` or `/prometheus/` | - |
| **AlertManager** | `http://your-ip:9093` or `/alertmanager/` | - |

## 📊 Observability Stack Details

### Prometheus (Metrics)
- Collects application and system metrics
- Scrapes targets every 15s
- 15-day retention period
- Access: `:9090` or `/prometheus/`

### Grafana (Visualization)
- Pre-configured dashboards
- Connected to Prometheus, Loki, Tempo
- Default login: admin/admin
- Access: `:3001` or `/grafana/`

### Loki (Logs)
- Aggregates logs from application and containers
- 7-day retention (168 hours)
- Query through Grafana
- Access: `:3100`

### Tempo (Traces)
- Distributed tracing
- OTLP endpoints on :4317 (gRPC) and :4318 (HTTP)
- Query through Grafana
- Access: `:3200`

### Promtail (Log Shipper)
- Ships Docker container logs to Loki
- Ships system logs to Loki
- Auto-discovers containers

### AlertManager (Alerts)
- Routes alerts from Prometheus
- Configurable notification channels
- Access: `:9093` or `/alertmanager/`

## 🔄 Common Operations

### Application Management

```bash
# View logs
pm2 logs clinops

# Restart application
pm2 restart clinops

# View status
pm2 status

# Monitor resources
pm2 monit
```

### Docker/Observability Management

```bash
# View all containers
docker compose -f docker-compose.production.yml ps

# View logs (specific service)
docker compose -f docker-compose.production.yml logs -f grafana

# Restart service
docker compose -f docker-compose.production.yml restart prometheus

# Stop all observability
docker compose -f docker-compose.production.yml down

# Start all observability
docker compose -f docker-compose.production.yml up -d

# Update and restart
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

### Quick Redeploy

```bash
cd ~/CMPE_272_Team_1_Project_ClinOps
./redeploy.sh
```

### System Management

```bash
# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/clinops_*.log

# Check system resources
docker stats
pm2 monit
htop
```

## 🔒 Security Configuration

### Firewall (UFW)

Open ports:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 3001 (Grafana)
- 9090 (Prometheus)
- 9093 (AlertManager)
- 3100 (Loki)
- 3200 (Tempo)

### Environment Variables

All sensitive data in `.env` files:
- `clin-ops/.env` - Application config
- `.env.observability` - Observability config

Both files are chmod 600 and not committed to git.

### SSL/HTTPS

Optional SSL setup with Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.com
```

Auto-renewal configured via systemd timer.

## 📈 Monitoring Your Application

### Key Metrics to Watch

1. **Application Metrics** (Prometheus)
   - Request rate and latency
   - Error rates
   - Memory/CPU usage

2. **Logs** (Loki via Grafana)
   - Application errors
   - Access patterns
   - System events

3. **Traces** (Tempo via Grafana)
   - Request flow
   - Performance bottlenecks
   - Service dependencies

### Setting Up Alerts

Edit `observability/alertmanager.yml` to configure:
- Email notifications
- Slack webhooks
- PagerDuty integration

## 🐛 Troubleshooting

### Application Not Starting

```bash
# Check logs
pm2 logs clinops --lines 100

# Check environment
cat ~/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env

# Verify database connection
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops
npx prisma db execute --stdin < /dev/null
```

### Docker Services Not Running

```bash
# Check Docker daemon
sudo systemctl status docker

# Check compose status
docker compose -f docker-compose.production.yml ps

# View service logs
docker compose -f docker-compose.production.yml logs --tail=50 [service]

# Restart services
docker compose -f docker-compose.production.yml restart
```

### High Resource Usage

```bash
# Check Docker resources
docker stats

# Check PM2 instances
pm2 monit

# Reduce PM2 instances (edit ecosystem.config.js)
# Change instances from 'max' to 1 or 2
pm2 restart clinops
```

### Grafana Not Accessible

```bash
# Check if container is running
docker ps | grep grafana

# Check Grafana logs
docker compose -f docker-compose.production.yml logs grafana

# Restart Grafana
docker compose -f docker-compose.production.yml restart grafana

# Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx
```

## 📦 File Structure

```
CMPE_272_Team_1_Project_ClinOps/
├── deploy.sh                      # Main deployment script
├── redeploy.sh                    # Quick redeploy script
├── verify-deployment.sh           # Health check script
├── backup.sh                      # Database backup
├── restore.sh                     # Database restore
├── docker-compose.production.yml  # Observability stack
├── clin-ops/
│   ├── .env                       # Application config (not in git)
│   ├── Dockerfile.production      # Optional app containerization
│   ├── ecosystem.config.js        # PM2 configuration
│   ├── package.json
│   ├── prisma/
│   ├── app/
│   └── ...
├── observability/
│   ├── prometheus.yml
│   ├── alertmanager.yml
│   ├── loki-config.yml
│   ├── tempo-config.yml
│   ├── promtail-config-clean.yml
│   └── grafana/
└── .env.observability             # Observability config (not in git)
```

## 🔄 Update Workflow

1. Make changes locally
2. Push to git
3. On server: `./redeploy.sh`
4. Monitor logs: `pm2 logs clinops`
5. Check Grafana dashboards for metrics

## 🎯 Best Practices

1. **Regular Backups** - Set up automated backups (see backup.sh)
2. **Monitor Logs** - Check Grafana daily for errors
3. **Keep Updated** - Run `./redeploy.sh` after pulling changes
4. **Security** - Change default Grafana password
5. **SSL** - Always use HTTPS in production
6. **Resources** - Monitor Docker and PM2 resource usage
7. **Alerts** - Configure AlertManager for critical issues

## 📚 Additional Resources

- **Full Documentation**: See `DEPLOYMENT.md`
- **Scripts Reference**: See `scripts-README.md`
- **Environment Setup**: See `clin-ops/env.template`

## 🆘 Support

For issues:
1. Check logs: `pm2 logs clinops`
2. Check Docker: `docker compose -f docker-compose.production.yml logs`
3. Run health check: `./verify-deployment.sh`
4. Review this documentation

---

**Deployment Date**: $(date)
**Version**: 1.0.0
