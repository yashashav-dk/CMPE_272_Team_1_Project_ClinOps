# Bug Fix Summary - Chat Data Persistence Issue

## 🐛 **Issue Reported**

User reported that:
1. Generated chat data from Gemini fills the interface
2. After page refresh, projects disappear from sidebar
3. Previous projects don't show saved chat data
4. This happens while logged in and running `npm run dev`

## 🔍 **Root Causes Identified**

### 1. **Auto-Save Functionality Was Completely Disabled** ⚠️
**File**: `clin-ops/services/aiChat.ts` (line 288-295)

**Problem**: The `autoSaveChatData` function had an early return statement that prevented any chat data from being saved to the database.

```typescript
// BEFORE (BROKEN):
export function autoSaveChatData(...) {
  // Auto-save functionality is disabled
  console.log('Auto-save is disabled...');
  return; // ❌ This prevented ALL saves!
  
  /* Original implementation commented out */
}
```

**Fix**: Re-enabled the auto-save functionality by removing the early return and restoring the original implementation.

```typescript
// AFTER (FIXED):
export function autoSaveChatData(...) {
  // Clear previous timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Set new timeout for debounced save
  saveTimeout = setTimeout(async () => {
    await saveChatData(...);
  }, delay);
}
```

---

### 2. **Project Names Were Being Overwritten** 🏷️
**File**: `clin-ops/app/api/ai/chat/save/route.ts` (line 79-83)

**Problem**: Every time chat data was saved, the project's name and description were being overwritten with generic values like "Project {id}" and "Auto-generated project for chat data".

This made projects appear to "disappear" or change unexpectedly.

```typescript
// BEFORE (BROKEN):
await tx.project.upsert({
  where: { id: projectId },
  update: { 
    name: `Project ${projectId}`, // ❌ Overwrites user's project name!
    description: 'Auto-generated...', // ❌ Overwrites description!
    userId 
  },
  create: { ... },
});
```

**Fix**: Modified to only update the timestamp, preserving the original project name and description.

```typescript
// AFTER (FIXED):
await tx.project.upsert({
  where: { id: projectId },
  update: { 
    updatedAt: new Date() // ✅ Only update timestamp
  },
  create: { 
    id: projectId, 
    userId, 
    name: `Project ${projectId.slice(-8)}`, 
    description: 'Created from chat session' 
  },
});
```

---

### 3. **Insufficient Network Error Handling** 🌐
**File**: `clin-ops/services/controller/AIController.ts` (line 27-36)

**Problem**: The retry logic for Gemini API calls wasn't catching SSL/TLS and network errors, causing failures without retries.

**Fix**: Expanded the `isRetryableError` function to handle more network error types:

```typescript
// AFTER (FIXED):
private isRetryableError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';
  
  return error?.status === 503 || 
         error?.status === 429 ||
         error?.status === 500 ||
         errorMessage.includes('econnreset') ||
         errorMessage.includes('ssl') ||
         errorMessage.includes('tls') ||
         errorMessage.includes('network') ||
         errorCode === 'err_ssl_wrong_version_number' ||
         // ... other network errors
}
```

---

### 4. **Environment Variable Inconsistency** 🔑
**File**: `clin-ops/services/controller/AIController.ts` (line 134)

**Problem**: Code was looking for `GEMINI_API_KEY` but documentation used `GOOGLE_GENERATIVE_AI_API_KEY`.

**Fix**: Updated to support both variable names for backward compatibility:

```typescript
// AFTER (FIXED):
const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
                     process.env.GEMINI_API_KEY || '';

if (!geminiApiKey) {
  console.warn('WARNING: No Gemini API key found. Set GOOGLE_GENERATIVE_AI_API_KEY in your .env file');
}
```

---

## ✅ **Changes Made**

### Files Modified:

1. **`clin-ops/services/aiChat.ts`**
   - Re-enabled auto-save functionality
   - Restored timeout-based debouncing for saves

2. **`clin-ops/app/api/ai/chat/save/route.ts`**
   - Fixed project upsert to preserve names and descriptions
   - Only updates timestamp on existing projects

3. **`clin-ops/services/controller/AIController.ts`**
   - Enhanced retry logic for network/SSL errors
   - Added support for both environment variable formats
   - Better error logging and retry messages

---

## 🧪 **Testing Steps**

To verify the fixes work:

1. **Test Auto-Save**:
   ```bash
   # Start the dev server
   npm run dev
   
   # Create a new project
   # Answer some questions and chat with AI
   # Check browser console for: "Auto-saved chat data for project: ..."
   ```

2. **Test Persistence After Refresh**:
   ```bash
   # Continue from above
   # Refresh the page (F5)
   # Verify: Project appears in sidebar
   # Verify: Chat history is preserved
   # Verify: Project name hasn't changed
   ```

3. **Test Project Names**:
   ```bash
   # Create a project with a specific name (e.g., "My Trial Project")
   # Generate some chat data
   # Refresh the page
   # Verify: Project name is still "My Trial Project"
   ```

4. **Test Network Errors** (if Gemini API is having issues):
   ```bash
   # Temporarily disconnect internet or block API
   # Try to chat
   # Check console for retry messages
   # Should see: "Attempt 1/3", "Attempt 2/3", etc.
   ```

---

## 🚀 **What You Need to Do**

### 1. **Verify Your Environment Variables**

Check your `.env` file has the API key:

```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops
cat .env | grep GOOGLE_GENERATIVE_AI_API_KEY
```

If not set, add it:

```bash
echo "GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here" >> .env
```

### 2. **Restart Your Development Server**

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 3. **Clear Browser Cache** (Optional but recommended)

- Open DevTools (F12)
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"

### 4. **Test the Fixes**

1. Create a new project with a meaningful name
2. Chat with the AI and generate some responses
3. Refresh the page
4. Verify:
   - ✅ Project appears in sidebar with correct name
   - ✅ Chat history is preserved
   - ✅ All answered questions are still there
   - ✅ Generated tab content is still there

---

## 📊 **Expected Behavior After Fix**

### ✅ **What Should Happen Now:**

1. **Auto-Save Works**: 
   - Chat data saves automatically every 2 seconds after changes
   - Console shows: `Auto-saved chat data for project: ...`

2. **Projects Persist**:
   - Projects remain in sidebar after refresh
   - Project names stay the same
   - All chat history is preserved

3. **Better Error Handling**:
   - Network errors trigger automatic retries (up to 3 attempts)
   - Exponential backoff between retries
   - Clear error messages in console

4. **Environment Variables**:
   - Supports both `GOOGLE_GENERATIVE_AI_API_KEY` and `GEMINI_API_KEY`
   - Warning message if no API key is found

---

## 🔧 **If Issues Persist**

### Check Database Connection:

```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops
npx prisma studio
```

This opens a GUI to view your database. Check if:
- Projects table has your projects
- ChatHistory table has your chat sessions
- Messages table has your chat messages

### Check Application Logs:

```bash
# In the terminal where npm run dev is running
# Look for:
# - "Auto-saved chat data for project: ..."
# - "Extracted projectId: ..."
# - Any error messages
```

### Check Browser Console:

```bash
# Open DevTools (F12) → Console tab
# Look for:
# - Any red error messages
# - Network errors
# - "Auto-save" related messages
```

---

## 📝 **Additional Notes**

- The auto-save has a 2-second debounce to avoid excessive database writes
- Projects are automatically created in the database when first chat is saved
- The system now retries failed API calls up to 3 times with exponential backoff
- SSL/TLS errors are now retryable (previously they would fail immediately)

---

## 🎉 **Summary**

The main issue was that **auto-save was completely disabled**, causing all chat data to be lost on refresh. Additionally, project names were being overwritten, making it seem like projects were "disappearing".

Both issues are now fixed, and your chat data should persist correctly across page refreshes!

---

**Last Updated**: Nov 19, 2025
**Status**: ✅ **RESOLVED**
