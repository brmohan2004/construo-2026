# CONSTRUO 2026 - Supabase Migration Guide

## Overview
The CONSTRUO 2026 project has been migrated from Node.js/Express + MongoDB to Supabase (PostgreSQL + Auth + Storage). This eliminates the need for a backend server and simplifies deployment to static hosting.

## Supabase Project Details
- **Project URL**: https://owwupayisiyjneaodfrj.supabase.co
- **Project Reference**: owwupayisiyjneaodfrj

## Migration Steps Completed

### 1. Database Schema Migration
- Created SQL migration file: `supabase-migration.sql`
- Migrated all Mongoose models to PostgreSQL tables:
  - `profiles` (User authentication and roles)
  - `site_config` (Hero, About, Venue, Footer sections)
  - `events` (Technical events and competitions)
  - `organizers` (Committee members)
  - `speakers` (Guest speakers)
  - `sponsors` (Sponsorship tiers)
  - `timeline_days` (Event schedule)
  - `registration_forms` (Custom registration forms)
  - `registrations` (Participant registrations)
  - `activity_logs` (Admin activity tracking)

### 2. Row Level Security (RLS)
- Enabled RLS on all tables
- Created policies for role-based access:
  - Public read access for public data (events, speakers, sponsors, etc.)
  - Admin/Moderator write access for content management
  - Protected registration and user data

### 3. Database Triggers
- **Registration Number Generator**: Automatically generates unique registration numbers in format `CONS2026xxxx`
- **Updated At Timestamps**: Auto-updates `updated_at` fields on all tables

### 4. Frontend Migration

#### Public Website (`/index.html`)
- Added Supabase client library
- Created `js/supabase-config.js` for Supabase initialization
- Created `js/main-supabase.js` for data loading functions
- Updated `js/main.js` to load data from Supabase instead of API

#### Admin Panel
- Updated `admin/js/auth.js` to use Supabase Authentication
- Rewrote `admin/js/admin.js` with Supabase client methods
- Updated all HTML files to load scripts as ES6 modules
- Implemented CRUD operations for all resources using Supabase client

### 5. Authentication
- Uses Supabase Auth instead of JWT tokens
- Admin users must be created in Supabase Authentication
- Profile table links to Supabase auth users via `user_id`

### 6. File Storage
Supabase Storage buckets needed (create in dashboard):
- `event-logos` - Event logos and images
- `speaker-photos` - Speaker profile photos
- `sponsor-logos` - Sponsor brand logos
- `organizer-images` - Organizer profile photos
- `venue-images` - Venue location images
- `media` - General media uploads

## Setup Instructions

### 1. Run the SQL Migration
1. Log in to your Supabase Dashboard: https://app.supabase.com
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-migration.sql`
4. Run the migration
5. Verify all tables and policies are created

### 2. Create Storage Buckets
1. Go to Storage in Supabase Dashboard
2. Create the following public buckets:
   - event-logos
   - speaker-photos
   - sponsor-logos
   - organizer-images
   - venue-images
   - media
3. Set appropriate policies for each bucket (public read, authenticated write)

### 3. Create Admin Users
1. Go to Authentication in Supabase Dashboard
2. Create admin users manually or via SQL:
```sql
-- First, create auth user in Supabase Auth UI
-- Then insert profile:
INSERT INTO profiles (user_id, username, email, name, role, status)
VALUES (
    '[USER_ID_FROM_AUTH]',
    'admin',
    'admin@construo.com',
    'Super Admin',
    'superadmin',
    'active'
);
```

### 4. Update Supabase Credentials
The anon key in the config files needs to be replaced with your actual Supabase anon key:

1. Get your anon key from Supabase Dashboard > Settings > API
2. Update `js/supabase-config.js`
3. Update `admin/js/supabase-config.js`

Replace the placeholder:
```javascript
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your real anon key
```

### 5. Deploy
The project is now a **fully static site** and can be deployed to:
- **Netlify**: Drag and drop project folder or connect Git repo
- **Vercel**: `vercel deploy`
- **GitHub Pages**: Push to `gh-pages` branch
- **Cloudflare Pages**: Connect Git repo
- **Any static host**: Upload files via FTP/SFTP

## Development

### Local Development
Simply serve the project with any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then visit:
- Public site: http://localhost:8000
- Admin panel: http://localhost:8000/admin

### Environment Variables
No environment variables needed! Everything is configured via Supabase dashboard.

## Architecture Changes

### Before (Node.js/Express)
```
Frontend → Express API → MongoDB
  ↓
JWT Auth
```

### After (Supabase)
```
Frontend → Supabase Client → PostgreSQL
  ↓
Supabase Auth (Built-in)
Supabase Storage (Built-in)
```

## Benefits
✅ **No server required** - Fully static, deploy anywhere
✅ **Automatic scaling** - Supabase handles all backend scaling
✅ **Better security** - Row Level Security at database level
✅ **Real-time capabilities** - Supabase supports real-time subscriptions
✅ **Lower costs** - Free tier includes auth, database, and storage
✅ **Faster deployments** - No Docker, no server provisioning
✅ **Built-in auth** - No need to manage JWT tokens manually

## Removed Files
The following backend files have been removed as they're no longer needed:
- `api/` directory (entire Express backend)
- `Dockerfile`
- `railway.json`
- Backend dependencies from `package.json`

## Important Notes

1. **Initial Data**: The SQL migration includes default site configuration. You can customize it via the admin panel.

2. **User Registration**: Admin users must be created through Supabase Dashboard. Public registrations (for events) can be created through the website form.

3. **File Uploads**: Use the Supabase Storage client methods in `admin.js` for uploading files.

4. **Activity Logs**: Automatically logged to `activity_logs` table when using admin functions.

5. **Registration Numbers**: Auto-generated as `CONS2026xxxx` where xxxx is a sequential 4-digit number.

## Troubleshooting

### Cannot login to admin panel
- Verify user exists in Supabase Auth
- Verify profile record exists in `profiles` table
- Check browser console for errors
- Ensure correct anon key in config files

### Data not loading
- Check browser console for CORS errors
- Verify RLS policies allow public read access
- Ensure Supabase credentials are correct

### Cannot upload files
- Verify storage buckets are created
- Check storage policies allow authenticated uploads
- Ensure correct bucket names in code

## Support
For issues or questions:
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

---
**Migration Date**: February 2026
**Supabase Version**: Latest
**Project**: CONSTRUO 2026 Civil Engineering Symposium
