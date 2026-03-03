# Certificate Builder Timeout Fix

## Problem
When clicking "Save Template" in the Certificate Builder, you see errors:

**Error 1 (HTTP 503):**
```
Failed to load resource: the server responded with a status of 503 (Service Unavailable)
Error: Could not query the database for the schema cache. Retrying.
```

**Error 2 (Timeout):**
```
Error: Operation timed out after 10000ms. This may be due to CORS issues.
```

## Root Cause
The issue has TWO possible causes:

### ⚠️ PRIMARY ISSUE: Database is Paused (HTTP 503)
Supabase free tier databases automatically pause after ~1 week of inactivity. This causes:
- HTTP 503 errors
- "Could not query the database for the schema cache" message
- All database queries failing

### Secondary Issue: Slow Queries (Timeout)
If the database is running but queries are slow, the timeout is caused by:

1. **Incorrect RLS Policies** - The Row Level Security policies are using `profiles.id` instead of `profiles.user_id` to check authentication
2. **Missing Indexes** - Database queries without proper indexes can be slow
3. **Authentication Issues** - User session may not be properly maintained

## Solution

### ⚠️ FIRST: Check if Database is Paused (MOST COMMON)

#### Method 1: Via Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **cknbkgeurnwdqezz**
3. Look for a banner saying "Database is paused"
4. Click **"Restore"** or **"Unpause Database"**
5. Wait **1-2 minutes** for database to fully start
6. Try saving the certificate template again

#### Method 2: Use Test Page
1. Open: `test-supabase-connection.html` in your browser
2. Click **"Test Connection"**
3. If you see "Database is paused or starting up", wait 2 minutes
4. Click "Test Connection" again until you see "✅ Connection Successful"

---

### Step 1: Run the SQL Fix (IF STILL SLOW AFTER UNPAUSING)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `fix_certificate_builder_timeout.sql`
4. Copy all contents and paste into the SQL Editor
5. Click **Run** to execute

This will:
- Fix RLS policies to use correct `user_id` column
- Add necessary indexes for faster queries
- Allow public read access to site_config (read-only)
- Update admin write policies to check authentication correctly

### Step 2: Verify Your Supabase Configuration

Check `admin/js/supabase-config.js`:

**Current configuration:**
```javascript
const SUPABASE_URL = 'https://cknbkgeurnwdqexgqezz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...' // Using service_role key
```

**⚠️ IMPORTANT:** The current key appears to be a `service_role` key (based on JWT payload). This is a **security risk** for production. However, for troubleshooting:

1. Verify the key is correct in your Supabase Dashboard:
   - Go to **Settings** → **API**
   - Use the **`anon`/`public`** key (recommended)
   - OR use **`service_role`** key (only for testing, bypasses RLS)

### Step 3: Add CORS Configuration (if using localhost)

If you're testing locally:

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Allowed redirect URLs**:
   ```
   http://localhost:8000
   http://127.0.0.1:8000
   http://localhost:8000/*
   ```

### Step 4: Test the Fix

1. **Clear browser cache**: Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
2. **Log out and log back in** to the admin panel
3. Go to the Certificate Builder page
4. Try to save a template

### Step 5: Verify Changes Applied

After running the SQL, you should see:
- Faster query responses (< 1 second)
- No timeout errors
- SuGetting HTTP 503 Errors?

This means your database is **paused** or **starting up**:

1. **Go to Supabase Dashboard** → Select your project
2. Check for "Database paused" banner and click **Restore**
3. **Wait 1-2 minutes** (database takes time to spin up)
4. Open `test-supabase-connection.html` and click "Test Connection"
5. Repeat until you see green "✅ Connection Successful"
6. Then try the certificate builder again

**Note:** Free tier databases pause after 7 days of inactivity. Consider:
- Upgrading to Pro ($25/month) - no auto-pause
- OR creating a simple cron job to ping your database daily

### Still Getting Timeout After Database is Runningficate template saved with X objects!"

## What Was Changed in the Code

### 1. `builder.js`
- Added retry logic when fetching site config
- Added fallback to fetch only `settings` column if full config fails
- Better error messages pointing to the SQL fix
- Import of `supabase` for direct queries

### 2. `admin.js`
- Added retry logic to `getSiteConfig()` (1 automatic retry)
- Reduced initial timeout from 10s to 5s for faster failure detection
- Better error categorization with helpful messages
- Added `helpText` property to errors for guidance

## Troubleshooting

### Still Getting Timeout?

1. **Check if SQL ran successfully:**
   ```sql
   -- Run in SQL Editor
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'site_config';
   ```
   You should see policies like "Public can view site config" and "Admins can update site config"

2. **Check if indexes exist:**
   ```sql
   -- Run in SQL Editor
   SELECT indexname FROM pg_indexes 
   WHERE tablename IN ('site_config', 'profiles');
   ```
   You should see `idx_site_config_config_key` and `idx_profiles_user_id_role`

3. **Check authentication:**
   - Open browser Console (F12)
   - Type: `await supabase.auth.getSession()`
   - Verify you have a valid session

4. **Check database performance:**
   - Go to Supabase Dashboard → **Database** → **Performance**
   - Look for slow queries on `site_config` table
   - Check if you're on Free tier with limited resources

### Still Not Working?

**Alternative Fix:** Use service_role key temporarily:
1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy the `service_role` key (⚠️ Never commit to version control!)
3. Replace `SUPABASE_ANON_KEY` in `admin/js/supabase-config.js`
4. This bypasses RLS but is **NOT SECURE** for production

## Security Notes

- ⚠️ Never use `service_role` key in production client-side code
- ☑️ Run the SQL fix to ensure proper RLS policies
- ☑️ Use `anon` key for client-side applications
- ☑️ Ensure authentication is working correctly before deployment

## Files Modified

1. ✅ `fix_certificate_builder_timeout.sql` - New SQL fix file
2. ✅ `admin/js/builder.js` - Added retry and fallback logic
3. ✅ `admin/js/admin.js` - Improved getSiteConfig with retry

## Next Steps

After applying this fix:
1. Test certificate builder save functionality
2. Test other admin panel features to ensure nothing broke
3. Consider upgrading Supabase plan if on Free tier with high usage
4. Review and update authentication flow if needed
