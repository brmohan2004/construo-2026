# CONSTRUO 2026 - Admin Panel Development Memory File
> Last Updated: February 3, 2026
> Status: ✅ Complete

---

## ✅ COMPLETION STATUS

All admin panel pages have been created:

### Core Infrastructure
- [x] `admin/index.html` - Login page
- [x] `admin/dashboard.html` - Main dashboard
- [x] `admin/css/admin.css` - Admin styles
- [x] `admin/js/admin.js` - Core functionality
- [x] `admin/js/auth.js` - Authentication module

### Website Sections
- [x] `admin/pages/hero.html` - Hero section editor with live preview
- [x] `admin/pages/about.html` - About section with stats management
- [x] `admin/pages/events.html` - Full CRUD events management
- [x] `admin/pages/timeline.html` - Multi-day schedule builder
- [x] `admin/pages/speakers.html` - Speakers with social links
- [x] `admin/pages/sponsors.html` - Sponsors organized by tier
- [x] `admin/pages/venue.html` - Venue info with map settings
- [x] `admin/pages/footer.html` - Footer & social links

### Management
- [x] `admin/pages/registrations.html` - Registration management with export
- [x] `admin/pages/users.html` - User management with roles
- [x] `admin/pages/media.html` - Media library with upload
- [x] `admin/pages/settings.html` - Site-wide settings (tabs: General, Registration, Email, SEO, Maintenance)

### Data Files
- [x] `data/site-config.json` - Hero, About, Venue, Footer data
- [x] `data/events.json` - Events data
- [x] `data/timeline.json` - Timeline data
- [x] `data/speakers.json` - Speakers data
- [x] `data/sponsors.json` - Sponsors data
- [x] `data/registrations.json` - Registration data
- [x] `data/users.json` - Admin users
- [x] `data/media.json` - Media library

---

## 📁 PROJECT STRUCTURE

```
construo/
├── index.html                 # Main website
├── css/
│   └── style.css             # Website styles
├── js/
│   └── main.js               # Website scripts
├── admin/                     # 🆕 Admin Panel
│   ├── index.html            # Admin login page
│   ├── dashboard.html        # Main dashboard
│   ├── css/
│   │   └── admin.css         # Admin panel styles
│   ├── js/
│   │   ├── admin.js          # Core admin functionality
│   │   ├── auth.js           # Authentication
│   │   └── api.js            # API handlers
│   └── pages/
│       ├── hero.html         # Hero section manager
│       ├── about.html        # About section manager
│       ├── events.html       # Events manager
│       ├── timeline.html     # Timeline manager
│       ├── speakers.html     # Speakers manager
│       ├── sponsors.html     # Sponsors manager
│       ├── venue.html        # Venue manager
│       ├── registrations.html# Registration manager
│       ├── footer.html       # Footer manager
│       ├── users.html        # User management
│       ├── media.html        # Media library
│       └── settings.html     # Settings page
├── api/                       # 🆕 Backend API
│   ├── server.js             # Express server
│   ├── config/
│   │   └── db.js             # Database config
│   ├── models/               # Database models
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Speaker.js
│   │   ├── Sponsor.js
│   │   ├── Registration.js
│   │   ├── Settings.js
│   │   └── ActivityLog.js
│   ├── routes/               # API routes
│   │   ├── auth.js
│   │   ├── hero.js
│   │   ├── about.js
│   │   ├── events.js
│   │   ├── timeline.js
│   │   ├── speakers.js
│   │   ├── sponsors.js
│   │   ├── venue.js
│   │   ├── registrations.js
│   │   ├── users.js
│   │   ├── media.js
│   │   └── settings.js
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   └── upload.js         # File upload handler
│   └── utils/
│       └── helpers.js        # Utility functions
├── data/                      # 🆕 JSON data storage (for demo)
│   ├── site-config.json      # Hero, About, Footer data
│   ├── events.json           # Events data
│   ├── timeline.json         # Timeline data
│   ├── speakers.json         # Speakers data
│   ├── sponsors.json         # Sponsors data
│   ├── registrations.json    # Registration data
│   └── users.json            # Admin users
└── uploads/                   # 🆕 Uploaded files
    ├── events/
    ├── speakers/
    ├── sponsors/
    └── gallery/
```

---

## 🗄️ DATA SCHEMAS

### 1. Site Configuration (site-config.json)
```json
{
  "hero": {
    "badge": "Civil Engineering Symposium",
    "title": "CONSTRUO",
    "titleOutline": "2026",
    "tagline": "Building Tomorrow's Engineers",
    "date": {
      "days": "15-17",
      "month": "March",
      "year": "2026"
    },
    "registrationFee": {
      "amount": 500,
      "currency": "INR",
      "note": "per participant"
    },
    "ctaButtons": [
      { "text": "Register Now", "link": "#register", "type": "primary" },
      { "text": "Explore", "link": "#about", "type": "secondary" }
    ]
  },
  "about": {
    "title": "About the Symposium",
    "content": "<p>Rich HTML content...</p>",
    "stats": [
      { "number": "500+", "label": "Participants" },
      { "number": "20+", "label": "Events" },
      { "number": "50+", "label": "Colleges" },
      { "number": "3", "label": "Days" }
    ],
    "poster": "/uploads/poster.jpg",
    "brochure": "/uploads/brochure.pdf"
  },
  "venue": {
    "name": "Engineering College",
    "address": "Full address here",
    "mapCoordinates": { "lat": 0, "lng": 0 },
    "mapEmbed": "Google Maps embed URL",
    "images": [],
    "facilities": []
  },
  "footer": {
    "tagline": "Building Tomorrow's Engineers",
    "social": {
      "instagram": "#",
      "linkedin": "#",
      "twitter": "#",
      "youtube": "#"
    },
    "contact": {
      "email": "info@construo.com",
      "phone": "+91 98765 43210",
      "department": "Civil Engineering Dept.",
      "college": "Engineering College"
    },
    "quickLinks": [],
    "copyright": "© 2026 CONSTRUO. Crafted with precision."
  }
}
```

### 2. Events Schema (events.json)
```json
{
  "events": [
    {
      "id": "evt_001",
      "name": "Paper Presentation",
      "slug": "paper-presentation",
      "category": "technical",
      "logo": "/uploads/events/paper.png",
      "participation": "team",
      "teamSize": { "min": 2, "max": 4 },
      "entryFee": 200,
      "prizeMoney": { "first": 5000, "second": 3000, "third": 1500 },
      "description": "Short description",
      "rules": ["Rule 1", "Rule 2"],
      "timeline": [
        { "phase": "Registration", "date": "March 1-10" },
        { "phase": "Submission", "date": "March 12" },
        { "phase": "Finals", "date": "March 15" }
      ],
      "coordinator": {
        "name": "John Doe",
        "phone": "+91 9876543210",
        "email": "john@college.edu"
      },
      "registrationLink": "#register",
      "status": "active",
      "featured": true,
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

### 3. Timeline Schema (timeline.json)
```json
{
  "days": [
    {
      "id": "day_1",
      "date": "2026-03-15",
      "title": "Day 1 - Inauguration",
      "sessions": [
        {
          "id": "sess_001",
          "time": "09:00 AM",
          "endTime": "10:00 AM",
          "title": "Inauguration Ceremony",
          "description": "Opening ceremony with chief guest",
          "location": "Main Auditorium",
          "speaker": "speaker_001",
          "type": "ceremony"
        }
      ]
    }
  ]
}
```

### 4. Speakers Schema (speakers.json)
```json
{
  "speakers": [
    {
      "id": "speaker_001",
      "name": "Dr. Example Name",
      "title": "Chief Engineer",
      "organization": "Company Name",
      "photo": "/uploads/speakers/speaker1.jpg",
      "bio": "Brief biography...",
      "social": {
        "linkedin": "",
        "twitter": ""
      },
      "sessions": ["sess_001"],
      "featured": true,
      "order": 1,
      "status": "active"
    }
  ]
}
```

### 5. Sponsors Schema (sponsors.json)
```json
{
  "tiers": [
    {
      "id": "platinum",
      "name": "Platinum Sponsors",
      "order": 1,
      "sponsors": [
        {
          "id": "spon_001",
          "name": "Company Name",
          "logo": "/uploads/sponsors/company.png",
          "website": "https://company.com",
          "description": "Brief description",
          "order": 1,
          "status": "active"
        }
      ]
    }
  ]
}
```

### 6. Registrations Schema (registrations.json)
```json
{
  "registrations": [
    {
      "id": "reg_001",
      "registrationNumber": "CONS2026001",
      "participant": {
        "name": "John Doe",
        "email": "john@email.com",
        "phone": "+91 9876543210",
        "college": "ABC Engineering College",
        "year": "3rd Year",
        "department": "Civil Engineering"
      },
      "events": ["evt_001", "evt_002"],
      "teamMembers": [
        { "name": "Member 1", "email": "m1@email.com" }
      ],
      "payment": {
        "amount": 500,
        "status": "completed",
        "transactionId": "TXN123456",
        "method": "UPI",
        "paidAt": "2026-02-01T10:00:00Z"
      },
      "status": "confirmed",
      "createdAt": "2026-02-01T09:00:00Z"
    }
  ]
}
```

### 7. Users Schema (users.json)
```json
{
  "users": [
    {
      "id": "user_001",
      "username": "admin",
      "email": "admin@construo.com",
      "password": "hashed_password",
      "role": "superadmin",
      "name": "Admin User",
      "avatar": "/uploads/avatars/admin.jpg",
      "lastLogin": "2026-02-03T10:00:00Z",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "roles": {
    "superadmin": {
      "permissions": ["*"]
    },
    "admin": {
      "permissions": ["read", "write", "delete", "manage_users"]
    },
    "moderator": {
      "permissions": ["read", "write"]
    },
    "viewer": {
      "permissions": ["read"]
    }
  }
}
```

---

## ✅ BUILD CHECKLIST

### Phase 1: Foundation
- [ ] Create admin folder structure
- [ ] Create data JSON files with initial data
- [ ] Build admin login page (admin/index.html)
- [ ] Build admin CSS framework (admin/css/admin.css)
- [ ] Build authentication system (admin/js/auth.js)

### Phase 2: Dashboard & Layout
- [ ] Build admin dashboard (admin/dashboard.html)
- [ ] Create sidebar navigation component
- [ ] Create header with notifications
- [ ] Build stats widgets
- [ ] Create activity feed component

### Phase 3: Content Management Pages
- [ ] Hero Section Manager (admin/pages/hero.html)
- [ ] About Section Manager (admin/pages/about.html)
- [ ] Events Manager (admin/pages/events.html)
- [ ] Timeline Manager (admin/pages/timeline.html)
- [ ] Speakers Manager (admin/pages/speakers.html)
- [ ] Sponsors Manager (admin/pages/sponsors.html)
- [ ] Venue Manager (admin/pages/venue.html)
- [ ] Footer Manager (admin/pages/footer.html)

### Phase 4: Core Features
- [ ] Registration Manager (admin/pages/registrations.html)
- [ ] User Management (admin/pages/users.html)
- [ ] Media Library (admin/pages/media.html)
- [ ] Settings Page (admin/pages/settings.html)

### Phase 5: API & Backend
- [ ] Setup Express server (api/server.js)
- [ ] Create API routes for all sections
- [ ] Implement file upload functionality
- [ ] Add JWT authentication middleware

### Phase 6: Integration
- [ ] Connect admin panel to API
- [ ] Implement real-time preview
- [ ] Add export functionality (CSV/Excel)
- [ ] Activity logging system

### Phase 7: Final Polish
- [ ] Responsive design testing
- [ ] Dark/Light mode
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications

---

## 🎨 ADMIN UI DESIGN SPECS

### Color Palette
```css
--admin-bg: #0f172a;           /* Dark blue-gray background */
--admin-sidebar: #1e293b;      /* Sidebar background */
--admin-card: #1e293b;         /* Card background */
--admin-border: #334155;       /* Border color */
--admin-text: #f1f5f9;         /* Primary text */
--admin-text-muted: #94a3b8;   /* Muted text */
--admin-primary: #f97316;      /* Orange accent (match website) */
--admin-success: #22c55e;      /* Green */
--admin-warning: #eab308;      /* Yellow */
--admin-danger: #ef4444;       /* Red */
--admin-info: #3b82f6;         /* Blue */
```

### Typography
```css
--admin-font: 'Inter', -apple-system, sans-serif;
--admin-font-mono: 'JetBrains Mono', monospace;
```

### Component Sizes
```css
--sidebar-width: 260px;
--sidebar-collapsed: 70px;
--header-height: 64px;
--card-radius: 12px;
--input-radius: 8px;
```

---

## 🔐 DEFAULT CREDENTIALS (For Demo)

```
Username: admin
Password: construo2026
```

---

## 📝 CURRENT PROGRESS

### ✅ Completed
- [x] Memory file created
- [x] Data schemas defined
- [x] File structure planned

### 🔄 In Progress
- [ ] Creating admin folder structure

### ⏳ Pending
- Everything in the build checklist

---

## 🔗 INTEGRATION NOTES

### Website to Admin Data Flow
1. Admin panel saves data to JSON files in `/data/` folder
2. Website reads from these JSON files (or API endpoints)
3. Changes reflect immediately on the website

### API Endpoints (Planned)
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/hero
PUT    /api/hero

GET    /api/about
PUT    /api/about

GET    /api/events
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id

GET    /api/timeline
PUT    /api/timeline

GET    /api/speakers
POST   /api/speakers
PUT    /api/speakers/:id
DELETE /api/speakers/:id

GET    /api/sponsors
POST   /api/sponsors
PUT    /api/sponsors/:id
DELETE /api/sponsors/:id

GET    /api/registrations
PUT    /api/registrations/:id/status
GET    /api/registrations/export

GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

POST   /api/media/upload
GET    /api/media
DELETE /api/media/:id

GET    /api/settings
PUT    /api/settings

GET    /api/logs
```

---

## 💡 NOTES & REMINDERS

1. All form submissions should have validation
2. Implement auto-save for text editors
3. Add confirmation dialogs for delete actions
4. Include bulk operations where applicable
5. Maintain activity logs for all changes
6. Support image optimization on upload
7. Add search functionality to all list views
8. Implement pagination for large datasets

---

*This memory file serves as the single source of truth for the admin panel development. Update this file as progress is made.*
