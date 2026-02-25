# LocalStorage Control Feature

## Overview
This feature allows admins to enable or disable localStorage caching for all website users through the admin panel.

## How It Works

### For Users (Public Site)
1. **First Visit**: Data is fetched from Supabase and stored in browser's localStorage
2. **Return Visits**: Data loads instantly from localStorage, then updates in background if changed
3. **When Disabled**: All cached data is cleared and fresh data is fetched on every visit

### For Admins
Located in: **Admin Panel > Settings > User Cache Tab**

#### Toggle Options:
- **Enable Local Storage** (ON/OFF switch)
  - ON: Users get instant loading with smart caching
  - OFF: Users always fetch fresh data (no caching)

- **Force Cache Clearance** (Button)
  - Clears all user caches immediately
  - Users will download fresh data on next visit

## Use Cases

### When to Enable (Default)
- Normal operation
- Fast loading experience for users
- Reduces server load
- Better mobile experience

### When to Disable
- Critical updates that must be seen immediately
- Testing new content
- Troubleshooting cache-related issues
- During major content changes

## Technical Details

### Storage Location
Setting is stored in `site_config` table:
```json
{
  "settings": {
    "enableLocalStorage": true,
    "cacheBuster": 1234567890
  }
}
```

### Files Modified
1. `admin/pages/settings.html` - Admin UI toggle
2. `js/main-supabase.js` - Client-side cache logic
3. `enable_disable_localstorage.sql` - Documentation

### How It Works Internally
1. Admin toggles the setting in admin panel
2. Setting is saved to Supabase `site_config` table
3. When disabled, `cacheBuster` timestamp is updated
4. On user's next visit:
   - Browser checks `enableLocalStorage` setting
   - If disabled: clears localStorage and fetches fresh
   - If enabled: uses smart caching as normal

### Cache Keys Used
- `construo_v2_siteConfig`
- `construo_v2_events`
- `construo_v2_timeline`
- `construo_v2_speakers`
- `construo_v2_sponsors`
- `construo_v2_organizers`
- `construo_v2_lastFetch`
- `construo_v2_dataHash`

## Benefits
- ✅ Instant control over all user caches
- ✅ No code deployment needed
- ✅ Works for all current and future users
- ✅ Graceful fallback if localStorage unavailable
- ✅ Reduces server load when enabled
- ✅ Ensures fresh data when disabled

## Testing
1. Enable localStorage in admin panel
2. Visit public site - data should cache
3. Refresh page - should load instantly from cache
4. Disable localStorage in admin panel
5. Refresh public site - cache should clear
6. Check browser console for cache logs

## Browser Support
Works on all modern browsers that support localStorage:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers
