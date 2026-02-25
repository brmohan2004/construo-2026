# Troubleshooting: Database Timeout Errors

## Problem
When toggling localStorage or updating settings, you see:
```
Error: canceling statement due to statement timeout
Code: 57014
```

## Causes
1. Slow database queries
2. Missing indexes
3. Complex RLS (Row Level Security) policies
4. Large JSONB data
5. Slow activity logging

## Solutions

### Solution 1: Run the Fix SQL Script
Execute the `fix_site_config_timeout.sql` file in your Supabase SQL editor:

```sql
-- This will:
-- 1. Add necessary indexes
-- 2. Optimize RLS policies
-- 3. Analyze the table
```

### Solution 2: Increase Supabase Timeout (Temporary)
In Supabase Dashboard:
1. Go to Settings → Database
2. Look for "Statement Timeout" setting
3. Increase from default (usually 8s) to 30s or 60s

### Solution 3: Check Your Supabase Plan
- Free tier has limitations
- Upgrade to Pro for better performance
- Check if you're hitting rate limits

### Solution 4: Optimize the Update
The code has been updated to:
- Skip unnecessary SELECT queries
- Make activity logging non-blocking
- Invalidate cache instead of fetching

### Solution 5: Check Database Load
In Supabase Dashboard:
1. Go to Database → Performance
2. Check for slow queries
3. Look for missing indexes
4. Check connection pool usage

## Quick Test

### Test 1: Direct Database Update
Run this in Supabase SQL Editor:
```sql
UPDATE site_config 
SET settings = jsonb_set(
    settings, 
    '{enableLocalStorage}', 
    'true'
)
WHERE config_key = 'main';
```

If this is fast (< 1 second), the issue is in the application code.
If this is slow, the issue is in the database.

### Test 2: Check RLS Policies
```sql
-- Check if RLS is causing slowness
SELECT * FROM site_config WHERE config_key = 'main';
```

If this is slow, RLS policies need optimization.

### Test 3: Check Indexes
```sql
-- List all indexes on site_config
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'site_config';
```

Should show at least:
- Primary key index on `id`
- Unique index on `config_key`

## Prevention

### 1. Keep JSONB Columns Small
Don't store huge objects in settings. Break them into separate columns if needed.

### 2. Use Partial Updates
Instead of updating entire JSONB:
```javascript
// Bad (updates entire column)
UPDATE site_config SET settings = {...huge object...}

// Good (updates only one field)
UPDATE site_config SET settings = jsonb_set(settings, '{field}', 'value')
```

### 3. Monitor Performance
- Check Supabase dashboard regularly
- Set up alerts for slow queries
- Monitor database size

### 4. Optimize Activity Logging
The activity log is now non-blocking, but you can disable it temporarily:
```javascript
// In admin.js, comment out:
// await this.logActivity(...)
```

## Still Having Issues?

### Check Supabase Status
Visit: https://status.supabase.com/

### Check Your Network
- Slow internet connection?
- VPN causing delays?
- Firewall blocking requests?

### Contact Support
If none of the above works:
1. Export your database schema
2. Check Supabase community forum
3. Contact Supabase support with error details

## Workaround (Temporary)

If you need to update settings urgently:

### Option 1: Direct SQL Update
In Supabase SQL Editor:
```sql
UPDATE site_config 
SET settings = jsonb_set(
    settings, 
    '{enableLocalStorage}', 
    'false'::jsonb
)
WHERE config_key = 'main';
```

### Option 2: Use Supabase Dashboard
1. Go to Table Editor
2. Find `site_config` table
3. Edit the `settings` column directly
4. Update the JSON manually

## Code Changes Made

### admin.js
- Removed `.select()` from update query
- Made activity logging non-blocking
- Invalidate cache instead of fetching

### settings.html
- Added loading state to toggle
- Better error handling
- Disabled checkbox during update

## Performance Benchmarks

Expected times:
- ✅ Good: < 1 second
- ⚠️ Acceptable: 1-3 seconds
- ❌ Problem: > 3 seconds (timeout at 8s)

If updates take > 3 seconds, investigate database performance.
