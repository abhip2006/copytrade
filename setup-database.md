# Database Setup Instructions

## ✅ API Keys Configured

All your API keys are now set up in `.env.local`:
- ✅ Clerk (Authentication)
- ✅ Supabase (Database)
- ✅ SnapTrade (Brokerage Integration)

---

## 🗄️ Next Step: Set Up Database Schema

You need to create all the database tables in Supabase. Here are **two options**:

---

### Option A: Using Supabase Dashboard (Easiest - Recommended)

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/esnewyeeaivqvhkpsqcz/sql/new
   - Or: Dashboard → SQL Editor → "New Query"

2. **Open the migration file**:
   - On your computer, navigate to:
     ```
     /Users/abhinavpenagalapati/Documents/copytrade-v2/supabase/migrations/20250101000000_initial_schema.sql
     ```
   - Open it with a text editor
   - Select all (Cmd+A) and copy (Cmd+C)

3. **Run the migration**:
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" button (bottom right)
   - Should see "Success. No rows returned" message
   - This will create all 15+ tables

4. **Verify tables were created**:
   - Go to: Table Editor (left sidebar)
   - You should see tables like:
     - users
     - leader_profiles
     - copy_relationships
     - leader_trades
     - positions
     - etc.

---

### Option B: Using Supabase CLI

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
cd /Users/abhinavpenagalapati/Documents/copytrade-v2
supabase link --project-ref esnewyeeaivqvhkpsqcz

# 4. Push migrations
supabase db push

# 5. Verify
supabase db remote status
```

---

## 🎯 After Database Setup

Once you've created the tables, you can:

### 1. Start the Development Server

```bash
cd /Users/abhinavpenagalapati/Documents/copytrade-v2
npm run dev
```

Server will start at: http://localhost:3000

### 2. Test the Platform

**Complete User Flow**:
```
1. Go to http://localhost:3000
2. Click "Get Started"
3. Sign up with email
4. Should redirect to /onboarding
5. Complete 6-step wizard:
   - Welcome (auto-advances)
   - SnapTrade registration (auto-advances)
   - Connect brokerage (OAuth popup)
   - Select account
   - Choose role (Leader or Follower)
   - Success!
6. Access your dashboard:
   - Leader → http://localhost:3000/leader
   - Follower → http://localhost:3000/dashboard
```

**Test Role-Based Access**:
```
- Try accessing wrong dashboard
- Should redirect automatically
- Leader cannot access /dashboard
- Follower cannot access /leader
```

**Test Background Jobs** (optional):
```bash
chmod +x scripts/test-cron-jobs.sh
CRON_SECRET=development ./scripts/test-cron-jobs.sh
```

---

## 🚨 If You Get Errors

### Error: "Cannot find module '@supabase/ssr'"
```bash
npm install @supabase/ssr
```

### Error: Database connection failed
- Check your Supabase keys in `.env.local`
- Make sure you ran the migration (created tables)

### Error: Clerk authentication failed
- Check your Clerk keys in `.env.local`
- Make sure Clerk publishable key starts with `pk_test_`

---

## ✅ Setup Checklist

- [x] API keys configured in `.env.local`
- [ ] Database schema created (run migration)
- [ ] Development server started (`npm run dev`)
- [ ] Tested sign up flow
- [ ] Tested onboarding
- [ ] Tested role-based access

---

## 🎉 You're Almost Ready!

After you complete the database setup (Option A or B above), you'll be able to:

✅ Sign up and sign in users
✅ Complete onboarding flow
✅ Connect SnapTrade accounts
✅ Access role-based dashboards
✅ Place trades (leaders)
✅ Configure copy settings (followers)
✅ Test automated trade copying

---

## 📞 Need Help?

If you run into any issues:

1. **Check the migration ran successfully**:
   - Go to Supabase Dashboard → Table Editor
   - Should see 15+ tables

2. **Check environment variables**:
   ```bash
   cat .env.local
   ```
   All keys should be filled in (no `...` or `NEED_` placeholders)

3. **Check server logs**:
   ```bash
   npm run dev
   ```
   Look for any error messages in terminal

---

**Next Step**: Run the database migration using Option A (easiest) or Option B above! 🚀
