# CONSTRUO 2026 - Deployment Guide

## Static Site Deployment

Since CONSTRUO 2026 is now a fully static site (after Supabase migration), you can deploy it to any static hosting platform. Here are the most popular options:

---

## 🚀 Option 1: Netlify (Recommended)

### Method A: Drag and Drop (Easiest)
1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag the project folder to the upload area
3. Done! Your site is live.

### Method B: Git Integration
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to Netlify Dashboard
3. Click "New site from Git"
4. Select your repository
5. Build settings:
   - Build command: (leave empty)
   - Publish directory: `/` (root)
6. Click "Deploy site"

### Method C: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

**Configuration (netlify.toml):**
```toml
[build]
  publish = "."

[[redirects]]
  from = "/admin/*"
  to = "/admin/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🚀 Option 2: Vercel

### Method A: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Method B: Git Integration
1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Framework preset: "Other"
4. Build settings:
   - Build Command: (leave empty)
   - Output Directory: `.`
5. Deploy

**Configuration (vercel.json):**
```json
{
  "rewrites": [
    { "source": "/admin/(.*)", "destination": "/admin/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🚀 Option 3: GitHub Pages

### Setup
```bash
# Create gh-pages branch
git checkout -b gh-pages

# Push to gh-pages
git push origin gh-pages

# Or use subtree
git subtree push --prefix . origin gh-pages
```

### Enable GitHub Pages
1. Go to repository Settings
2. Pages section
3. Source: Deploy from branch
4. Branch: `gh-pages` / `root`
5. Save

**Note**: GitHub Pages URL will be: `https://username.github.io/repo-name`

**Configuration (_config.yml - if using Jekyll):**
```yaml
include:
  - admin
  - js
  - css
  - images

exclude:
  - node_modules
  - package.json
  - README.md
```

---

## 🚀 Option 4: Cloudflare Pages

### Method A: Git Integration
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your Git repository
3. Build settings:
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: `.`
4. Deploy

### Method B: Direct Upload
```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages publish . --project-name=construo-2026
```

---

## 🚀 Option 5: Firebase Hosting

### Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting
# Select:
# - Public directory: .
# - Configure as single-page app: No
# - Set up automatic builds: No

# Deploy
firebase deploy --only hosting
```

**Configuration (firebase.json):**
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/admin/**",
        "destination": "/admin/index.html"
      }
    ]
  }
}
```

---

## 🚀 Option 6: AWS S3 + CloudFront

### Setup S3
```bash
# Create S3 bucket
aws s3 mb s3://construo-2026

# Upload files
aws s3 sync . s3://construo-2026 --exclude "node_modules/*" --exclude ".git/*"

# Configure bucket for static hosting
aws s3 website s3://construo-2026 --index-document index.html --error-document index.html
```

### Setup CloudFront
1. Go to CloudFront console
2. Create distribution
3. Origin: Your S3 bucket
4. Viewer Protocol Policy: Redirect HTTP to HTTPS
5. Default Root Object: index.html

---

## 🚀 Option 7: Render

### Setup
1. Go to [render.com](https://render.com)
2. New Static Site
3. Connect your Git repository
4. Build settings:
   - Build Command: (leave empty)
   - Publish directory: `.`
5. Deploy

---

## 🔧 Pre-Deployment Checklist

### 1. Update Supabase Credentials
Ensure these files have your actual Supabase credentials:
- `js/supabase-config.js`
- `admin/js/supabase-config.js`

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-actual-anon-key';
```

### 2. Test Locally
```bash
# Run local server
npm run dev

# Test public site
open http://localhost:8000

# Test admin panel
open http://localhost:8000/admin
```

### 3. Verify Supabase Setup
- [ ] Database migration complete
- [ ] RLS policies set up
- [ ] Storage buckets created
- [ ] Admin user created
- [ ] Test login works

### 4. Environment-Specific Configuration
If you need different Supabase projects for staging/production:

**Create separate config files:**
- `js/supabase-config.prod.js`
- `js/supabase-config.staging.js`

Update your build process to swap configs based on environment.

---

## 🔒 Security Considerations

### 1. API Keys
✅ **Safe to commit**: Supabase anon key (it's designed to be public)
❌ **Never commit**: Supabase service_role key

### 2. Row Level Security
Ensure RLS is enabled on all tables:
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 3. CORS
Supabase handles CORS automatically. No configuration needed.

### 4. Rate Limiting
Enable rate limiting in Supabase Dashboard if needed.

---

## 📊 Post-Deployment

### 1. Test Everything
- [ ] Public website loads
- [ ] Admin login works
- [ ] Data displays correctly
- [ ] Forms work
- [ ] Images load
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### 2. Setup Custom Domain
Most platforms offer custom domain setup:
1. Add your domain in platform dashboard
2. Update DNS records (CNAME or A record)
3. Enable HTTPS (usually automatic)

### 3. Add SSL Certificate
Most platforms provide free SSL automatically. Verify HTTPS works.

### 4. Setup Analytics (Optional)
Add Google Analytics or Plausible:
```html
<!-- Add to index.html and admin/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
```

### 5. Monitor Performance
Use:
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [GTmetrix](https://gtmetrix.com/)

---

## 🐛 Common Issues

### Issue: Admin panel redirects to index
**Solution**: Check your hosting platform's redirect rules. Add proper SPA routing.

### Issue: 404 on refresh
**Solution**: Configure your host to serve index.html for all routes.

### Issue: Images not loading
**Solution**: 
1. Check Supabase Storage bucket URLs
2. Verify bucket is public
3. Check CORS settings

### Issue: Supabase connection fails
**Solution**:
1. Verify credentials in config files
2. Check Supabase project status
3. Verify RLS policies allow public read

---

## 📝 Deployment Comparison

| Platform | Difficulty | Free Tier | Custom Domain | Build Time | Best For |
|----------|-----------|-----------|---------------|------------|----------|
| Netlify | ⭐ | Yes | Yes | Instant | General use |
| Vercel | ⭐ | Yes | Yes | Instant | Next.js/React |
| GitHub Pages | ⭐⭐ | Yes | Yes | ~1 min | Open source |
| Cloudflare Pages | ⭐ | Yes | Yes | Instant | High traffic |
| Firebase | ⭐⭐ | Yes | Yes | ~30 sec | Google ecosystem |
| Render | ⭐ | Yes | Yes | ~1 min | Full-stack apps |
| AWS S3 | ⭐⭐⭐ | 12 months | Yes | Manual | Enterprise |

---

## 🎉 Success!

Once deployed, your site will be accessible at:
- Public Site: `https://your-domain.com`
- Admin Panel: `https://your-domain.com/admin`

**Need help?** Check:
- Supabase Docs: https://supabase.com/docs
- Platform-specific docs
- Project README.md

---

**Last Updated**: February 2026
