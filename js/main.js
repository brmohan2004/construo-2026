/**
 * CONSTRUO 2026 - Main JavaScript
 * Core functionality and interactions
 */

class ConstruoApp {
    constructor() {
        this.init();
    }

    init() {
        this.initCustomCursor();
        this.initNavigation();
        this.initScrollProgress();
        this.initSmoothScroll();
        this.initMobileMenu();
        this.initFormHandling();
        this.initPosterModal();
        this.initEventCardModals();
        this.initIntersectionObserver();
        this.initDataSync();
    }

    sanitizeUrl(url) {
        if (!url || typeof url !== 'string') return '';
        const trimmed = url.trim();
        // If it looks like an HTML tag (specifically iframe or img), extract the src
        if (trimmed.startsWith('<') && (trimmed.includes('src=')) || trimmed.includes('src=')) {
            const match = trimmed.match(/src=["']([^"']+)["']/i);
            if (match && match[1]) return match[1];
        }
        return trimmed;
    }

    async initDataSync() {
        console.log('Loading website data from Supabase...');
        this.loadInitialData();
    }

    // Load initial data on page load (called once)
    async loadInitialData() {
        console.log('Loading initial data from Supabase...');
        try {
            // Import Supabase data loader
            const waitForDataLoader = () => {
                return new Promise((resolve) => {
                    if (window.ConstruoSupabaseData) {
                        resolve(window.ConstruoSupabaseData);
                        return;
                    }
                    const checkInterval = setInterval(() => {
                        if (window.ConstruoSupabaseData) {
                            clearInterval(checkInterval);
                            resolve(window.ConstruoSupabaseData);
                        }
                    }, 50);
                    // Timeout after 5s to avoid infinite waiting
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        if (!window.ConstruoSupabaseData) {
                            console.error('Supabase data loader timed out');
                            resolve(null);
                        }
                    }, 5000);
                });
            };

            const dataLoader = await waitForDataLoader();
            if (!dataLoader) return;
            const { siteConfig, events, timeline, speakers, sponsors, organizers } = await dataLoader.loadAll();

            // Update Preloader appearance with loaded settings
            if (siteConfig && siteConfig.settings && window.construoAnimations) {
                window.construoAnimations.updatePreloader(siteConfig.settings);
            }

            // Update Hero UI
            if (siteConfig && siteConfig.hero) {
                this.updateHeroUI(siteConfig.hero);
            }

            // Update About UI
            if (siteConfig && siteConfig.about) {
                this.updateAboutUI(siteConfig.about);
            }

            // Update Events UI
            if (events) {
                this.updateEventsUI(events);

                // Update prize pool banner if data available
                const prizePool = (siteConfig.events && siteConfig.events.prizePool) || siteConfig.prizePool;
                if (prizePool) {
                    const prizeAmount = document.querySelector('.prize-amount');
                    const prizeSub = document.querySelector('.prize-sub');
                    if (prizeAmount) prizeAmount.textContent = `₹${prizePool.amount || '50,000+'}`;
                    if (prizeSub) prizeSub.textContent = prizePool.subtitle || 'Certificates for all participants';
                }
            }

            // Update Timeline UI
            if (timeline) {
                this.updateTimelineUI(timeline);
            }

            // Update Speakers UI
            if (speakers) {
                console.log('Initial speakers data:', speakers);
                this.updateSpeakersUI(speakers);
            }

            // Update Sponsors UI
            if (sponsors) {
                this.sponsorsRaw = sponsors; // Store raw array
                const sponsorsObj = {
                    platinum: sponsors.filter(s => s.tier_id === 'platinum'),
                    gold: sponsors.filter(s => s.tier_id === 'gold'),
                    silver: sponsors.filter(s => s.tier_id === 'silver'),
                    bronze: sponsors.filter(s => s.tier_id === 'bronze')
                };
                this.updateSponsorsUI(sponsorsObj);

                // Update Become a Sponsor button with configured email
                if (siteConfig && siteConfig.sponsors && siteConfig.sponsors.email) {
                    const sponsorBtn = document.querySelector('.sponsor-contact-btn');
                    if (sponsorBtn) {
                        sponsorBtn.href = `mailto:${siteConfig.sponsors.email}?subject=Sponsorship%20Inquiry%20for%20CONSTRUO%202026`;
                        sponsorBtn.target = '_self';
                    }
                }
            }

            // Update Venue UI
            if (siteConfig && siteConfig.venue) {
                this.updateVenueUI(siteConfig.venue);
            }

            // Update Footer UI
            if (siteConfig && siteConfig.footer) {
                this.updateFooterUI(siteConfig.footer);
            }

            // Update Organizers UI
            if (organizers) {
                this.organizersRaw = organizers; // Store raw array
                // Group organizers by category
                const categories = [
                    { id: 'faculty', name: 'Faculty', members: organizers.filter(o => o.category === 'faculty') },
                    { id: 'student', name: 'Student', members: organizers.filter(o => o.category === 'student') },
                    { id: 'organizing', name: 'Organizing', members: organizers.filter(o => o.category === 'organizing') }
                ];
                this.updateOrganizersUI({ organizers, categories });
            }

            console.log('Initial data loaded successfully from Supabase');
        } catch (err) {
            console.error('Failed to load initial data from Supabase:', err);
        }
    }


    updateSpeakersUI(speakers) {
        console.log('updateSpeakersUI called with:', speakers);
        if (!speakers || !Array.isArray(speakers)) {
            console.warn('No speakers data or not an array');
            return;
        }
        const container = document.querySelector('.speakers-grid');
        console.log('Speakers container:', container);
        if (!container) {
            console.error('Speakers container not found!');
            return;
        }

        if (speakers.length === 0) {
            container.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; width: 100%; padding: 2rem;">No speakers added yet.</p>';
            console.log('No speakers in database');
            return;
        }

        console.log('Rendering', speakers.length, 'speakers');
        container.innerHTML = speakers.map((speaker, i) => {
            const title = speaker.title || '';
            const name = speaker.name || 'Speaker';
            const designation = speaker.designation || '';
            const organization = speaker.organization || '';
            const topic = speaker.topic || '';
            const image = this.sanitizeUrl(speaker.image || speaker.photo || '');
            const roleText = designation + (organization ? ` at ${organization}` : '');

            console.log(`Rendering speaker ${i + 1}:`, name);

            return `
                <div class="speaker-card" data-speaker="${i + 1}">
                    <div class="speaker-pedestal">
                        <div class="speaker-image">
                            ${image ? `<img src="${image}" alt="${name}">` : `<div class="image-placeholder"><span>${name.charAt(0)}</span></div>`}
                        </div>
                        <div class="speaker-spotlight"></div>
                    </div>
                    <div class="speaker-info">
                        <h3 class="speaker-name">${title} ${name}</h3>
                        ${roleText ? `<p class="speaker-title">${roleText}</p>` : ''}
                        ${topic ? `<p class="speaker-topic">${topic}</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        console.log('Speakers rendered, HTML length:', container.innerHTML.length);

        // Re-init animations after a delay to ensure DOM is updated
        setTimeout(() => {
            if (window.construoAnimations && typeof window.construoAnimations.initSpeakerAnimations === 'function') {
                console.log('Re-initializing speaker animations');
                window.construoAnimations.initSpeakerAnimations();
            } else if (window.gsap && window.ScrollTrigger) {
                try {
                    window.ScrollTrigger.refresh();
                    console.log('ScrollTrigger refreshed');
                } catch (e) {
                    console.error('Failed to refresh ScrollTrigger:', e);
                }
            }
        }, 200);
    }

    // Update organizers section on public site
    updateOrganizersUI(data) {
        if (!data) return;

        const carouselsContainer = document.querySelector('.organizers-carousels');
        const legacyGrid = document.querySelector('.organizers-grid');

        const organizers = data.organizers || [];
        const categories = data.categories || [];

        // Check if there are any organizers
        const hasOrganizers = organizers.length > 0 || categories.some(cat => cat.members && cat.members.length > 0);

        if (!hasOrganizers) {
            if (carouselsContainer) {
                carouselsContainer.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; width: 100%; padding: 2rem;">No organizers added yet.</p>';
            }
            return;
        }

        // Group organizers by category
        const categoryMap = {
            faculty: [],
            student: [],
            organizing: []
        };

        // If we have categories from API
        if (categories.length > 0) {
            categories.forEach(cat => {
                if (cat.members && cat.members.length > 0) {
                    if (cat.id === 'faculty') {
                        categoryMap.faculty = cat.members;
                    } else if (cat.id === 'student') {
                        categoryMap.student = cat.members;
                    } else if (cat.id === 'organizing') {
                        categoryMap.organizing = cat.members;
                    }
                }
            });
        } else {
            // Group from flat list
            organizers.forEach(org => {
                const cat = org.category || 'organizing';
                if (categoryMap[cat]) {
                    categoryMap[cat].push(org);
                }
            });
        }

        // Render each carousel row
        if (carouselsContainer) {
            const rows = carouselsContainer.querySelectorAll('.organizer-row');
            rows.forEach(row => {
                const category = row.dataset.category;
                const track = row.querySelector('.carousel-track');
                const members = categoryMap[category] || [];

                if (members.length === 0) {
                    row.style.display = 'none';
                    return;
                }

                row.style.display = 'block';

                // Create cards HTML
                const cardsHTML = members.map(org => this.renderOrganizerCard(org)).join('');

                // Check if we need to scroll (more than 4 cards typically fills the viewport)
                if (members.length <= 4) {
                    // Center cards without scrolling
                    track.innerHTML = cardsHTML;
                    track.classList.add('no-scroll');
                    track.style.animation = 'none';
                } else {
                    // Duplicate cards for infinite scroll effect
                    track.innerHTML = cardsHTML + cardsHTML;
                    track.classList.remove('no-scroll');

                    // Calculate animation duration based on number of cards
                    const cardCount = members.length;
                    const duration = Math.max(20, cardCount * 5); // Min 20s, 5s per card
                    track.style.animationDuration = `${duration}s`;
                }
            });
        }

        // Attach event listeners for details popup
        if (carouselsContainer) {
            carouselsContainer.querySelectorAll('.organizer-card').forEach(card => {
                card.style.cursor = 'pointer';
                card.addEventListener('click', () => {
                    const orgId = card.getAttribute('data-id');
                    if (orgId) this.showOrganizerDetail(orgId);
                });
            });
        }

        // Re-init animations if needed
        if (window.gsap && window.ScrollTrigger) {
            setTimeout(() => {
                try { window.ScrollTrigger.refresh(); } catch (e) { }
            }, 200);
        }
    }

    renderOrganizerCard(org) {
        const name = org.name || 'Organizer';
        const role = org.role || org.designation || '';
        const image = this.sanitizeUrl(org.image || org.photo || '');

        return `
            <div class="organizer-card" data-id="${org.id}">
                <div class="organizer-photo">
                    ${image ? `<img src="${image}" alt="${name}">` : `<div class="image-placeholder"><span>${name.charAt(0)}</span></div>`}
                </div>
                <h3 class="organizer-name">${name}</h3>
                ${role ? `<p class="organizer-role">${role}</p>` : ''}
            </div>
        `;
    }

    // Update venue section on public site
    updateVenueUI(venue) {
        if (!venue) return;

        const venueSection = document.querySelector('#venue .venue-info');
        if (!venueSection) return;

        const venueCard = venueSection.querySelector('.venue-card');
        if (!venueCard) return;

        // Update venue name
        const venueName = venueCard.querySelector('.venue-name');
        if (venueName && venue.name) {
            venueName.textContent = venue.name;
        }

        // Update address
        const venueAddress = venueCard.querySelector('.venue-address');
        if (venueAddress) {
            const addressParts = [];
            if (venue.address) addressParts.push(venue.address);
            if (venue.city) addressParts.push(venue.city);
            if (venue.state && venue.pincode) addressParts.push(`${venue.state} - ${venue.pincode}`);
            else if (venue.state) addressParts.push(venue.state);
            else if (venue.pincode) addressParts.push(venue.pincode);

            venueAddress.innerHTML = addressParts.map(part => `${part}<br>`).join('');
        }

        // Update Google Maps iframe
        const mapContainer = document.querySelector('#venue-map');
        if (mapContainer && venue.mapEmbedUrl) {
            const mapUrl = this.sanitizeUrl(venue.mapEmbedUrl);

            const iframe = mapContainer.querySelector('iframe');
            if (iframe) {
                iframe.src = mapUrl;
            } else {
                // Create iframe if it doesn't exist
                mapContainer.innerHTML = `
                    <iframe 
                        src="${mapUrl}"
                        width="100%" 
                        height="100%" 
                        style="border:0; border-radius: 12px;" 
                        allowfullscreen="" 
                        loading="lazy" 
                        referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                `;
            }
        }

        // Create venue features dynamically
        const featuresContainer = venueCard.querySelector('.venue-features');
        if (featuresContainer && venue.features && Array.isArray(venue.features)) {
            featuresContainer.innerHTML = venue.features.map(feature => `
                <div class="feature">
                    <span class="feature-icon">${feature.icon || '📍'}</span>
                    <span>${feature.text || feature}</span>
                </div>
            `).join('');
        }

        // Update Get Directions link
        const directionsBtn = venueCard.querySelector('.venue-directions-btn');
        if (directionsBtn && venue.mapLink) {
            directionsBtn.href = venue.mapLink;
        }
    }

    // Update footer section on public site
    updateFooterUI(footer) {
        if (!footer) return;

        const footerSection = document.querySelector('#footer');
        if (!footerSection) return;

        // Update logo text and year
        const logoText = footerSection.querySelector('.logo-text');
        const logoYear = footerSection.querySelector('.logo-year');
        if (logoText && footer.logoText) logoText.textContent = footer.logoText;
        if (logoYear && footer.logoYear) logoYear.textContent = footer.logoYear;

        // Update tagline
        const tagline = footerSection.querySelector('.footer-tagline');
        if (tagline && footer.tagline) {
            tagline.textContent = footer.tagline;
        }

        // Create social links dynamically
        if (footer.social) {
            const socialContainer = footerSection.querySelector('.footer-social');
            if (socialContainer) {
                const socialIcons = {
                    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>`,
                    linkedin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>`,
                    twitter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>`,
                    youtube: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg>`,
                    facebook: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>`
                };

                let socialHTML = '';
                Object.entries(footer.social).forEach(([platform, url]) => {
                    if (url && socialIcons[platform]) {
                        socialHTML += `<a href="${url}" class="social-link" aria-label="${platform}" target="_blank" rel="noopener">${socialIcons[platform]}</a>`;
                    }
                });
                socialContainer.innerHTML = socialHTML;
            }
        }

        // Create footer links dynamically
        const footerLinks = footerSection.querySelector('.footer-links');
        if (footerLinks) {
            let columnsHTML = '';

            // Quick Links column
            if (footer.quickLinks && Array.isArray(footer.quickLinks) && footer.quickLinks.length > 0) {
                columnsHTML += `
                    <div class="footer-column">
                        <h4>Quick Links</h4>
                        ${footer.quickLinks.map(link => `<a href="${link.url}">${link.text}</a>`).join('')}
                    </div>
                `;
            }

            // Resources column (if provided)
            if (footer.resources && Array.isArray(footer.resources) && footer.resources.length > 0) {
                columnsHTML += `
                    <div class="footer-column">
                        <h4>Resources</h4>
                        ${footer.resources.map(link => `<a href="${link.url}">${link.text}</a>`).join('')}
                    </div>
                `;
            }

            // Contact column
            if (footer.contact) {
                columnsHTML += `
                    <div class="footer-column">
                        <h4>Contact</h4>
                        ${footer.contact.email ? `<a href="mailto:${footer.contact.email}">${footer.contact.email}</a>` : ''}
                        ${footer.contact.phone ? `<a href="tel:${footer.contact.phone.replace(/\s/g, '')}">${footer.contact.phone}</a>` : ''}
                        ${footer.contact.address ? `<p>${footer.contact.address}</p>` : ''}
                    </div>
                `;
            }

            if (columnsHTML) {
                footerLinks.innerHTML = columnsHTML;
            }
        }

        // Update copyright and credits
        const copyright = footerSection.querySelector('.footer-copyright');
        if (copyright && footer.copyright) {
            copyright.textContent = footer.copyright;
        }

        const credits = footerSection.querySelector('.footer-credits');
        if (credits && footer.credits) {
            credits.textContent = footer.credits;
        }
    }

    // Helper: Convert tiers array to flat sponsors object
    convertSponsorsData(data) {
        if (!data) return null;

        // If already in flat format, return as is
        if (data.platinum || data.gold || data.silver || data.bronze) {
            return data;
        }

        // Convert tiers array to flat object
        if (data.tiers && Array.isArray(data.tiers)) {
            const sponsors = { platinum: [], gold: [], silver: [], bronze: [] };
            data.tiers.forEach(tier => {
                if (tier.id && sponsors[tier.id] !== undefined) {
                    sponsors[tier.id] = tier.sponsors || [];
                }
            });
            return sponsors;
        }

        return null;
    }

    // Render sponsors on public site
    updateSponsorsUI(sponsors) {
        if (!sponsors) return;

        const tierOrder = ['platinum', 'gold', 'silver', 'bronze'];
        const container = document.querySelector('#sponsors .sponsors-highway');
        if (!container) return;

        const tierLabels = {
            platinum: 'Platinum Sponsors',
            gold: 'Gold Sponsors',
            silver: 'Silver Sponsors',
            bronze: 'Bronze Sponsors'
        };

        const tierClasses = {
            platinum: 'large',
            gold: 'medium',
            silver: 'small',
            bronze: 'small'
        };

        // Update or create each tier
        tierOrder.forEach(tier => {
            const tierSponsors = sponsors[tier] || [];
            let tierDiv = container.querySelector(`.sponsors-tier.tier-${tier}`);

            // Create tier div if it doesn't exist
            if (!tierDiv) {
                tierDiv = document.createElement('div');
                tierDiv.className = `sponsors-tier tier-${tier}`;
                container.appendChild(tierDiv);
            }

            // Only show tiers that have sponsors
            if (tierSponsors.length === 0) {
                tierDiv.style.display = 'none';
                return;
            } else {
                tierDiv.style.display = '';
            }

            const billboardsHTML = tierSponsors.map(sponsor => `
                <div class="sponsor-billboard ${tierClasses[tier]}" data-id="${sponsor.id}">
                    <div class="billboard-content">
                        ${sponsor.logo ?
                    `<img src="${this.sanitizeUrl(sponsor.logo)}" alt="${sponsor.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` :
                    `<span style="font-size: 1.2rem; font-weight: 600;">${sponsor.name}</span>`
                }
                    </div>
                    ${sponsor.website ?
                    `<a href="${sponsor.website}" target="_blank" rel="noopener" style="position: absolute; inset: 0; opacity: 0; z-index: 2;" aria-label="Visit ${sponsor.name}"></a>` :
                    ''
                }
                </div>
            `).join('');

            // To ensure a seamless infinite scroll:
            // Only scroll if there are at least 5 sponsors, otherwise just center them
            const shouldScroll = tierSponsors.length >= 5;
            let finalContent = '';

            if (shouldScroll) {
                const singleSetWidth = 250; // approximate width of one billboard + gap
                const billboardsPerScreen = Math.ceil(window.innerWidth / singleSetWidth);
                const repeatFactor = Math.max(1, Math.ceil(billboardsPerScreen / Math.max(tierSponsors.length, 1)));
                const baseSet = billboardsHTML.repeat(repeatFactor);
                finalContent = baseSet + baseSet;
            } else {
                finalContent = billboardsHTML;
            }

            tierDiv.innerHTML = `
                <h3 class="tier-title">${tierLabels[tier]}</h3>
                <div class="sponsor-carousel ${!shouldScroll ? 'no-scroll' : ''}">
                    <div class="sponsor-track" style="${!shouldScroll ? 'animation: none; justify-content: center; width: 100%;' : ''}">
                        ${finalContent}
                    </div>
                </div>
            `;
        });

        // Attach event listeners for details popup
        container.querySelectorAll('.sponsor-billboard').forEach(billboard => {
            billboard.style.cursor = 'pointer';
            billboard.addEventListener('click', (e) => {
                // If clicked on the website link, don't show modal
                if (e.target.tagName === 'A') return;

                const sponsorId = billboard.getAttribute('data-id');
                if (sponsorId) this.showSponsorDetail(sponsorId);
            });
        });

        // Re-init animations if present
        if (window.construoAnimations && typeof window.construoAnimations.initSponsorAnimations === 'function') {
            window.construoAnimations.initSponsorAnimations();
        } else if (window.gsap && window.ScrollTrigger) {
            try { ScrollTrigger.refresh(); } catch (e) { }
        }
    }

    // --- UI Update Methods ---
    updateHeroUI(data) {
        if (!data) return;

        // Update badge
        const badge = document.querySelector('.hero-badge');
        if (badge && data.badge) badge.textContent = data.badge;

        // Update Title - handles CONSTRUO 2026 split
        const titleLines = document.querySelectorAll('.hero-title .title-line');
        if (titleLines.length >= 1 && data.title) titleLines[0].textContent = data.title;
        if (titleLines.length >= 2 && data.titleOutline) titleLines[1].textContent = data.titleOutline;

        // Update tagline
        const tagline = document.querySelector('.hero-tagline');
        if (tagline && data.tagline) tagline.textContent = data.tagline;

        // Update date
        if (data.date) {
            const day = document.querySelector('.date-day');
            const month = document.querySelector('.date-month');
            const year = document.querySelector('.date-year');
            if (day) day.textContent = data.date.days;
            if (month) month.textContent = data.date.month;
            if (year) year.textContent = data.date.year;
        }

        // Update fee
        if (data.registrationFee) {
            const amount = document.querySelector('.fee-amount');
            const note = document.querySelector('.fee-note');
            const symbol = data.registrationFee.symbol || '₹';
            if (amount) amount.textContent = `${symbol}${data.registrationFee.amount}`;
            if (note) note.textContent = data.registrationFee.note;
        }

        // Update CTA Buttons
        if (data.ctaButtons && Array.isArray(data.ctaButtons)) {
            const ctaContainer = document.querySelector('.hero-cta');
            if (ctaContainer) {
                ctaContainer.innerHTML = data.ctaButtons.map(btn => `
                    <a href="${btn.link}" class="btn btn-${btn.type || 'primary'}">${btn.text}</a>
                `).join('');

                // Animate entrance of new buttons
                if (window.construoAnimations) {
                    window.construoAnimations.playHeroCtaEntrance();
                }
            }
        }
    }

    updateAboutUI(data) {
        if (!data) return;
        console.log('Updating About UI with new data:', data);

        // Update title
        const title = document.getElementById('about-title');
        if (title && data.title) title.textContent = data.title;

        // Update lead and text
        const lead = document.getElementById('about-lead');
        if (lead && (data.lead || data.subtitle)) lead.textContent = data.lead || data.subtitle;

        // Handle both 'description' and 'content' as fallbacks
        const text = document.getElementById('about-text');
        const desc = data.description || data.content || '';
        if (text && desc) text.innerHTML = desc;

        // Update stats
        if (data.stats) {
            const statsContainer = document.getElementById('about-stats');
            if (statsContainer) {
                statsContainer.innerHTML = data.stats.map(stat => `
                    <div class="stat-item">
                        <span class="stat-number" data-count="${stat.value || stat.number}">${stat.value || stat.number}</span>
                        <span class="stat-label">${stat.label}</span>
                    </div>
                `).join('');

                // Re-trigger counter animation if they exist
                if (window.construoAnimations) {
                    window.construoAnimations.initCounterAnimations();
                } else if (window.gsap && window.ScrollTrigger) {
                    ScrollTrigger.refresh();
                }
            }
        }

        // Update poster (both in about section and modal)
        const poster = document.getElementById('about-poster');
        if (poster && data.poster) {
            poster.src = data.poster;
            poster.alt = data.posterAlt || 'Event Poster';

            // Also update the poster modal image
            const posterModalImage = document.querySelector('#modal-poster .poster-modal-image');
            if (posterModalImage) {
                posterModalImage.src = data.poster;
                posterModalImage.alt = data.posterAlt || 'Event Poster - Full Size';
            }

            // Update poster modal title
            const posterModalTitle = document.getElementById('modal-poster-title');
            if (posterModalTitle) {
                posterModalTitle.textContent = data.posterTitle || 'Event Poster';
            }
        }

        // Update brochure
        const brochure = document.getElementById('about-brochure');
        if (brochure && data.brochure) {
            brochure.setAttribute('href', data.brochure);
        }
    }

    updateTimelineUI(days) {
        if (!days) return;

        const timelineContainer = document.querySelector('.timeline-days');
        if (!timelineContainer) return;

        // Clear existing content
        timelineContainer.innerHTML = '';

        days.forEach((day, index) => {
            const dayElement = document.createElement('div');
            dayElement.className = 'timeline-day visible'; // Add 'visible' class for CSS animation
            dayElement.setAttribute('data-day', index + 1);

            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';

            const dayDate = new Date(day.date);
            const formattedDate = dayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

            dayHeader.innerHTML = `
                <span class="day-number">${day.title || `Day ${index + 1}`}</span>
                <span class="day-date">${formattedDate}</span>
            `;
            dayElement.appendChild(dayHeader);

            // Robust check for sessions
            let sessions = day.sessions;
            if (typeof sessions === 'string') {
                try {
                    sessions = JSON.parse(sessions);
                } catch (e) {
                    console.error('Failed to parse sessions JSON for day', index, e);
                    sessions = [];
                }
            }

            console.log(`Day ${index + 1} sessions:`, sessions);

            if (sessions && Array.isArray(sessions) && sessions.length > 0) {
                const sessionsContainer = document.createElement('div');
                sessionsContainer.className = 'day-events';

                sessions.forEach(session => {
                    const sessionElement = document.createElement('div');
                    sessionElement.className = 'event-block';

                    // Clean debug logs from title and description
                    const cleanTitle = (title) => {
                        if (!title) return '';
                        if (title.includes('initializing TimelineManager') || title.includes('auth.js')) return 'Session';
                        return title;
                    };

                    const cleanDesc = (desc) => {
                        if (!desc) return '';
                        if (desc.includes('checkSession') || desc.includes('[Auth]')) return '';
                        return desc;
                    };

                    const title = cleanTitle(session.title);
                    const description = cleanDesc(session.description);

                    sessionElement.innerHTML = `
                        <span class="event-time">${session.start} - ${session.end}</span>
                        <div class="event-details">
                            <span class="event-name">${title}</span>
                            ${description ? `<span class="event-description">${description}</span>` : ''}
                            ${session.venue ? `<span class="event-venue">📍 ${session.venue}</span>` : ''}
                        </div>
                    `;
                    sessionsContainer.appendChild(sessionElement);
                });

                dayElement.appendChild(sessionsContainer);
            }

            timelineContainer.appendChild(dayElement);
        });

        // Re-initialize timeline animations after rendering
        if (window.construoAnimations && typeof window.construoAnimations.initTimelineAnimations === 'function') {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                window.construoAnimations.initTimelineAnimations();
            }, 100);
        } else if (window.gsap && window.ScrollTrigger) {
            // Fallback: refresh ScrollTrigger
            setTimeout(() => {
                try { window.ScrollTrigger.refresh(); } catch (e) { }
            }, 100);
        }
    }

    updateEventsUI(events) {
        if (!events) return;
        this.events = events; // Store for modal access

        const techGrid = document.getElementById('technical-events');
        const nonTechGrid = document.getElementById('non-technical-events');
        const workshopGrid = document.getElementById('workshop-events');

        // If none of the grids are present, nothing to update
        if (!techGrid && !nonTechGrid && !workshopGrid) return;

        const renderEventCard = (event) => {
            const categoryClass = event.category === 'technical' ? 'technical' : (event.category === 'workshop' ? 'workshop' : 'nontech');

            // Handle logo: Use uploaded image if available, else fallback to SVG icon
            let iconContent;
            if (event.image || event.logo) {
                // Check if it's an emoji (short string) or URL
                const imgSource = event.image || event.logo;
                if (imgSource.length < 5 && !imgSource.includes('/')) {
                    iconContent = `<span style="font-size: 2rem;">${imgSource}</span>`;
                } else {
                    iconContent = `<img src="${imgSource}" alt="${event.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
                }
            } else {
                iconContent = this.getEventIcon(event);
            }

            // Handle team size safely
            let teamSizeDisplay = 'Individual';
            if (event.teamSize) {
                if (typeof event.teamSize === 'object') {
                    teamSizeDisplay = `${event.teamSize.min || ''}-${event.teamSize.max || ''}`;
                } else {
                    teamSizeDisplay = event.teamSize;
                }
            }

            return `
                <div class="event-card ${categoryClass}" data-event-id="${event.id}">
                    <button class="event-card-trigger" type="button">
                        <div class="event-icon">
                            ${iconContent}
                        </div>
                        <h4 class="event-name">${event.name}</h4>
                        <span class="event-type">👥 ${teamSizeDisplay}</span>
                    </button>
                    <a href="#register" class="event-register-btn">Register</a>
                </div>
            `;
        };

        // Filter active events
        const activeEvents = events.filter(e => e.isActive !== false);

        const techHtml = activeEvents.filter(e => e.category === 'technical').map(renderEventCard).join('');
        const nonTechHtml = activeEvents.filter(e => e.category === 'non-technical').map(renderEventCard).join('');
        const workshopHtml = activeEvents.filter(e => e.category === 'workshop').map(renderEventCard).join('');

        if (techGrid) techGrid.innerHTML = techHtml;
        if (nonTechGrid) nonTechGrid.innerHTML = nonTechHtml;
        if (workshopGrid) workshopGrid.innerHTML = workshopHtml;

        // Attach event listeners for details popup
        document.querySelectorAll('.event-card-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const card = btn.closest('.event-card');
                const eventId = card.getAttribute('data-event-id');
                this.showEventDetail(eventId);
            });
        });

        // Re-initialize hover effects for new cards
        this.initCustomCursor();
    }

    getEventIcon(event) {
        // Map category or name to appropriate SVG
        if (event.category === 'technical') {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
        } else if (event.category === 'workshop') {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
        } else {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        }
    }

    showSponsorDetail(sponsorId) {
        if (!this.sponsorsRaw) return;
        const sponsor = this.sponsorsRaw.find(s => s.id === sponsorId);
        if (!sponsor) return;

        const modalBody = document.getElementById('generic-modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="event-modal-header" style="flex-direction: column; align-items: center; text-align: center;">
                <div class="event-modal-icon" style="width: 200px; height: 120px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 1.5rem;">
                    ${sponsor.logo ? `<img src="${this.sanitizeUrl(sponsor.logo)}" alt="${sponsor.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` : `<span style="font-size: 2rem; font-weight: 700;">${sponsor.name}</span>`}
                </div>
                <div class="event-modal-title">
                    <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">${sponsor.name}</h2>
                    <span class="event-modal-category technical">${sponsor.tier_id ? sponsor.tier_id.toUpperCase() : 'SPONSOR'}</span>
                </div>
            </div>
            <div class="event-modal-content" style="margin-top: 2rem;">
                <div class="event-modal-description" style="text-align: center; margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6;">
                    <p>${sponsor.description || 'Proud sponsor of CONSTRUO 2026.'}</p>
                </div>
                ${sponsor.website ? `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <a href="${sponsor.website}" target="_blank" rel="noopener" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                        Visit Website
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 18px; height: 18px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                    </a>
                </div>` : ''}
            </div>
            <div class="event-modal-actions" style="justify-content: center;">
                <button class="btn btn-primary" onclick="window.construoApp.closeModal('modal-generic-event')">Close</button>
            </div>
        `;

        this.openModal('modal-generic-event');
    }

    showOrganizerDetail(organizerId) {
        if (!this.organizersRaw) return;
        const org = this.organizersRaw.find(o => o.id === organizerId);
        if (!org) return;

        const modalBody = document.getElementById('generic-modal-body');
        if (!modalBody) return;

        const image = this.sanitizeUrl(org.image || org.photo || '');

        modalBody.innerHTML = `
            <div class="event-modal-header" style="flex-direction: column; align-items: center; text-align: center;">
                <div class="event-modal-icon" style="width: 150px; height: 150px; border-radius: 50%; border: 4px solid var(--color-accent); overflow: hidden; margin-bottom: 1.5rem; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center;">
                    ${image ? `<img src="${image}" alt="${org.name}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div class="image-placeholder" style="font-size: 3rem;"><span>${org.name.charAt(0)}</span></div>`}
                </div>
                <div class="event-modal-title">
                    <h2 style="font-size: 2rem; margin-bottom: 0.25rem;">${org.name}</h2>
                    <span class="event-modal-category workshop" style="text-transform: capitalize;">${org.category || 'Organizer'}</span>
                </div>
            </div>
            <div class="event-modal-content" style="margin-top: 2rem;">
                <div class="event-modal-details" style="grid-template-columns: 1fr; gap: 1rem; padding: 1.5rem; background: rgba(255,255,255,0.03);">
                    <div class="detail-item">
                        <span class="detail-label">Role / Title</span>
                        <span class="detail-value">${org.role || org.designation || 'Specialist'}</span>
                    </div>
                    ${org.designation ? `
                    <div class="detail-item">
                        <span class="detail-label">Designation</span>
                        <span class="detail-value">${org.designation}</span>
                    </div>` : ''}
                    ${org.department ? `
                    <div class="detail-item">
                        <span class="detail-label">Department</span>
                        <span class="detail-value">${org.department}</span>
                    </div>` : ''}
                    ${org.email ? `
                    <div class="detail-item">
                        <span class="detail-label">Email</span>
                        <span class="detail-value"><a href="mailto:${org.email}" style="color: var(--color-accent);">${org.email}</a></span>
                    </div>` : ''}
                    ${org.phone ? `
                    <div class="detail-item">
                        <span class="detail-label">Phone</span>
                        <span class="detail-value"><a href="tel:${org.phone}" style="color: var(--color-accent);">${org.phone}</a></span>
                    </div>` : ''}
                </div>
            </div>
            <div class="event-modal-actions" style="justify-content: center;">
                <button class="btn btn-primary" onclick="window.construoApp.closeModal('modal-generic-event')">Close</button>
            </div>
        `;

        this.openModal('modal-generic-event');
    }

    showEventDetail(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const modalBody = document.getElementById('generic-modal-body');
        if (!modalBody) return;

        const categoryLabel = event.category === 'technical' ? 'Technical Event' : (event.category === 'workshop' ? 'Workshop' : 'Non-Technical Event');
        const categoryClass = event.category === 'technical' ? 'technical' : (event.category === 'workshop' ? 'workshop' : 'nontech');

        let iconContent;
        if (event.image || event.logo) {
            const imgSource = event.image || event.logo;
            if (imgSource.length < 5 && !imgSource.includes('/')) {
                iconContent = `<span style="font-size: 3rem;">${imgSource}</span>`;
            } else {
                iconContent = `<img src="${imgSource}" alt="${event.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">`;
            }
        } else {
            iconContent = this.getEventIcon(event);
        }

        // Handle team size safely
        let teamSizeDisplay = 'TBD';
        if (event.teamSize) {
            if (typeof event.teamSize === 'object') {
                teamSizeDisplay = `${event.teamSize.min || ''}-${event.teamSize.max || ''}`;
            } else {
                teamSizeDisplay = event.teamSize;
            }
        }

        modalBody.innerHTML = `
            <div class="event-modal-header">
                <div class="event-modal-icon">
                    ${iconContent}
                </div>
                <div class="event-modal-title">
                    <h2>${event.name}</h2>
                    <span class="event-modal-category ${categoryClass}">${categoryLabel}</span>
                </div>
            </div>
            <div class="event-modal-content">
                <div class="event-modal-description">
                    <p>${event.description || event.shortDescription || 'No description available.'}</p>
                </div>
                <div class="event-modal-details">
                    <div class="detail-item">
                        <span class="detail-label">Team Size:</span>
                        <span class="detail-value">${teamSizeDisplay}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${event.duration || 'TBD'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Prize:</span>
                        <span class="detail-value">${event.prizeMoney?.first ? '₹' + event.prizeMoney.first : 'TBD'}</span>
                    </div>
                    ${event.registrationFee ? `
                    <div class="detail-item">
                        <span class="detail-label">Fee:</span>
                        <span class="detail-value">₹${event.registrationFee}</span>
                    </div>` : ''}
                    <div class="detail-item">
                        <span class="detail-label">Certificate:</span>
                        <span class="detail-value">${event.certificate ? 'Provided' : 'None'}</span>
                    </div>
                </div>
                ${event.materials && event.materials.length > 0 ? `
                <div class="event-modal-materials">
                    <h3>Materials</h3>
                    <ul>
                        ${event.materials.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>` : ''}
                ${event.rules && event.rules.length > 0 ? `
                <div class="event-modal-rules">
                    <h3>Rules & Guidelines</h3>
                    <ul>
                        ${event.rules.map(rule => `<li>${rule}</li>`).join('')}
                    </ul>
                </div>` : ''}
            </div>
            <div class="event-modal-actions">
                <a href="#register" class="btn btn-primary" onclick="window.construoApp.closeModal('modal-generic-event')">Register Now</a>
                <button class="btn btn-secondary" onclick="window.construoApp.closeModal('modal-generic-event')">Close</button>
            </div>
        `;

        this.lastClickedEventName = event.name;
        this.openModal('modal-generic-event');
    }

    // Custom Cursor
    initCustomCursor() {
        const cursor = document.querySelector('.cursor');
        const cursorFollower = document.querySelector('.cursor-follower');

        if (!cursor || !cursorFollower) return;

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let followerX = 0, followerY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth cursor animation
        const animateCursor = () => {
            // Main cursor (faster)
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';

            // Follower (slower)
            followerX += (mouseX - followerX) * 0.1;
            followerY += (mouseY - followerY) * 0.1;
            cursorFollower.style.left = followerX + 'px';
            cursorFollower.style.top = followerY + 'px';

            requestAnimationFrame(animateCursor);
        };
        animateCursor();

        // Hover effects
        const hoverElements = document.querySelectorAll('a, button, .event-block, .speaker-card, .pricing-card');

        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('hover');
                cursorFollower.classList.add('hover');
            });

            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('hover');
                cursorFollower.classList.remove('hover');
            });
        });
    }

    // Navigation
    initNavigation() {
        const navbar = document.getElementById('navbar');
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('section[id]');

        // Add scrolled / compact state
        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;

            // scrolled visual state
            if (currentScroll > 80) {
                navbar.classList.add('scrolled');
                navbar.classList.add('navbar-small');
            } else {
                navbar.classList.remove('scrolled');
                navbar.classList.remove('navbar-small');
            }
        });

        // Use IntersectionObserver for accurate section tracking
        const observerOptions = {
            root: null,
            rootMargin: '-30% 0% -50% 0%',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));

        // Ensure clicking nav links respects header offset
        navLinks.forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                // Allow default behavior handled by initSmoothScroll
                // But temporarily ensure focus and active styling
                navLinks.forEach(l => l.classList.remove('active'));
                anchor.classList.add('active');
            });
        });
    }

    // Scroll Progress
    initScrollProgress() {
        const progressBar = document.querySelector('.scroll-progress .progress-bar');
        const progressText = document.querySelector('.scroll-progress .progress-text');
        const scrollProgress = document.querySelector('.scroll-progress');

        if (!progressBar || !progressText) return;

        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.scrollY / windowHeight);
            const percentage = Math.round(scrolled * 100);

            // Update progress circle
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (scrolled * circumference);
            progressBar.style.strokeDashoffset = offset;

            // Update percentage text
            progressText.textContent = `${percentage}%`;

            // Show/hide progress indicator
            if (window.scrollY > 300) {
                scrollProgress.classList.add('visible');
            } else {
                scrollProgress.classList.remove('visible');
            }
        });
    }

    // Smooth Scroll & Anchor Handling
    initSmoothScroll() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (!anchor) return;

            const targetId = anchor.getAttribute('href');

            // Handle modal triggers
            if (targetId === '#register') {
                e.preventDefault();
                this.openModal('modal-register');

                // If we have current event context, pre-select it
                const eventSelect = document.getElementById('modal-event');
                if (eventSelect && this.lastClickedEventName) {
                    const options = Array.from(eventSelect.options);
                    const matchingOption = options.find(opt => opt.text.includes(this.lastClickedEventName) || opt.value.includes(this.lastClickedEventName.toLowerCase()));
                    if (matchingOption) {
                        eventSelect.value = matchingOption.value;
                    }
                }
                return;
            }

            // Normal smooth scroll
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();

                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                const mobileMenu = document.querySelector('.mobile-menu');
                const navToggle = document.querySelector('.nav-toggle');
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // Mobile Menu
    initMobileMenu() {
        const toggle = document.querySelector('.nav-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');

        if (!toggle || !mobileMenu) return;

        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            const isOpen = mobileMenu.classList.contains('active');
            document.body.style.overflow = isOpen ? 'hidden' : '';
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close menu on link click
        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // Form Handling (modal registration)
    async initFormHandling() {
        const form = document.getElementById('modal-registration-form');

        if (!form) {
            console.warn('Registration form not found');
            return;
        }

        // Store reference
        this.registrationForm = form;

        // Fetch active form and render
        try {
            const dataLoader = window.ConstruoSupabaseData;
            if (!dataLoader) {
                throw new Error('Supabase data loader (window.ConstruoSupabaseData) not available');
            }
            if (typeof dataLoader.getActiveForm !== 'function') {
                console.warn('getActiveForm method not found on dataLoader. Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(dataLoader)));
                throw new Error('dataLoader.getActiveForm is not a function. Possible version mismatch or script load error.');
            }

            const formData = await dataLoader.getActiveForm();

            if (formData) {
                this.renderRegistrationForm(form, formData);
            } else {
                console.log('No active registration form found');
                form.innerHTML = `<div class="alert alert-info" style="padding: 2rem; text-align: center; color: var(--text-light);">Registration is currently closed.</div>`;
            }
        } catch (error) {
            console.error('Error fetching registration form:', error);
            form.innerHTML = `<div class="alert alert-danger" style="padding: 2rem; text-align: center; color: #ef4444;">Failed to load registration form. Please try again later.</div>`;
        }
    }

    renderRegistrationForm(form, formData) {
        // Clear existing content
        form.innerHTML = '';

        // Store reference to app
        const self = this;

        if (formData.description) {
            const desc = document.createElement('p');
            desc.style.marginBottom = '1.5rem';
            desc.style.color = 'var(--text-light)';
            desc.textContent = formData.description;
            form.appendChild(desc);
        }

        const container = document.createElement('div');
        container.className = 'dynamic-form-fields';

        formData.fields.forEach(field => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = field.label;
            label.htmlFor = field.id;
            if (field.required) {
                const req = document.createElement('span');
                req.style.color = 'var(--primary)';
                req.textContent = ' *';
                label.appendChild(req);
            }
            formGroup.appendChild(label);

            let input;

            switch (field.type) {
                case 'textarea':
                case 'paragraph':
                    input = document.createElement('textarea');
                    input.rows = 4;
                    input.id = field.id;
                    input.name = field.id;
                    if (field.required) input.required = true;
                    if (field.placeholder) input.placeholder = field.placeholder;
                    formGroup.appendChild(input);
                    break;

                case 'select':
                case 'dropdown':
                    input = document.createElement('select');
                    input.innerHTML = `<option value="">Select ${field.label}</option>`;
                    (field.options || []).forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt;
                        input.appendChild(option);
                    });
                    input.id = field.id;
                    input.name = field.id;
                    if (field.required) input.required = true;
                    formGroup.appendChild(input);
                    break;

                case 'radio':
                    const radioContainer = document.createElement('div');
                    radioContainer.className = 'radio-group';
                    radioContainer.style.display = 'flex';
                    radioContainer.style.flexDirection = 'column';
                    radioContainer.style.gap = '0.75rem';
                    radioContainer.style.marginTop = '0.5rem';

                    (field.options || []).forEach((opt, idx) => {
                        const radioWrapper = document.createElement('label');
                        radioWrapper.style.display = 'flex';
                        radioWrapper.style.alignItems = 'center';
                        radioWrapper.style.gap = '0.5rem';
                        radioWrapper.style.cursor = 'pointer';

                        const radioInput = document.createElement('input');
                        radioInput.type = 'radio';
                        radioInput.name = field.id;
                        radioInput.value = opt;
                        radioInput.id = `${field.id}_${idx}`;
                        if (field.required && idx === 0) radioInput.required = true;

                        const radioLabel = document.createElement('span');
                        radioLabel.textContent = opt;

                        radioWrapper.appendChild(radioInput);
                        radioWrapper.appendChild(radioLabel);
                        radioContainer.appendChild(radioWrapper);
                    });

                    formGroup.appendChild(radioContainer);
                    break;

                case 'checkbox':
                    const checkboxContainer = document.createElement('div');
                    checkboxContainer.className = 'checkbox-group';
                    checkboxContainer.style.display = 'flex';
                    checkboxContainer.style.flexDirection = 'column';
                    checkboxContainer.style.gap = '0.75rem';
                    checkboxContainer.style.marginTop = '0.5rem';

                    (field.options || []).forEach((opt, idx) => {
                        const checkboxWrapper = document.createElement('label');
                        checkboxWrapper.style.display = 'flex';
                        checkboxWrapper.style.alignItems = 'center';
                        checkboxWrapper.style.gap = '0.5rem';
                        checkboxWrapper.style.cursor = 'pointer';

                        const checkboxInput = document.createElement('input');
                        checkboxInput.type = 'checkbox';
                        checkboxInput.name = field.id;
                        checkboxInput.value = opt;
                        checkboxInput.id = `${field.id}_${idx}`;
                        checkboxInput.className = 'checkbox-input';

                        const checkboxLabel = document.createElement('span');
                        checkboxLabel.textContent = opt;

                        checkboxWrapper.appendChild(checkboxInput);
                        checkboxWrapper.appendChild(checkboxLabel);
                        checkboxContainer.appendChild(checkboxWrapper);
                    });

                    formGroup.appendChild(checkboxContainer);
                    break;

                case 'email':
                    input = document.createElement('input');
                    input.type = 'email';
                    input.id = field.id;
                    input.name = field.id;
                    if (field.required) input.required = true;
                    if (field.placeholder) input.placeholder = field.placeholder;
                    // Strict email pattern
                    input.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$';
                    input.title = 'Please enter a valid email address';
                    formGroup.appendChild(input);
                    break;

                case 'tel':
                case 'phone':
                case 'mobile':
                    input = document.createElement('input');
                    input.type = 'tel';
                    input.id = field.id;
                    input.name = field.id;
                    if (field.required) input.required = true;
                    if (field.placeholder) input.placeholder = field.placeholder || 'e.g. 9876543210';
                    // 10 digit phone pattern
                    input.pattern = '[0-9]{10}';
                    input.title = 'Please enter a 10-digit mobile number';
                    input.maxLength = 10;
                    input.minLength = 10;
                    formGroup.appendChild(input);
                    break;

                case 'number':
                    input = document.createElement('input');
                    input.type = 'number';
                    input.id = field.id;
                    input.name = field.id;
                    if (field.required) input.required = true;
                    if (field.placeholder) input.placeholder = field.placeholder;
                    input.title = 'Please enter a numeric value';
                    formGroup.appendChild(input);
                    break;

                default:
                    input = document.createElement('input');
                    input.type = 'text';
                    input.id = field.id;
                    input.name = field.id;
                    if (field.required) input.required = true;
                    if (field.placeholder) input.placeholder = field.placeholder;
                    formGroup.appendChild(input);
            }

            // Add focus effects for regular inputs
            if (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT')) {
                input.addEventListener('focus', () => formGroup.classList.add('focused'));
                input.addEventListener('blur', () => {
                    if (!input.value) formGroup.classList.remove('focused');
                });
            }

            container.appendChild(formGroup);
        });

        form.appendChild(container);

        // Submit Button - attach click handler directly
        const submitBtn = document.createElement('button');
        submitBtn.type = 'button'; // Use button type to prevent form submit issues
        submitBtn.className = 'btn btn-primary btn-submit';
        submitBtn.textContent = 'Register Now';

        // Direct click handler
        submitBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Submit button clicked');

            // Disable button
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            // Collect form data
            const data = {};
            const inputs = form.querySelectorAll('input, select, textarea');

            let isValid = true;

            // Group inputs by name for radio/checkbox
            const inputsByName = {};
            inputs.forEach(inp => {
                if (inp.name) {
                    if (!inputsByName[inp.name]) {
                        inputsByName[inp.name] = [];
                    }
                    inputsByName[inp.name].push(inp);
                }
            });

            // Collect data from each field
            Object.keys(inputsByName).forEach(fieldName => {
                const fieldInputs = inputsByName[fieldName];
                const firstInput = fieldInputs[0];

                if (firstInput.type === 'radio') {
                    // Radio buttons - get checked value
                    const checked = fieldInputs.find(inp => inp.checked);
                    if (firstInput.required && !checked) {
                        isValid = false;
                        fieldInputs.forEach(inp => {
                            const label = inp.closest('label');
                            if (label) label.style.color = '#ef4444';
                        });
                    } else {
                        fieldInputs.forEach(inp => {
                            const label = inp.closest('label');
                            if (label) label.style.color = '';
                        });
                        if (checked) {
                            data[fieldName] = checked.value;
                        }
                    }
                } else if (firstInput.type === 'checkbox') {
                    // Checkboxes - get all checked values
                    const checked = fieldInputs.filter(inp => inp.checked);
                    if (firstInput.required && checked.length === 0) {
                        isValid = false;
                        fieldInputs.forEach(inp => {
                            const label = inp.closest('label');
                            if (label) label.style.color = '#ef4444';
                        });
                    } else {
                        fieldInputs.forEach(inp => {
                            const label = inp.closest('label');
                            if (label) label.style.color = '';
                        });
                        if (checked.length > 0) {
                            data[fieldName] = checked.map(inp => inp.value);
                        }
                    }
                } else {
                    // Regular inputs (text, email, select, etc.)
                    const inp = firstInput;

                    // Use native HTML5 validation
                    // Fix: Some browsers choke on complex patterns in checkValidity if they contain anchors or flags they don't like
                    try {
                        // Temp fix for email pattern issues: remove $ anchor if present in pattern attribute
                        if (inp.type === 'email' && inp.hasAttribute('pattern')) {
                            let p = inp.getAttribute('pattern');
                            if (p.endsWith('$')) {
                                inp.setAttribute('pattern', p.slice(0, -1));
                            }
                        }

                        if (!inp.checkValidity()) {
                            isValid = false;
                            inp.style.borderColor = '#ef4444';
                            // ... error handling
                            if (inp.validationMessage) {
                                console.warn(`Validation failed for ${fieldName}: ${inp.validationMessage}`);
                            }
                        } else {
                            inp.style.borderColor = '';
                            if (inp.value) {
                                if (inp.multiple) {
                                    data[fieldName] = Array.from(inp.selectedOptions).map(o => o.value);
                                } else {
                                    data[fieldName] = inp.value;
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Validation error ignored:', e);
                        // Fallback: assume valid if checkValidity crashes
                        if (inp.value) data[fieldName] = inp.value;
                    }
                }
            });

            if (!isValid) {
                // Find first invalid input and focus it
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    self.showNotification(firstInvalid.title || firstInvalid.validationMessage || 'Please correct the highlighted fields', 'error');
                } else {
                    self.showNotification('Please fill in all required fields correctly', 'error');
                }

                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register Now';
                return;
            }

            console.log('Submitting data:', data);

            try {
                const dataLoader = window.ConstruoSupabaseData;
                if (!dataLoader) throw new Error('Supabase data loader not available');

                // Map form fields to participant object if possible
                const participant = {};
                const nameField = formData.fields.find(f => f.label.toLowerCase().includes('name'));
                const emailField = formData.fields.find(f => f.label.toLowerCase().includes('email'));
                const phoneField = formData.fields.find(f => f.label.toLowerCase().includes('phone') || f.label.toLowerCase().includes('mobile') || f.label.toLowerCase().includes('contact'));
                const collegeField = formData.fields.find(f => f.label.toLowerCase().includes('college') || f.label.toLowerCase().includes('institution') || f.label.toLowerCase().includes('university'));
                const yearField = formData.fields.find(f => f.label.toLowerCase().includes('year'));
                const deptField = formData.fields.find(f => f.label.toLowerCase().includes('dept') || f.label.toLowerCase().includes('department'));

                if (nameField) participant.name = data[nameField.id];
                if (emailField) participant.email = data[emailField.id];
                if (phoneField) participant.phone = data[phoneField.id];
                if (collegeField) participant.college = data[collegeField.id];
                if (yearField) participant.year = data[yearField.id];
                if (deptField) participant.department = data[deptField.id];

                const payload = {
                    formId: formData.id,
                    participant: participant,
                    data: data,
                    events: data.events || [],
                    teamMembers: data.teamMembers || [],
                    payment: { amount: 0, status: 'pending' }
                };

                const result = await dataLoader.createRegistration(payload);
                console.log('Registration successful:', result);

                // Close modal and show success
                self.closeModal('modal-register');
                const regNum = result.registration_number || result.registrationNumber || 'Success';
                self.showNotification(`Registration successful! Your ID: ${regNum}`, 'success');

                // Reset form
                form.reset();
            } catch (error) {
                console.error('Registration error:', error);
                self.showNotification(error.message || 'Registration failed. Please try again.', 'error');
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register Now';
            }
        });

        form.appendChild(submitBtn);

        console.log('Registration form rendered with', formData.fields.length, 'fields');
    }

    // Poster Modal
    initPosterModal() {
        const posterTrigger = document.querySelector('.poster-trigger');
        if (!posterTrigger) return;

        posterTrigger.addEventListener('click', () => {
            this.openModal('modal-poster');
        });
    }

    // Event Card Modals
    initEventCardModals() {
        const eventCards = document.querySelectorAll('.event-card[data-modal]');

        eventCards.forEach(card => {
            const trigger = card.querySelector('.event-card-trigger');
            const modalId = card.getAttribute('data-modal');

            if (trigger && modalId) {
                trigger.addEventListener('click', () => {
                    this.openModal(modalId);
                });
            }
        });
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus management
        const focusableElements = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Close on backdrop click
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeModal(modalId), { once: true });
        }

        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modalId);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Close on close button click
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modalId), { once: true });
        }

        // Close on any element with data-modal-close
        const closeElements = modal.querySelectorAll('[data-modal-close]');
        closeElements.forEach(element => {
            element.addEventListener('click', () => this.closeModal(modalId), { once: true });
        });
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Intersection Observer for animations
    initIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
            observer.observe(el);
        });
    }

    // Notification system
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
            <span class="notification-message">${message}</span>
        `;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%) translateY(100px)',
            background: type === 'success' ? '#22c55e' : '#3b82f6',
            color: '#fff',
            padding: '1rem 2rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            zIndex: '10000',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => notification.remove(), 400);
        }, 4000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.construoApp = new ConstruoApp();
});

// Add some Easter eggs
document.addEventListener('keydown', (e) => {
    // Konami code detection could go here
    if (e.key === 'c' && e.ctrlKey && e.shiftKey) {
        console.log('%c🏗️ CONSTRUO 2026', 'font-size: 24px; font-weight: bold; color: #ff6b35;');
        console.log('%cBuilding Tomorrow\'s Engineers', 'font-size: 14px; color: #4a90d9;');
    }
});
