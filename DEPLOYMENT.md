# ClinOps EC2 Deployment Guide

This guide provides complete instructions for deploying the ClinOps application on an AWS EC2 instance.

## Prerequisites

- AWS EC2 instance (Ubuntu 22.04 LTS recommended)
- At least 2GB RAM, 2 vCPUs
- 20GB storage
- Security group allowing ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- SSH key pair for access

## Quick Start

### 1. Connect to EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Clone the Repository

```bash
cd ~
git clone https://github.com/your-username/CMPE_272_Team_1_Project_ClinOps.git
```

### 3. Run Deployment Script

```bash
cd CMPE_272_Team_1_Project_ClinOps
chmod +x deploy.sh
sudo ./deploy.sh
```

The script will:
- Install Node.js, PostgreSQL, Nginx, and other dependencies
- Set up the database
- Configure environment variables
- Build the Next.js application
- Set up PM2 process manager
- Configure Nginx as reverse proxy
- Set up firewall rules
- Configure basic monitoring

### 4. Configure API Keys

After deployment, edit the `.env` file:

```bash
nano /home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env
```

Add your API keys:
- `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google AI API key

Then restart the application:

```bash
pm2 restart clinops
```

### 5. Access Your Application

- Visit `http://your-ec2-ip` in your browser
- Or `https://your-domain.com` if you configured SSL

## Additional Scripts

### Redeployment (After Code Changes)

```bash
cd /home/ubuntu/CMPE_272_Team_1_Project_ClinOps
chmod +x redeploy.sh
./redeploy.sh
```

### Database Backup

```bash
cd /home/ubuntu/CMPE_272_Team_1_Project_ClinOps
chmod +x backup.sh
sudo ./backup.sh
```

Backups are stored in `/home/ubuntu/backups`

### Database Restore

```bash
cd /home/ubuntu/CMPE_272_Team_1_Project_ClinOps
chmod +x restore.sh
sudo ./restore.sh /home/ubuntu/backups/clinops_backup_YYYYMMDD_HHMMSS.sql.gz
```

## Useful Commands

### Application Management

```bash
# View application status
pm2 status

# View logs
pm2 logs clinops

# Restart application
pm2 restart clinops

# Stop application
pm2 stop clinops

# View application metrics
pm2 monit
```

### Database Management

```bash
# Connect to database
sudo -u postgres psql -d clinops

# Run Prisma Studio (database GUI)
cd /home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops
npx prisma studio
# Access at http://your-ec2-ip:5555 (make sure port 5555 is open)
```

### Nginx Management

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/clinops_access.log
sudo tail -f /var/log/nginx/clinops_error.log
```

### System Monitoring

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check system logs
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

## SSL/HTTPS Setup

If you have a domain name:

1. Point your domain's A record to your EC2 IP address
2. Wait for DNS propagation (usually 5-15 minutes)
3. Run the SSL setup:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Auto-renewal is configured automatically.

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (production/development) | Yes |
| `PORT` | Application port (default: 3000) | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key | Yes |
| `NEXT_PUBLIC_API_URL` | Public API URL | Yes |
| `OTEL_SERVICE_NAME` | OpenTelemetry service name | No |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Traces endpoint | No |

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs clinops

# Check if database is running
sudo systemctl status postgresql

# Verify environment variables
cat /home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d clinops -c "SELECT version();"

# Check database credentials
cat /root/.clinops_db_password
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check if port 3000 is listening
sudo netstat -tulpn | grep 3000
```

### High Memory Usage

```bash
# Restart application
pm2 restart clinops

# Check memory usage
pm2 monit

# Adjust PM2 memory limits in ecosystem.config.js
```

## Security Best Practices

1. **Change Default Passwords**: Update database password if needed
2. **Keep API Keys Secret**: Never commit `.env` file to git
3. **Regular Updates**: Keep system and packages updated
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
4. **Monitor Logs**: Regularly check application and system logs
5. **Backup Regularly**: Set up automated backups (see backup script)
6. **Use SSL**: Always use HTTPS in production
7. **Firewall**: Only open necessary ports in security groups

## Automated Backups

Add to crontab for daily backups at 2 AM:

```bash
sudo crontab -e
```

Add this line:
```
0 2 * * * /home/ubuntu/CMPE_272_Team_1_Project_ClinOps/backup.sh >> /var/log/clinops-backup.log 2>&1
```

## Monitoring Setup (Optional)

For production, consider setting up:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Log aggregation**: CloudWatch, Datadog
- **Performance monitoring**: New Relic, AppDynamics

## Support

For issues or questions:
1. Check application logs: `pm2 logs clinops`
2. Check system logs: `sudo journalctl -xe`
3. Review this documentation
4. Contact the development team

## Architecture

```
┌─────────────────────────────────────────────┐
│           Internet/Users                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Nginx (Reverse Proxy) - Port 80/443       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   Next.js App (PM2) - Port 3000             │
│   - API Routes                               │
│   - Server-side Rendering                    │
│   - Static Assets                            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│   PostgreSQL Database - Port 5432            │
│   - Application Data                         │
│   - User Data                                │
│   - Session Data                             │
└─────────────────────────────────────────────┘
```

## File Locations

- **Application**: `/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops`
- **Environment**: `/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env`
- **PM2 Config**: `/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops/ecosystem.config.js`
- **Nginx Config**: `/etc/nginx/sites-available/clinops`
- **Logs**: `/home/ubuntu/CMPE_272_Team_1_Project_ClinOps/logs`
- **Backups**: `/home/ubuntu/backups`
- **DB Password**: `/root/.clinops_db_password`

## Performance Tuning

### For High Traffic

1. **Increase PM2 instances**:
   Edit `ecosystem.config.js` and change `instances: 'max'` to a specific number

2. **Enable Nginx caching**:
   Add caching directives to Nginx config

3. **Database connection pooling**:
   Configure Prisma connection pool in environment

4. **CDN for static assets**:
   Use CloudFront or similar for `/_next/static`

### For Limited Resources

1. **Reduce PM2 instances**:
   Change to `instances: 1` in ecosystem.config.js

2. **Limit memory**:
   Adjust `max_memory_restart` in PM2 config

3. **Optimize build**:
   Review Next.js build for unused dependencies

## Updates and Maintenance

### Update Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
pm2 restart clinops
```

### Update Dependencies

```bash
cd /home/ubuntu/CMPE_272_Team_1_Project_ClinOps/clin-ops
npm update
npm audit fix
npm run build
pm2 restart clinops
```

### Update System

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot  # If kernel updates are installed
```

---

**Last Updated**: November 2024
**Version**: 1.0.0
