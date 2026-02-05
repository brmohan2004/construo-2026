# CONSTRUO 2026 - Civil Engineering Symposium

A modern, feature-rich event management website with a powerful admin panel for CONSTRUO 2026, the premier Civil Engineering Symposium.

## 🚀 Technology Stack (v2.0 - Supabase)

**This project has been migrated to Supabase and is now a fully static site!**

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Three.js** - 3D particle effects and immersive visuals
- **GSAP & ScrollTrigger** - Smooth scrollytelling animations
- **Responsive Design** - Mobile-first, works on all devices

### Backend (Supabase)
- **Supabase PostgreSQL** - Database with Row Level Security
- **Supabase Auth** - Built-in authentication system
- **Supabase Storage** - File uploads and media management
- **Real-time capabilities** - Live data synchronization

### Previous Stack (v1.0)
- ~~Node.js/Express~~ → Replaced with Supabase
- ~~MongoDB/Mongoose~~ → Replaced with PostgreSQL
- ~~JWT Auth~~ → Replaced with Supabase Auth
- ~~Cloudinary~~ → Replaced with Supabase Storage

## ✨ Features

### Public Website
- 🏗️ **Immersive 3D Experience** - Three.js particle cityscape
- 📜 **Scrollytelling** - Smooth section transitions with GSAP
- 🎨 **Construction Theme** - Blueprint-inspired design system
- 📱 **Fully Responsive** - Optimized for all screen sizes
- ⚡ **Fast Loading** - Static site, no server needed
- 🎯 **Event Registration** - Submit registrations directly to database

### Admin Panel
- 🔐 **Secure Authentication** - Supabase Auth with role-based access
- 📝 **Content Management** - Edit hero, about, venue, footer sections
- 🎪 **Event Management** - CRUD operations for events
- 👥 **Speaker Management** - Add and manage speakers
- 🏆 **Sponsor Management** - Organize sponsors by tier
- 📅 **Timeline Editor** - Manage event schedule
- 📊 **Registration Dashboard** - View and manage registrations
- 🎨 **Real-time Updates** - Changes reflect immediately
- 📈 **Activity Logs** - Track all admin actions

## 🛠️ Setup & Installation

### Prerequisites
- A Supabase account (free tier works great!)
- A static file server (or use our built-in dev server)
- Modern web browser

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/construo-2026.git
cd construo-2026
```

### 2. Install Dependencies (optional, for dev server)
```bash
npm install
```

### 3. Setup Supabase

#### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Save your project URL and anon key

#### B. Run Database Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase-migration.sql`
3. Paste and run the migration
4. Verify all tables are created

#### C. Create Storage Buckets
Create these public buckets in Supabase Storage:
- `event-logos`
- `speaker-photos`
- `sponsor-logos`
- `organizer-images`
- `venue-images`
- `media`

#### D. Create Admin User
1. Go to Authentication in Supabase Dashboard
2. Create a new user
3. Note the user ID
4. Run this SQL to create admin profile:
```sql
INSERT INTO profiles (user_id, username, email, name, role, status)
VALUES (
    'YOUR_USER_ID',
    'admin',
    'admin@construo.com',
    'Super Admin',
    'superadmin',
    'active'
);
```

### 4. Update Supabase Credentials
Update the following files with your Supabase credentials:

**js/supabase-config.js:**
```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

**admin/js/supabase-config.js:**
```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 5. Run Development Server
```bash
npm run dev
```

Or use any static file server:
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# PHP
php -S localhost:8000

# Node.js http-server
npx http-server -p 8000
```

Visit:
- **Public Site**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

## 🚀 Deployment

### Static Hosting (Recommended)
Deploy to any static hosting platform:

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Or drag and drop the project folder to Netlify dashboard.

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### GitHub Pages
```bash
# Push to gh-pages branch
git subtree push --prefix . origin gh-pages
```

#### Cloudflare Pages
1. Connect your Git repository
2. Build settings: None (static site)
3. Deploy!

### Environment Variables
**No environment variables needed!** Everything is configured through:
- Supabase Dashboard
- Config files (update once)

## 📁 Project Structure

```
construo-2026/
├── index.html              # Public website entry point
├── admin/                  # Admin panel
│   ├── index.html         # Admin login
│   ├── dashboard.html     # Admin dashboard
│   ├── pages/             # Admin content pages
│   ├── js/                # Admin JavaScript
│   │   ├── supabase-config.js
│   │   ├── auth.js
│   │   └── admin.js
│   └── css/               # Admin styles
├── js/                    # Public site JavaScript
│   ├── supabase-config.js # Supabase client config
│   ├── main-supabase.js   # Data loading functions
│   ├── main.js            # Main app logic
│   ├── animations.js      # GSAP animations
│   └── three-scene.js     # Three.js 3D scene
├── css/                   # Public site styles
├── images/                # Static images
├── data/                  # Legacy JSON files (unused)
├── supabase-migration.sql # Database schema
├── SUPABASE_MIGRATION.md  # Migration guide
└── package.json           # Project metadata
```

## 🔐 Admin Panel Access

### Default Admin Login
After creating your admin user in Supabase, login with:
- **Username**: Your configured username
- **Password**: Your Supabase auth password

### Admin Roles
- **Superadmin**: Full access, can delete records
- **Admin**: Can create, read, and update content
- **Moderator**: Can edit content, limited delete access
- **Viewer**: Read-only access to dashboard

## 📚 Documentation

### For Developers
- [Supabase Migration Guide](SUPABASE_MIGRATION.md)
- [Admin Panel Memory](ADMIN_PANEL_MEMORY.md)
- [Project Memory](MEMORY.md)

### For Administrators
- Login to admin panel
- Use the dashboard to manage content
- Changes reflect immediately on the public site
- Export registrations as CSV from the registrations page

## 🎨 Customization

### Theme Colors
Edit CSS variables in `css/style.css` or `admin/css/admin.css`:
```css
:root {
    --color-primary: #f97316;
    --color-secondary: #3b82f6;
    /* ... more variables */
}
```

### Site Content
Edit through admin panel or directly in Supabase:
- Hero section
- About section
- Venue information
- Footer content
- Event categories

## 🐛 Troubleshooting

### Cannot login to admin
- Verify user exists in Supabase Auth
- Check profile record in `profiles` table
- Ensure correct credentials in config files

### Data not loading
- Check browser console for errors
- Verify Supabase credentials
- Confirm RLS policies are set up correctly

### Images not uploading
- Verify storage buckets exist
- Check storage policies
- Ensure bucket names match code

## 📝 License

MIT License - feel free to use this for your own events!

## 👥 Team

CONSTRUO Team - SSN College of Engineering

## 🙏 Acknowledgments

- Three.js community
- GSAP for amazing animations
- Supabase for excellent backend-as-a-service
- All contributors and participants

---

**Note**: This project was successfully migrated from Node.js/Express to Supabase in February 2026. See `SUPABASE_MIGRATION.md` for technical details.

For questions or support, contact: construo@ssn.edu.in
