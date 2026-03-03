# Supabase CORS Configuration

## ⚠️ Current Issue
The certificate builder save is failing because Supabase is blocking requests from your domain due to CORS policy.

## ⚠️ IMPORTANT: CORS Cannot Be Configured via SQL
**CORS settings are configured in the Supabase Dashboard, NOT through SQL queries.**
See `supabase-cors-config.sql` for related database configuration.

## ✅ Solution: Add Your Domains to Supabase CORS Settings

### Step 1: Go to Supabase Dashboard
Visit: https://supabase.com/dashboard/project/cknbkgeurnwdqexgqezz/settings/api

### Step 2: Find CORS Configuration
- Look for **"Additional Allowed Origins"** or **"CORS Configuration"** section
- This is usually in: **Settings** → **API** → **CORS Configuration**

### Step 3: Add These Domains
Add the following domains (comma-separated or one per line):

```
https://construo-2026.pages.dev
http://localhost:8000
http://127.0.0.1:8000
```

### Step 4: Save Changes
- Click **Save** or **Update**
- Wait 30-60 seconds for changes to propagate

### Step 5: Test
1. Refresh your browser
2. Try saving the certificate template again
3. It should work without errors!

## 📝 Notes
- The production domain `https://construo-2026.pages.dev` MUST be added for the live site to work
- Local development domains are needed for testing locally
- Changes may take up to 1 minute to take effect

## 🔧 Alternative: Check Authentication Settings
If CORS is already configured, check:
1. **Authentication** → **URL Configuration** in Supabase
2. Ensure your site URL is listed under **Site URL**
3. Add redirect URLs if needed

## ⚡ Quick Fix Applied
The code has been updated to:
- Handle auth failures gracefully
- Reduce lock timeout from 5s to 3s
- Provide clearer error messages
- Continue save operation even if user auth fails

But you still need to configure CORS in Supabase for proper functionality!

## 📄 Additional SQL Configuration
See `supabase-cors-config.sql` for:
- Auth redirect URL configuration
- Site config table permissions
- RLS policy checks
- Service role access verification

**Note:** These SQL commands help with related configuration, but CORS itself must be configured in the Dashboard!
