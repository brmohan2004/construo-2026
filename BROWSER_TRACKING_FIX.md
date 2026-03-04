# Browser Tracking Prevention Fix

## 🔴 Issue: "Tracking Prevention blocked access to storage"

You're seeing errors like:
```
Tracking Prevention blocked access to storage for https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
```

This happens in browsers with strict privacy settings (Edge, Brave, Safari with Tracking Prevention enabled).

## ✅ Solutions

### Solution 1: Disable Tracking Prevention (Quick Fix)

#### For Microsoft Edge:
1. Click the 🛡️ shield icon in the address bar
2. Click "Tracking prevention for this site"  
3. Select "Off"
4. Refresh the page

OR

1. Go to `edge://settings/privacy`
2. Under "Tracking prevention", select **"Basic"** instead of "Strict"
3. Refresh the admin panel

#### For Brave Browser:
1. Click the 🦁 Brave icon in the address bar
2. Toggle "Shields" to **Down** for this site
3. Refresh the page

#### For Safari:
1. Safari → Preferences → Privacy
2. Uncheck "Prevent cross-site tracking"
3. Refresh the page

### Solution 2: Whitelist the Domain

#### Edge:
1. `edge://settings/privacy`
2. Scroll to "Tracking prevention"
3. Click "Exceptions"
4. Add: `https://construo-2026.pages.dev`
5. Add: `https://cdn.jsdelivr.net`

### Solution 3: Use a Different Browser
- Try Chrome (has less strict tracking prevention by default)
- Try Firefox with default settings

### Solution 4: Clear Site Data & Try Again
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click "Clear site data"
4. Refresh and login again

## 🔧 What We've Fixed in Code

The code has been updated to:
- ✅ Detect when localStorage is blocked
- ✅ Use in-memory storage fallback
- ✅ Add timeout protection for auth calls
- ✅ Show helpful error banners with instructions
- ✅ Gracefully handle CORS and tracking prevention errors

## ⚠️ Important: Still Need to Fix CORS

Even after fixing tracking prevention, you MUST configure CORS in Supabase:

1. Go to: https://supabase.com/dashboard/project/cknbkgeurnwdqexgqezz/settings/api
2. Add to CORS allowed origins:
   - `https://construo-2026.pages.dev`
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`
3. Save and wait 1 minute

## 🎯 Why This Happens

1. **Tracking Prevention**: Browser blocks third-party CDN (jsdelivr) from accessing localStorage
2. **CORS**: Supabase doesn't allow requests from your domain origin
3. **Session Locks**: Multiple auth calls happening simultaneously

## 📊 Test After Fixing

After applying the fix, you should see in console:
```
[Supabase] LocalStorage blocked by browser. Session persistence disabled.
```

This is normal and the app will still work (sessions will be memory-only).

## 💡 Recommended Setup

**For Production:**
- Add your domain to Supabase CORS settings (required)
- Users should use Chrome/Firefox for best experience
- Or disable tracking prevention for your site

**For Development:**
- Use Chrome or Firefox for development
- Or disable tracking prevention in Edge/Brave
- Add localhost to Supabase CORS settings
