# How to Fix "Old Data" Issue for Users

## The Problem
Older users are seeing cached/hardcoded data (like "2036" instead of "2026") because their browser and localStorage have old data.

## Solution for Users

### For Mobile Users (Most Common):
1. **Clear Browser Cache:**
   - **Chrome Mobile:** Settings → Privacy → Clear browsing data → Check "Cached images and files" → Clear data
   - **Safari iOS:** Settings → Safari → Clear History and Website Data
   - **Firefox Mobile:** Settings → Delete browsing data → Check "Cache" → Delete

2. **Hard Refresh the Website:**
   - Close the browser app completely
   - Reopen and visit: `https://construo-2026.pages.dev/?clearCache=true`
   - The `?clearCache=true` parameter will force clear localStorage

### For Desktop Users:
1. **Hard Refresh:**
   - **Windows:** Press `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac:** Press `Cmd + Shift + R`

2. **Or Clear Cache Manually:**
   - Chrome: Settings → Privacy and security → Clear browsing data
   - Firefox: Settings → Privacy & Security → Clear Data
   - Safari: Preferences → Privacy → Manage Website Data → Remove All

## What We Fixed (Technical):
1. ✅ Bumped cache version from `v2` to `v3` (forces new cache)
2. ✅ Added auto-clear for old cache versions
3. ✅ Updated service worker cache version
4. ✅ Added cache-control meta tags
5. ✅ Fixed hardcoded "2036" typo to "2026"
6. ✅ Bumped script versions to force reload

## Share This Link with Users:
```
https://construo-2026.pages.dev/?clearCache=true
```

This URL will automatically clear their localStorage cache when they visit.
