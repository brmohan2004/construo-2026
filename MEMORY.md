# CONSTRUO - Civil Engineering Symposium Website

## Project Memory File
**Created:** February 2, 2026  
**Status:** In Development

---

## Project Overview
A 3D immersive scrollytelling website for a Civil Engineering Symposium featuring realistic construction-themed animations and professional design.

## Theme: "Building Tomorrow"
The narrative follows the construction journey—from blueprint to completion.

---

## Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Deep Navy | #1a2332 | Primary backgrounds |
| Concrete Gray | #8c9196 | Industrial elements |
| Safety Orange | #ff6b35 | Accents, CTAs |
| Blueprint Blue | #4a90d9 | Technical elements |
| Off-white | #f5f5f0 | Text backgrounds |
| Steel | #71797E | Metallic elements |

---

## File Structure
```
construo/
├── index.html          # Main website
├── admin/              # Admin panel
│   ├── css/
│   │   └── admin.css   # Admin styles
│   ├── js/
│   │   ├── admin.js    # Core admin functionality
│   │   └── auth.js     # Authentication module
│   ├── index.html      # Login page
│   ├── dashboard.html  # Dashboard
│   ├── hero.html       # Hero editor
│   ├── about.html      # About editor
│   ├── events.html     # Events management
│   ├── speakers.html   # Speakers management
│   ├── sponsors.html   # Sponsors management
│   ├── timeline.html   # Timeline editor
│   ├── venue.html      # Venue settings
│   ├── footer.html     # Footer editor
│   ├── users.html      # User management
│   ├── media.html      # Media library
│   └── settings.html   # Site settings
├── api/                # Backend API
│   ├── config/
│   │   └── db.js       # Database config
│   ├── middleware/
│   │   ├── auth.js     # JWT authentication
│   │   └── upload.js   # File upload handler
│   ├── routes/
│   │   ├── auth.js     # Auth endpoints
│   │   ├── hero.js     # Hero endpoints
│   │   ├── about.js    # About endpoints
│   │   ├── events.js   # Events CRUD
│   │   ├── speakers.js # Speakers CRUD
│   │   ├── sponsors.js # Sponsors CRUD
│   │   ├── timeline.js # Timeline CRUD
│   │   ├── venue.js    # Venue endpoints
│   │   ├── registrations.js
│   │   ├── users.js    # User management
│   │   ├── media.js    # Media library
│   │   ├── settings.js # Settings
│   │   └── logs.js     # Activity logs
│   └── server.js       # Express server
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   ├── main.js         # Main JavaScript
│   ├── three-scene.js  # Three.js 3D setup
│   ├── animations.js   # GSAP animations
│   └── scroll.js       # Scroll interactions
├── data/               # JSON data storage
├── uploads/            # Uploaded files
├── assets/             # Static assets
├── package.json        # Node.js dependencies
├── .gitignore          # Git ignore rules
├── MEMORY.md           # This file
└── README.md           # Documentation
```

---

## Sections Checklist
- [ ] Section 1: Hero - Particle cityscape assembly
- [ ] Section 2: About - Bridge construction animation
- [ ] Section 3: Timeline - Crane building blocks
- [ ] Section 4: Speakers - Architectural pedestals
- [ ] Section 5: Events - Isometric construction site
- [ ] Section 6: Venue - 3D campus model
- [ ] Section 7: Registration - Glass-morphism form
- [ ] Section 8: Sponsors - Billboard highway
- [ ] Section 9: Footer - Night city scene

---

## Tech Stack
- **3D Engine:** Three.js
- **Animations:** GSAP + ScrollTrigger
- **Smooth Scroll:** Lenis
- **Build:** Vanilla (CDN-based for simplicity)

---

## Progress Log

### February 2, 2026
- [x] Project initialized
- [x] Memory file created
- [x] Base HTML structure (index.html)
- [x] CSS styling system (css/style.css)
- [x] Three.js scene setup (js/three-scene.js)
- [x] GSAP animations (js/animations.js)
- [x] Main JavaScript (js/main.js)
- [x] All 9 sections implemented
- [x] Custom cursor system
- [x] Scroll progress indicator
- [x] Mobile responsive design
- [x] Preloader animation

### Admin Panel Development
- [x] **Phase 1: Core Structure**
  - [x] Admin folder structure
  - [x] Login page (admin/index.html)
  - [x] Dashboard layout
  - [x] Sidebar navigation
  - [x] CSS framework (admin.css)

- [x] **Phase 2: Authentication**
  - [x] Login/logout system (auth.js)
  - [x] Session management
  - [x] Role-based access
  - [x] Demo credentials

- [x] **Phase 3: Admin UI**
  - [x] Dashboard with stats
  - [x] Hero section editor
  - [x] About section editor
  - [x] Events management
  - [x] Speakers management
  - [x] Sponsors management

- [x] **Phase 4: Additional Pages**
  - [x] Timeline editor
  - [x] Venue settings
  - [x] Footer editor
  - [x] User management
  - [x] Media library
  - [x] Settings page

- [x] **Phase 5: API & Backend**
  - [x] Express server (api/server.js)
  - [x] Database config (api/config/db.js)
  - [x] JWT auth middleware
  - [x] File upload middleware
  - [x] All API routes:
    - [x] auth.js - Login/logout/password
    - [x] hero.js - Hero section
    - [x] about.js - About section
    - [x] events.js - Events CRUD
    - [x] timeline.js - Timeline/sessions
    - [x] speakers.js - Speakers CRUD
    - [x] sponsors.js - Sponsors CRUD
    - [x] venue.js - Venue settings
    - [x] registrations.js - Registration management
    - [x] users.js - User management
    - [x] media.js - Media library
    - [x] settings.js - Site settings
    - [x] logs.js - Activity logging

- [x] **Phase 6: Integration**
  - [x] API integration in admin.js
  - [x] Auth token handling
  - [x] Activity logging
  - [x] Export functionality (CSV/JSON)

- [x] **Phase 7: Final Polish**
  - [x] Dark/Light theme toggle
  - [x] Loading states & skeleton loaders
  - [x] Custom confirm dialogs
  - [x] Form validation improvements
  - [x] Drag-and-drop sorting
  - [x] Image preview
  - [x] package.json created
  - [x] README updated

---

## Admin Panel Credentials
| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | construo2026 |
| Coordinator | coordinator | coord2026 |
| Volunteer | volunteer | vol2026 |

---

## API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /api/auth/login | POST | No | User login |
| /api/auth/me | GET | Yes | Get current user |
| /api/hero | GET/PUT | Yes | Hero section |
| /api/about | GET/PUT | Yes | About section |
| /api/events | CRUD | Yes | Events management |
| /api/speakers | CRUD | Yes | Speaker profiles |
| /api/sponsors | CRUD | Yes | Sponsor tiers |
| /api/timeline | CRUD | Yes | Schedule/sessions |
| /api/venue | GET/PUT | Yes | Venue settings |
| /api/registrations | CRUD | Yes | Registrations |
| /api/users | CRUD | Superadmin | User management |
| /api/media | CRUD | Yes | Media library |
| /api/settings | GET/PUT | Superadmin | Site settings |
| /api/logs | GET | Yes | Activity logs |

---

## Event Details (Placeholder)
- **Event Name:** CONSTRUO 2026
- **Tagline:** Building Tomorrow's Engineers
- **Date:** [To be updated]
- **Venue:** [To be updated]
- **College:** [To be updated]

---

## Notes
- Prioritize performance with LOD models
- Ensure mobile fallback with 2D parallax
- Test on multiple browsers
- Optimize 3D assets for web

## Running the Project

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm start
```

Visit http://localhost:3000 for the website and http://localhost:3000/admin for the admin panel.
