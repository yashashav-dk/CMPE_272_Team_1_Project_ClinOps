# TLS/SSL Error Troubleshooting Guide

## 🔒 Error: "tls: bad record MAC"

This error indicates a **TLS handshake problem** between your application and the Gemini API. This is typically a **temporary network issue**.

---

## 🛡️ **Auto-Retry is Enabled**

Good news! Your application now **automatically retries** TLS errors up to **3 times** with exponential backoff:

```typescript
Attempt 1 → Wait 1 second → Attempt 2 → Wait 2 seconds → Attempt 3
```

### **What You'll See in Console:**

```
Attempt 1/3 - Sending request to Gemini API
Attempt 1/3 - Error generating response from Gemini: [TLS error]
Service unavailable (503), retrying in 1000ms...
Attempt 2/3 - Sending request to Gemini API
```

---

## 🔍 **Common Causes & Solutions**

### **1. Temporary Network Glitch** ⚡
**Most Common** - Usually resolves automatically

**Solution**: Just wait and try again
- The retry logic will handle it
- Error usually fixes itself within seconds

---

### **2. Network Configuration Issues** 🌐

#### **A. Check Your Internet Connection**
```bash
# Test basic connectivity
ping google.com

# Test Gemini API endpoint
curl -I https://generativelanguage.googleapis.com
```

#### **B. Check DNS Resolution**
```bash
# Verify DNS is working
nslookup generativelanguage.googleapis.com
```

#### **C. Check Firewall/Proxy**
- Are you behind a corporate firewall?
- Using a VPN that might be interfering?
- Proxy settings blocking TLS?

**Solution**: 
- Temporarily disable VPN and try again
- Check firewall settings
- Try from a different network

---

### **3. Node.js TLS Configuration** 🔧

#### **Option A: Allow Legacy TLS** (Quick Fix)
```bash
# Set environment variable before starting
export NODE_TLS_REJECT_UNAUTHORIZED=0  # ⚠️ Only for development!
npm run dev
```

#### **Option B: Update Node.js**
```bash
# Check your Node version
node --version

# Should be 20.x or higher
# If older, update with:
nvm install 20
nvm use 20
```

---

### **4. Rate Limiting** 🚦

If you're making many requests quickly:

**Solution**: The retry logic handles this, but you can also:
- Reduce request frequency
- Check Gemini API quotas
- Wait a few minutes before retrying

---

### **5. API Key Issues** 🔑

#### **Verify API Key is Correct**
```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops
cat .env | grep GOOGLE_GENERATIVE_AI_API_KEY
```

#### **Test API Key Manually**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY"
```

---

## 🚀 **Quick Fixes to Try**

### **Method 1: Restart Everything**
```bash
# Stop dev server (Ctrl+C)
# Clear Node cache
rm -rf node_modules/.cache
# Restart
npm run dev
```

### **Method 2: Update Dependencies**
```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops
npm update @google/generative-ai
npm install
npm run dev
```

### **Method 3: Check System Time**
```bash
# TLS requires accurate system time
date

# If wrong, sync it:
sudo ntpdate -s time.apple.com  # macOS
# or
sudo timedatectl set-ntp true   # Linux
```

### **Method 4: Flush DNS Cache**
```bash
# macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches
```

---

## 📊 **Monitoring the Issue**

### **Check Application Logs**
```bash
# In your npm run dev terminal, watch for:
✅ "Attempt 1/3 - Sending request..."
✅ "retrying in Xms..."
❌ "All attempts failed"
```

### **Check Browser Console**
```bash
# Open DevTools (F12) → Console
# Look for:
❌ Network errors
❌ TLS/SSL errors
❌ API call failures
```

### **Check Network Tab**
```bash
# DevTools → Network → Filter: XHR
# Check status codes:
✅ 200 - Success
❌ 401 - Unauthorized (bad API key)
❌ 503 - Service unavailable
❌ Failed - Network error
```

---

## 🔥 **Emergency Workarounds**

### **Workaround 1: Use Different Model**

Edit `clin-ops/services/controller/AIController.ts`:

```typescript
// Line ~12
private model: string = 'gemini-pro';  // Try older stable model
```

### **Workaround 2: Increase Retry Attempts**

Edit `clin-ops/services/controller/AIController.ts`:

```typescript
// Line ~13
private maxRetries: number = 5;  // Increase from 3 to 5
```

### **Workaround 3: Increase Retry Delay**

Edit `clin-ops/services/controller/AIController.ts`:

```typescript
// Line ~14
private retryDelay: number = 2000;  // Increase from 1000ms to 2000ms
```

---

## 🎯 **Expected Behavior**

### **Normal Operation:**
```
Request → Success → Response displayed
```

### **With Temporary TLS Error:**
```
Request → TLS Error → Wait 1s → Retry → Success → Response displayed
```

### **With Persistent Error:**
```
Request → TLS Error → Wait 1s → Retry → TLS Error → Wait 2s → Retry → TLS Error → Give up → Show error message
```

---

## 🧪 **Test the Retry Logic**

### **Scenario 1: Single Request**
```bash
1. Ask AI a question
2. Watch console for "Attempt 1/3..."
3. If TLS error occurs, watch for retry
4. Should succeed within 3 attempts
```

### **Scenario 2: Multiple Requests**
```bash
1. Answer several questions quickly
2. Some may fail with TLS errors
3. Each should auto-retry
4. Most should eventually succeed
```

---

## 📈 **When to Worry**

### **Don't Worry If:**
✅ Error happens occasionally
✅ Retry succeeds on 2nd or 3rd attempt
✅ Only affects 1-2 requests out of 10

### **Do Worry If:**
❌ Every request fails
❌ All 3 retry attempts fail consistently
❌ Error persists for >5 minutes
❌ Happens on different networks

**In that case**: Check Gemini API status at https://status.cloud.google.com/

---

## 🔍 **Debugging Steps**

### **Step 1: Check API Status**
Visit: https://status.cloud.google.com/
Look for: "Vertex AI" or "Generative Language API"

### **Step 2: Verify API Key**
```bash
# In .env file
GOOGLE_GENERATIVE_AI_API_KEY=should_be_long_string_here

# Not this:
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here  # ❌ Placeholder!
```

### **Step 3: Test Network Path**
```bash
# Test direct connection
curl -v https://generativelanguage.googleapis.com 2>&1 | grep -i tls

# Should see TLS handshake succeed
```

### **Step 4: Check Node Version**
```bash
node --version
# Should be v20.x.x or higher
```

### **Step 5: Test with Simple Request**
Create `test-gemini.js`:
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function test() {
  try {
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    console.log('Success:', response.text());
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
```

Run it:
```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops
node test-gemini.js
```

---

## 💡 **Best Practices**

### **1. Always Handle Errors Gracefully**
```typescript
try {
  const response = await llmService.generateResponse(prompt);
  // Use response
} catch (error) {
  console.error('AI request failed:', error);
  // Show user-friendly message
  alert('AI service temporarily unavailable. Please try again.');
}
```

### **2. Implement User Feedback**
```typescript
// Show loading state
setLoading(true);
setRetryCount(0);

try {
  const response = await llmService.generateResponse(prompt);
  setLoading(false);
  // Handle success
} catch (error) {
  setLoading(false);
  setError('Failed after 3 attempts. Please check your connection.');
}
```

### **3. Log Errors for Debugging**
```typescript
console.error('Gemini API Error:', {
  message: error.message,
  code: error.code,
  status: error.status,
  timestamp: new Date().toISOString()
});
```

---

## 📞 **Still Having Issues?**

If TLS errors persist after trying all solutions:

1. **Check Gemini API Status**: https://status.cloud.google.com/
2. **Verify API Key**: Regenerate at https://makersuite.google.com/app/apikey
3. **Try Different Network**: Use mobile hotspot or different WiFi
4. **Update Node.js**: Use nvm to install latest LTS version
5. **Check Application Logs**: Look for patterns in the errors

---

## ✅ **Summary**

- **TLS errors are usually temporary** and resolve automatically
- **Auto-retry is enabled** (3 attempts with exponential backoff)
- **Most common cause**: Temporary network glitch
- **Quick fix**: Just wait and retry
- **Persistent issues**: Check network, API key, Node version

---

**Last Updated**: Nov 19, 2025
**Status**: Enhanced retry logic with TLS error handling
