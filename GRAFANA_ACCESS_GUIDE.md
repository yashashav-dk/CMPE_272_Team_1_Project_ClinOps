# Grafana Access Guide

## 🔍 **Issue: Can't Access Grafana**

You should access Grafana at:
```
http://54.89.161.15/grafana/
```

**Note**: It's `/grafana/` (not `/graphan/`) - make sure the spelling is correct!

---

## ✅ **Quick Fix - Run on EC2**

### **Step 1: Pull Latest Code**
```bash
cd ~/CMPE_272_Team_1_Project_ClinOps
git pull origin main
```

### **Step 2: Run Fix Script**
```bash
# Update Nginx with improved Grafana config
sudo ./fix-nginx.sh
```

### **Step 3: Check Grafana Status**
```bash
# Run diagnostic script
./check-grafana.sh
```

---

## 🌐 **Access URLs**

After running the fix, Grafana will be available at:

| URL | Access Method | Port |
|-----|---------------|------|
| `http://54.89.161.15/grafana/` | Via Nginx (recommended) | 80 |
| `http://54.89.161.15:3001` | Direct to Grafana | 3001 |

### **Default Credentials:**
```
Username: admin
Password: admin
```

---

## 🔧 **What Was Fixed**

The Nginx proxy configuration for Grafana now includes:

1. ✅ **WebSocket Support** - For real-time updates
2. ✅ **Proper Headers** - X-Forwarded-Host for subpath routing
3. ✅ **Buffering Disabled** - For better performance
4. ✅ **HTTP/1.1** - Required for WebSocket upgrades

### **Updated Configuration:**

```nginx
location /grafana/ {
    proxy_pass http://localhost:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;  # NEW
    
    # WebSocket support  # NEW
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Buffering settings  # NEW
    proxy_buffering off;
}
```

---

## 🐛 **Troubleshooting**

### **Issue 1: Still Getting 404**

```bash
# Check if Grafana container is running
docker ps | grep grafana

# If not running, start it:
cd ~/CMPE_272_Team_1_Project_ClinOps
docker compose -f docker-compose.production.yml up -d grafana
```

### **Issue 2: Getting 502 Bad Gateway**

```bash
# Check Grafana logs
docker logs clinops-grafana

# Restart Grafana
docker compose -f docker-compose.production.yml restart grafana
```

### **Issue 3: Page Loads But Broken**

```bash
# Clear browser cache and reload
# Or try in incognito mode

# Check browser console (F12) for errors
```

### **Issue 4: Can't Login**

```bash
# Reset admin password
docker exec -it clinops-grafana grafana-cli admin reset-admin-password newpassword
```

---

## 📋 **Verification Steps**

Run these commands on your EC2 instance:

### **1. Check Grafana Container**
```bash
docker ps | grep grafana
# Should show: clinops-grafana ... Up ... 0.0.0.0:3001->3000/tcp
```

### **2. Test Direct Access**
```bash
curl -I http://localhost:3001/grafana/
# Should show: HTTP/1.1 200 OK or 302 Found
```

### **3. Test via Nginx**
```bash
curl -I http://54.89.161.15/grafana/
# Should show: HTTP/1.1 200 OK or 302 Found
```

### **4. Check Nginx Config**
```bash
sudo nginx -t
# Should show: test is successful
```

### **5. View Grafana Logs**
```bash
docker logs --tail 50 clinops-grafana
# Should not show errors
```

---

## 🚀 **Complete Diagnostic**

Run the automated diagnostic script:

```bash
cd ~/CMPE_272_Team_1_Project_ClinOps
./check-grafana.sh
```

This will check:
- ✅ Docker is running
- ✅ Grafana container status
- ✅ Grafana logs
- ✅ Port 3001 is listening
- ✅ Direct Grafana access
- ✅ Nginx configuration
- ✅ Nginx is running
- ✅ Nginx proxy to Grafana
- ✅ Firewall rules

---

## 📊 **Manual Fix (If Scripts Fail)**

### **1. Edit Nginx Config**
```bash
sudo nano /etc/nginx/sites-available/clinops
```

Find the Grafana location block and update it to:
```nginx
location /grafana/ {
    proxy_pass http://localhost:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    proxy_buffering off;
}
```

Save and exit (Ctrl+X, Y, Enter)

### **2. Test and Restart Nginx**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### **3. Restart Grafana**
```bash
cd ~/CMPE_272_Team_1_Project_ClinOps
docker compose -f docker-compose.production.yml restart grafana
```

---

## 🎯 **Expected Behavior**

After the fix:

1. Navigate to `http://54.89.161.15/grafana/`
2. You should see the Grafana login page
3. Login with `admin` / `admin`
4. Grafana will ask you to change the password
5. You'll see the Grafana dashboard

---

## 📝 **Common Mistakes**

| Mistake | Correct |
|---------|---------|
| `/graphan/` | `/grafana/` |
| `http://54.89.161.15/grafana` (no trailing slash) | `http://54.89.161.15/grafana/` |
| Using port `:3000` | Use `:3001` |
| Forgetting to start Docker | `docker compose up -d` |

---

## 💡 **Pro Tips**

### **Bookmark This URL:**
```
http://54.89.161.15/grafana/
```

### **Check if Services Are Running:**
```bash
# One command to check everything
docker compose -f ~/CMPE_272_Team_1_Project_ClinOps/docker-compose.production.yml ps
```

### **Restart All Observability Services:**
```bash
cd ~/CMPE_272_Team_1_Project_ClinOps
docker compose -f docker-compose.production.yml restart
```

### **View All Logs:**
```bash
docker compose -f ~/CMPE_272_Team_1_Project_ClinOps/docker-compose.production.yml logs -f
```

---

## 🔗 **Other Observability Tools**

Once Grafana is working, these should also work:

| Tool | URL |
|------|-----|
| **Prometheus** | http://54.89.161.15/prometheus/ |
| **AlertManager** | http://54.89.161.15/alertmanager/ |
| **Loki** | http://54.89.161.15:3100 (API only) |
| **Tempo** | http://54.89.161.15:3200 (API only) |

---

## 📞 **Still Not Working?**

If you've tried everything:

1. **Collect Debug Info:**
```bash
./check-grafana.sh > grafana-debug.txt 2>&1
docker compose -f ~/CMPE_272_Team_1_Project_ClinOps/docker-compose.production.yml logs grafana >> grafana-debug.txt
sudo cat /etc/nginx/sites-available/clinops >> grafana-debug.txt
cat grafana-debug.txt
```

2. **Check Grafana is configured for subpath:**
```bash
docker exec clinops-grafana env | grep GF_SERVER
# Should show:
# GF_SERVER_ROOT_URL=%(protocol)s://%(domain)s:%(http_port)s/grafana/
# GF_SERVER_SERVE_FROM_SUB_PATH=true
```

3. **Test from local machine:**
```bash
# From your laptop:
curl -v http://54.89.161.15/grafana/
```

---

**Last Updated**: Nov 19, 2025  
**Status**: Nginx configuration updated with WebSocket support
