# Prisma Migration Guide - External Database Setup

## 🔴 Error: P3005 - Database Schema Not Empty

This error occurs when Prisma tries to run migrations on a database that already has tables/schema.

---

## 🎯 **Quick Solution**

### **For Development (Recommended)**

```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops

# Sync schema without migrations
npm run prisma:sync

# Or use the combined command:
npm run dev:sync
```

### **For Production/Render Database**

```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops

# Push schema changes
npx prisma db push

# Generate client
npx prisma generate

# Start app
npm run dev
```

---

## 📚 **Understanding the Options**

### **Option 1: `prisma db push` (For Development)**

✅ **Use when:**
- Working with external database (like Render)
- Database already has schema
- You don't need migration history
- Rapid prototyping

```bash
npm run prisma:sync
```

**What it does:**
- Compares schema.prisma with database
- Applies changes directly
- No migration files created
- Fast and simple

---

### **Option 2: `prisma migrate` (For Production)**

✅ **Use when:**
- Need migration history
- Deploying to production
- Team collaboration
- Need to rollback changes

```bash
npm run prisma:migrate
```

**What it does:**
- Creates migration files
- Tracks changes over time
- Allows version control
- Enables rollbacks

---

### **Option 3: Baseline Existing Database**

✅ **Use when:**
- Database already has schema
- Want to start using migrations
- Need to sync migration history

```bash
# List existing migrations
ls -1 prisma/migrations

# Mark a specific migration as applied
npx prisma migrate resolve --applied "20241101000000_init"

# Mark ALL migrations as applied
for dir in prisma/migrations/*/; do
  migration=$(basename "$dir")
  npx prisma migrate resolve --applied "$migration"
done
```

---

## 🔧 **Step-by-Step Fix**

### **Step 1: Check Current Database State**

```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops

# Open Prisma Studio to see current data
npm run prisma:studio
```

### **Step 2: Choose Your Approach**

#### **A. Keep Existing Data** (Recommended)

```bash
# Just sync the schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Run app
npm run dev
```

#### **B. Reset Everything** (If data not important)

⚠️ **WARNING: Deletes all data!**

```bash
# Reset database and apply migrations
npx prisma migrate reset --force

# Run app
npm run dev
```

#### **C. Baseline and Use Migrations**

```bash
# Check what migrations exist
ls prisma/migrations/

# Mark them as applied (assuming first migration is 20241101000000_init)
npx prisma migrate resolve --applied "20241101000000_init"

# Apply any new migrations
npx prisma migrate deploy

# Run app
npm run dev
```

---

## 🚀 **New Workflow with Updated Scripts**

### **Daily Development**

```bash
# Just run dev (no migration needed)
npm run dev

# If schema changed, sync first
npm run dev:sync
```

### **After Changing Schema**

```bash
# Update database schema
npm run prisma:sync

# Or manually:
npx prisma db push
```

### **View Database**

```bash
npm run prisma:studio
```

---

## 🔍 **Understanding Your Setup**

### **Your Configuration:**
- **Database**: External Render PostgreSQL
- **Schema File**: `prisma/schema.prisma`
- **Approach**: Use `db push` for development

### **Why This Error Happened:**

1. Your Render database already has tables
2. Prisma migration files exist in `prisma/migrations/`
3. Prisma thinks it needs to apply migrations
4. But database says "I already have these tables!"
5. Result: P3005 error

---

## 📝 **Best Practices**

### **For External Cloud Databases (Render, AWS RDS, etc.)**

1. **Use `db push` for development**
   ```bash
   npx prisma db push
   ```

2. **Use migrations for production deployments**
   ```bash
   npx prisma migrate deploy
   ```

3. **Always generate client after schema changes**
   ```bash
   npx prisma generate
   ```

### **When Working in a Team**

1. **Pull latest code**
   ```bash
   git pull
   ```

2. **Sync your local database**
   ```bash
   npx prisma db push
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Start developing**
   ```bash
   npm run dev
   ```

---

## 🛠️ **Common Commands**

| Command | What it does | When to use |
|---------|--------------|-------------|
| `npm run dev` | Start dev server | Every time |
| `npm run dev:sync` | Sync DB + start dev | After schema changes |
| `npm run prisma:sync` | Sync schema to DB | After changing schema.prisma |
| `npm run prisma:studio` | Open DB viewer | View/edit data |
| `npx prisma db push` | Push schema changes | Development |
| `npx prisma migrate deploy` | Apply migrations | Production |
| `npx prisma generate` | Generate Prisma Client | After schema changes |

---

## ⚠️ **Important Notes**

### **About `db push` vs `migrate`**

**`db push`:**
- ✅ Fast and simple
- ✅ No migration files
- ✅ Perfect for development
- ❌ No history tracking
- ❌ Can't rollback

**`migrate`:**
- ✅ Tracks history
- ✅ Can rollback
- ✅ Team-friendly
- ✅ Version controlled
- ❌ More complex
- ❌ Can conflict with existing schemas

### **Your Use Case:**

Since you're using an **external cloud database (Render)**:
- Use **`db push`** for development ✅
- Use **`migrate deploy`** for production deployments ✅
- Don't worry about migration files in development ✅

---

## 🔥 **Emergency Fixes**

### **"I just want it to work!"**

```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops

# Force sync (ignores errors)
npx prisma db push --accept-data-loss --force-reset

# Generate client
npx prisma generate

# Run
npm run dev
```

### **"I need to start fresh"**

⚠️ **Deletes ALL data!**

```bash
# Reset everything
npx prisma migrate reset --force

# Run app
npm run dev
```

### **"Just baseline it"**

```bash
# Mark all migrations as applied
for migration in prisma/migrations/*/; do
  name=$(basename "$migration")
  npx prisma migrate resolve --applied "$name"
done

# Run app
npm run dev
```

---

## 📊 **Troubleshooting**

### **Error: "Migration failed to apply"**

```bash
# Solution: Use db push instead
npx prisma db push
```

### **Error: "Prisma Client not generated"**

```bash
# Solution: Generate it manually
npx prisma generate
```

### **Error: "Can't reach database server"**

```bash
# Solution: Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
npx prisma db execute --stdin <<< "SELECT 1"
```

### **Error: "Environment variable not found"**

```bash
# Solution: Check .env file exists and has DATABASE_URL
ls -la .env
cat .env
```

---

## 🎓 **Learning Resources**

- **Prisma Docs**: https://www.prisma.io/docs
- **Migration Guide**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Schema Reference**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- **Baseline Guide**: https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/baselining

---

## 💡 **Pro Tips**

1. **Use `.env.example`** for team sharing (without actual credentials)
2. **Commit migration files** to git
3. **Use `db push`** in development
4. **Use `migrate deploy`** in production
5. **Always test migrations** in staging first
6. **Backup database** before running migrations
7. **Use Prisma Studio** to verify changes

---

## ✅ **Your Current Workflow**

Based on your setup, here's what you should do:

### **Every Day:**
```bash
cd ~/CMPE_272_Team_1_Project_ClinOps/clin-ops
npm run dev
```

### **After Changing Schema:**
```bash
npm run prisma:sync  # Sync to database
npm run dev          # Start app
```

### **After Pulling Code:**
```bash
npm install          # Install dependencies
npm run prisma:sync  # Sync schema
npm run dev          # Start app
```

### **To View Data:**
```bash
npm run prisma:studio
```

---

## 🎉 **Summary**

**Your Error**: Database already has schema, can't apply migrations

**Solution**: Use `npx prisma db push` instead of migrate

**Going Forward**: Use `npm run prisma:sync` when schema changes

**Daily Use**: Just `npm run dev`

---

**Last Updated**: Nov 19, 2025  
**Status**: Updated with new npm scripts
