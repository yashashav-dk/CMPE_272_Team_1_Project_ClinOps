#!/bin/bash

# ========================================
# ClinOps Quick Start Guide
# ========================================
# This script displays setup instructions

cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║           ClinOps EC2 Deployment - Quick Start                ║
╚═══════════════════════════════════════════════════════════════╝

STEP 1: Connect to Your EC2 Instance
────────────────────────────────────────────────────────────────
  ssh -i your-key.pem ubuntu@your-ec2-ip

STEP 2: Clone the Repository (if not already done)
────────────────────────────────────────────────────────────────
  git clone https://github.com/your-username/CMPE_272_Team_1_Project_ClinOps.git
  cd CMPE_272_Team_1_Project_ClinOps

STEP 3: Make Scripts Executable
────────────────────────────────────────────────────────────────
  chmod +x deploy.sh redeploy.sh backup.sh restore.sh

STEP 4: Run Main Deployment
────────────────────────────────────────────────────────────────
  sudo ./deploy.sh

  This will take 10-15 minutes and will:
  ✓ Install Node.js, PostgreSQL, Nginx
  ✓ Set up database and user
  ✓ Configure environment variables
  ✓ Build and deploy the application
  ✓ Set up PM2 process manager
  ✓ Configure Nginx reverse proxy
  ✓ Set up firewall and monitoring

STEP 5: Configure API Keys
────────────────────────────────────────────────────────────────
  nano ~/CMPE_272_Team_1_Project_ClinOps/clin-ops/.env

  Add your API keys:
  - GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

  Save and restart:
  pm2 restart clinops

STEP 6: Access Your Application
────────────────────────────────────────────────────────────────
  http://your-ec2-ip

  Or if you set up a domain:
  https://your-domain.com

═══════════════════════════════════════════════════════════════

USEFUL COMMANDS:
────────────────────────────────────────────────────────────────
  View logs:           pm2 logs clinops
  Restart app:         pm2 restart clinops
  Check status:        pm2 status
  Redeploy:            ./redeploy.sh
  Backup database:     sudo ./backup.sh
  Restore database:    sudo ./restore.sh <backup-file>

BEFORE YOU START:
────────────────────────────────────────────────────────────────
  ✓ EC2 instance running (Ubuntu 22.04 LTS)
  ✓ Security group allows ports: 22, 80, 443
  ✓ At least 2GB RAM, 2 vCPUs
  ✓ 20GB storage
  ✓ SSH access configured

NEED HELP?
────────────────────────────────────────────────────────────────
  See DEPLOYMENT.md for detailed documentation

═══════════════════════════════════════════════════════════════

Ready to deploy? Run: sudo ./deploy.sh

EOF
