# CONSTRUO 2026 - Quick Start Guide

Get CONSTRUO 2026 running in 5 minutes!

## Prerequisites
- Supabase account (sign up at https://supabase.com)
- Modern web browser
- Any static file server

## Step-by-Step Setup

### 1. Setup Supabase Database (5 minutes)

#### A. Create Supabase Project
1. Go to https://supabase.com and log in
2. Click "New Project"
3. Name it `construo-2026`
4. Choose a strong database password
5. Wait for project to be created (~2 minutes)

#### B. Run Database Migration
1. In Supabase Dashboard, go to **SQL Editor**
2. Click "+ New Query"
3. Copy entire contents of `supabase-migration.sql` from this project
4. Paste into SQL editor
5. Click **Run** or press Cmd/Ctrl + Enter
6. Wait for success message (should create 10 tables)

#### C. Create Storage Buckets
1. In Supabase Dashboard, go to **Storage**
2. Create these buckets (click "New bucket"):
   - `event-logos` (public)
   - `speaker-photos` (public)
   - `sponsor-logos` (public)
   - `organizer-images` (public)
   - `venue-images` (public)
   - `media` (public)

3. For each bucket, set policy to allow public read:
   - Select bucket → Policies → New Policy
   - Policy name: "Public Read Access"
   - Allowed operations: SELECT
   - Policy definition: `true`

#### D. Create Admin User
1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Email: `admin@construo.com`
4. Password: Your chosen admin password
5. Auto Confirm User: Yes
6. Click "Create user"
7. **Copy the User ID** (you'll need it next)

8. Go back to **SQL Editor**
9. Run this query (replace YOUR_USER_ID):
```sql
INSERT INTO profiles (user_id, username, email, name, role, status)
VALUES (
    'YOUR_USER_ID',  -- Paste the User ID you copied
    'admin',
    'admin@construo.com',
    'Super Admin',
    'superadmin',
    'active'
);
```

### 2. Configure Supabase in Project (2 minutes)

#### A. Get Your Credentials
1. In Supabase Dashboard, go to **Settings** → **API**
2. Find and copy:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJh...` (long JWT token)

#### B. Update Config Files
Open these files and update with your credentials:

**File: `js/supabase-config.js`**
```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

**File: `admin/js/supabase-config.js`**
```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

### 3. Run Locally (1 minute)

#### Option A: Using Python
```bash
cd construo-2026
python3 -m http.server 8000
```

#### Option B: Using Node.js
```bash
cd construo-2026
npm install
npm run dev
```

#### Option C: Using PHP
```bash
cd construo-2026
php -S localhost:8000
```

### 4. Access the Site

Open your browser:
- **Public Site**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
  - Username: `admin`
  - Password: Your admin password from Step 1D

## 🎉 Success!

You should now see:
- ✅ Public website with default data
- ✅ Admin panel login working
- ✅ Admin dashboard accessible

## Next Steps

### Customize Your Site
1. Login to admin panel: http://localhost:8000/admin
2. Edit sections:
   - **Hero**: Main banner with title and CTA
   - **About**: Event description and stats
   - **Events**: Add technical events
   - **Speakers**: Add keynote speakers
   - **Sponsors**: Add sponsor logos
   - **Timeline**: Event schedule
   - **Venue**: Location information
   - **Footer**: Contact and social links

### Deploy to Production
Choose a hosting platform:

**Netlify (Easiest):**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Or drag-and-drop** to:
- Netlify: https://app.netlify.com/drop
- Vercel: https://vercel.com/new

See `DEPLOYMENT.md` for detailed deployment guides.

## Common Issues

### "Cannot read properties of null"
**Solution**: Make sure you updated both config files with your Supabase credentials.

### "Invalid login credentials"
**Solution**: 
1. Verify user exists in Supabase Auth
2. Check profile was inserted in profiles table
3. Try password reset in Supabase dashboard

### "No data showing"
**Solution**:
1. Check browser console for errors
2. Verify SQL migration ran successfully
3. Check RLS policies are set up

### "Images not uploading"
**Solution**:
1. Verify storage buckets exist
2. Check bucket policies allow uploads
3. Make sure user is authenticated

## Need Help?

1. **Read Documentation**:
   - `README.md` - Main project docs
   - `SUPABASE_MIGRATION.md` - Technical details
   - `DEPLOYMENT.md` - Deployment guides

2. **Check Supabase Docs**: https://supabase.com/docs

3. **Common Commands**:
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Deploy to Netlify
netlify deploy --prod

# Deploy to Vercel
vercel --prod
```

## Quick Reference

### Admin Panel Access
- **URL**: `/admin`
- **Default User**: `admin`
- **Role**: Superadmin (full access)

### Admin Roles
- **Superadmin**: Full access, can delete
- **Admin**: Create, read, update content
- **Moderator**: Edit content, limited delete
- **Viewer**: Read-only access

### Database Tables
- `profiles` - Admin users
- `site_config` - Site configuration
- `events` - Technical events
- `speakers` - Guest speakers
- `sponsors` - Event sponsors
- `timeline_days` - Event schedule
- `organizers` - Committee members
- `registrations` - Participant registrations
- `registration_forms` - Custom forms
- `activity_logs` - Admin actions

### API Documentation
No API! Everything runs in the browser using Supabase client.

### File Structure
```
construo-2026/
├── index.html           # Public site
├── admin/               # Admin panel
│   ├── index.html      # Login
│   ├── dashboard.html  # Dashboard
│   ├── pages/          # Admin pages
│   └── js/             # Admin logic
├── js/                  # Public JS
├── css/                 # Styles
└── images/              # Static assets
```

---

**Time to first deploy**: ~10 minutes
**Stack**: Vanilla JS + Supabase
**Cost**: Free (Supabase free tier)

Happy building! 🚀

run on android studio
cd C:\Users\mohan\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 shell am start -a android.intent.action.VIEW -d http://10.0.2.2:8000/index.html