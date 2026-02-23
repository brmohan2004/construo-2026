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
        this.initDevelopmentModal();
        this.initCountdown();
    }

    initCountdown() {
        const countdownContainer = document.getElementById('countdown-container');
        if (!countdownContainer) return;

        // Target Date: Feb 28, 2026
        const targetDate = new Date('February 28, 2026 09:00:00').getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                // Expired
                if (this.countdownInterval) clearInterval(this.countdownInterval);
                const label = countdownContainer.querySelector('.countdown-label');
                if (label) label.textContent = "Registration Closed";
                const timer = countdownContainer.querySelector('.countdown-timer');
                if (timer) timer.innerHTML = '<div style="font-size: 1.2rem; font-weight: 700; color: var(--color-danger);">CLOSED</div>';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const updateEl = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val < 10 ? `0${val}` : val;
            };

            updateEl('cd-days', days);
            updateEl('cd-hours', hours);
            updateEl('cd-minutes', minutes);
            updateEl('cd-seconds', seconds);
        };

        this.countdownInterval = setInterval(updateTimer, 1000);
        updateTimer(); // Initial call
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

        // Listen for background updates
        window.addEventListener('construo-data-refreshed', (e) => {
            console.log('Data refreshed from background, updating UI...');
            const { siteConfig, events, timeline, speakers, sponsors, organizers } = e.detail;
            this.updateUI({ siteConfig, events, timeline, speakers, sponsors, organizers });
        });
    }

    updateUI({ siteConfig, events, timeline, speakers, sponsors, organizers }) {
        if (siteConfig && siteConfig.settings) {
            this.updateSettingsUI(siteConfig.settings);
            if (siteConfig.settings.sections) {
                this.updateSectionsUI(siteConfig.settings.sections);
            }
        }
        if (siteConfig && siteConfig.hero) this.updateHeroUI(siteConfig.hero);
        if (siteConfig && siteConfig.about) this.updateAboutUI(siteConfig.about);
        if (events) this.updateEventsUI(events);
        if (timeline) this.updateTimelineUI(timeline);
        if (speakers) this.updateSpeakersUI(speakers);
        if (sponsors) {
            this.sponsorsRaw = sponsors;
            const sponsorsObj = this.convertSponsorsData({ tiers: [{ id: 'platinum' }, { id: 'gold' }, { id: 'silver' }, { id: 'bronze' }] }) || {};
            // Re-filtering manually since convertSponsorsData expects different structure sometimes
            const sObj = {
                platinum: sponsors.filter(s => s.tier_id === 'platinum'),
                gold: sponsors.filter(s => s.tier_id === 'gold'),
                silver: sponsors.filter(s => s.tier_id === 'silver'),
                bronze: sponsors.filter(s => s.tier_id === 'bronze')
            };
            this.updateSponsorsUI(sObj);
        }
        if (siteConfig && siteConfig.venue) this.updateVenueUI(siteConfig.venue);
        if (siteConfig && siteConfig.footer) this.updateFooterUI(siteConfig.footer);
        if (organizers) {
            this.organizersRaw = organizers;
            const categories = [
                { id: 'faculty', name: 'Faculty', members: organizers.filter(o => o.category === 'faculty') },
                { id: 'student', name: 'Student', members: organizers.filter(o => o.category === 'student') },
                { id: 'organizing', name: 'Organizing', members: organizers.filter(o => o.category === 'organizing') }
            ];
            this.updateOrganizersUI({ organizers, categories });
        }
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
            if (!dataLoader) {
                console.error('Data loader failed to initialize');
                if (window.construoAnimations && typeof window.construoAnimations.markDataLoaded === 'function') {
                    window.construoAnimations.markDataLoaded();
                }
                return;
            }

            // Add a timeout to the data fetch to prevent hanging forever
            const fetchDataWithTimeout = async () => {
                return Promise.race([
                    dataLoader.loadAll(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Data fetch timeout')), 30000))
                ]);
            };

            const { siteConfig, events, timeline, speakers, sponsors, organizers } = await fetchDataWithTimeout();

            // Update Preloader appearance with loaded settings
            if (siteConfig && siteConfig.settings && window.construoAnimations) {
                window.construoAnimations.updatePreloader(siteConfig.settings);
            }

            // Update all UI components using the centralized method
            this.updateUI({ siteConfig, events, timeline, speakers, sponsors, organizers });

            // Extra logic for Prize Pool Banner (not in generic updateUI)
            if (siteConfig) {
                const prizePool = (siteConfig.events && siteConfig.events.prizePool) || siteConfig.prizePool;
                if (prizePool) {
                    const prizeAmount = document.querySelector('.prize-amount');
                    const prizeSub = document.querySelector('.prize-sub');
                    if (prizeAmount) prizeAmount.textContent = `₹${prizePool.amount || '50,000+'}`;
                    if (prizeSub) prizeSub.textContent = prizePool.subtitle || 'Certificates for all participants';
                }
            }

            // Extra logic for Sponsor Connect Button
            if (siteConfig && siteConfig.sponsors && siteConfig.sponsors.email) {
                const sponsorBtn = document.querySelector('.sponsor-contact-btn');
                if (sponsorBtn) {
                    sponsorBtn.href = `mailto:${siteConfig.sponsors.email}?subject=Sponsorship%20Inquiry%20for%20CONSTRUO%202026`;
                    sponsorBtn.target = '_self';
                }
            }

            console.log('Initial data loaded successfully from Supabase');

            // Signal preloader to finish
            if (window.construoAnimations && typeof window.construoAnimations.markDataLoaded === 'function') {
                window.construoAnimations.markDataLoaded();
            }
        } catch (err) {
            console.error('Failed to load initial data from Supabase:', err);
            // Also unblock on error so user isn't stuck
            if (window.construoAnimations && typeof window.construoAnimations.markDataLoaded === 'function') {
                window.construoAnimations.markDataLoaded();
            }
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

                // Check if we need to scroll (more than 2 cards typically fills the mobile viewport)
                if (members.length <= 2) {
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
                <div class="organizer-frame">
                    <div class="organizer-image">
                        ${image ? `<img src="${image}" alt="${name}">` : `<div class="image-placeholder"><span>${name.charAt(0)}</span></div>`}
                    </div>
                    <div class="frame-border"></div>
                </div>
                <div class="organizer-content">
                    <h3 class="organizer-name">${name}</h3>
                    ${role ? `<p class="organizer-role">${role}</p>` : ''}
                </div>
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

    updateSettingsUI(settings) {
        if (!settings) return;

        // 1. Update Favicon
        if (settings.faviconUrl) {
            const faviconUrl = this.sanitizeUrl(settings.faviconUrl);
            let favicon = document.querySelector('link[rel="icon"]');
            if (favicon) {
                favicon.href = faviconUrl;
                // If it's not SVG, we should remove the type attribute to let browser detect
                if (!faviconUrl.toLowerCase().endsWith('.svg')) {
                    favicon.removeAttribute('type');
                }
            } else {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                favicon.href = faviconUrl;
                document.head.appendChild(favicon);
            }
        }

        // 2. Update Navbar Logo
        if (settings.logoUrl) {
            const logoUrl = this.sanitizeUrl(settings.logoUrl);
            const logoIcon = document.querySelector('.nav-logo .logo-icon');
            if (logoIcon) {
                logoIcon.innerHTML = `<img src="${logoUrl}" alt="Logo" style="height: 100%; width: auto; object-fit: contain;">`;
                logoIcon.classList.add('has-image');
            }
        }

        // 3. Update Site Name in Nav
        if (settings.siteName) {
            const logoText = document.querySelector('.nav-logo .logo-text');
            if (logoText) {
                logoText.textContent = settings.siteName;
            }
        }
    }

    // --- UI Update Methods ---
    updateSectionsUI(sections) {
        if (!sections || !Array.isArray(sections)) return;

        const container = document.getElementById('smooth-content');
        if (!container) return;

        // Sort sections by order
        const sortedSections = [...sections].sort((a, b) => a.order - b.order);

        sortedSections.forEach(sectionData => {
            const element = document.getElementById(sectionData.id);
            if (element) {
                // Update visibility
                if (sectionData.visible === false) {
                    element.style.display = 'none';
                } else {
                    element.style.display = '';
                }

                // Reorder: Append to container (moves it to end)
                // We do this in the sorted order, so they end up in correct order
                container.appendChild(element);
            }
        });

        // Ensure footer is always last
        const footer = document.getElementById('footer');
        if (footer) {
            container.appendChild(footer);
        }

        // Refresh ScrollTrigger as positions changed
        if (window.ScrollTrigger) {
            setTimeout(() => window.ScrollTrigger.refresh(), 100);
        }
    }

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

            // Resolve image source
            const imgSource = event.image || event.logo || '';
            const hasImage = imgSource && (imgSource.length > 4 || imgSource.includes('/'));

            // Background: real image or gradient fallback
            const bgStyle = hasImage
                ? `background-image: url('${imgSource}'); background-size: cover; background-position: center;`
                : `background: var(--card-fallback-bg, linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%));`;

            // Emoji icon when no real image
            const emojiIcon = (!hasImage && imgSource && imgSource.length <= 4)
                ? `<div class="event-card-emoji">${imgSource}</div>`
                : (!hasImage ? `<div class="event-card-svg-icon">${this.getEventIcon(event)}</div>` : '');

            // Handle team size safely
            let teamSizeDisplay = 'Individual';
            if (event.teamSize) {
                if (typeof event.teamSize === 'object') {
                    const min = event.teamSize.min || 1;
                    const max = event.teamSize.max || min;
                    teamSizeDisplay = min === max ? `${min} member${min > 1 ? 's' : ''}` : `${min}–${max} members`;
                } else {
                    teamSizeDisplay = event.teamSize;
                }
            }

            // Category badge label
            const badgeLabel = event.category === 'technical' ? '⚙️ Technical'
                : event.category === 'workshop' ? '📘 Workshop'
                    : '🎯 Non-Tech';

            return `
                <div class="event-card ${categoryClass}" data-event-id="${event.id}" style="${bgStyle}">
                    <!-- Top badge -->
                    <div class="event-card-badge">${badgeLabel}</div>

                    <!-- Emoji / SVG fallback centred on card when no image -->
                    ${emojiIcon}

                    <!-- Bottom overlay: info + action -->
                    <div class="event-card-overlay">
                        <button class="event-card-trigger" type="button">
                            <h4 class="event-name">${event.name}</h4>
                            <span class="event-type">👥 ${teamSizeDisplay}</span>
                        </button>
                        <a href="#register" class="event-register-btn">Register →</a>
                    </div>
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

        // Attach event listeners for details popup (Whole card clickable, but respects drag)
        document.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Prevent default if it's a register button (let it propagate naturally or handle it)
                if (e.target.closest('.event-register-btn')) return;

                // Stop if we were dragging (handled by isDragging flag controlled in initMobileEventCarousels)
                if (card.dataset.isDragging === 'true') {
                    // Reset flag
                    card.dataset.isDragging = 'false';
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                e.preventDefault();
                const eventId = card.getAttribute('data-event-id');
                this.showEventDetail(eventId);
            });
        });

        // Re-initialize hover effects for new cards
        this.initCustomCursor();

        // Set up mobile carousel UX (drag + dots)
        this.initMobileEventCarousels();
    }

    initMobileEventCarousels() {
        if (window.innerWidth > 768) return; // Desktop — nothing to do

        const AUTO_SCROLL_INTERVAL = 3000; // ms between auto-advances
        const RESUME_AFTER_IDLE = 4000; // ms after user interaction before resuming

        document.querySelectorAll('.events-grid').forEach(grid => {
            // cleanup existing controller if present
            if (grid.carouselController) {
                grid.carouselController.destroy();
            }

            const cards = grid.querySelectorAll('.event-card');
            if (cards.length === 0) return;

            const category = grid.closest('.event-category');

            // ── 1. Dot indicators ──────────────────────────────────────
            let dots = [];
            if (category) {
                const oldDots = category.querySelector('.events-carousel-dots');
                if (oldDots) oldDots.remove();

                const dotsEl = document.createElement('div');
                dotsEl.className = 'events-carousel-dots';
                cards.forEach((_, i) => {
                    const dot = document.createElement('span');
                    dot.className = 'dot' + (i === 0 ? ' active' : '');
                    dotsEl.appendChild(dot);
                });
                category.appendChild(dotsEl);
                dots = Array.from(dotsEl.querySelectorAll('.dot'));
            }

            const getCardWidth = () => (cards[0] ? cards[0].offsetWidth + 12 : 300); // 12 = gap
            const getCardIndex = () => Math.round(grid.scrollLeft / getCardWidth());

            // Visual update function (3D effect)
            const updateVisuals = () => {
                const idx = getCardIndex();
                dots.forEach((d, i) => d.classList.toggle('active', i === idx));

                const containerCenter = grid.scrollLeft + (grid.offsetWidth / 2);
                const cardWidth = getCardWidth();

                cards.forEach(card => {
                    const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
                    const dist = cardCenter - containerCenter;
                    const normDist = dist / cardWidth;
                    const absNormDist = Math.abs(normDist);

                    // "Below" effect
                    const scale = Math.max(0.9, 1 - (absNormDist * 0.1));
                    const translateY = Math.min(40, absNormDist * 20);

                    card.style.transform = `translateY(${translateY}px) scale(${scale})`;
                    card.style.opacity = Math.max(0.5, 1 - (absNormDist * 0.4));
                });
            };

            // Main scroll listener
            const scrollHandler = () => window.requestAnimationFrame(updateVisuals);
            grid.addEventListener('scroll', scrollHandler, { passive: true });

            // Initial call
            setTimeout(updateVisuals, 100);

            // ── 2. Auto-scroll logic ───────────────────────────────────
            let playing = true;
            let timer = null;
            let idleTimer = null;

            const scrollToCard = (idx) => {
                const clampedIdx = Math.max(0, Math.min(idx, cards.length - 1));
                grid.scrollTo({ left: clampedIdx * getCardWidth(), behavior: 'smooth' });
            };

            const advance = () => {
                const currentIdx = getCardIndex();
                const next = (currentIdx + 1) % cards.length;

                // If we wrapped around to 0, and we were at the end, snap vs scroll?
                // Smooth scroll to 0 works fine usually.
                scrollToCard(next);
            };

            const startAuto = () => {
                if (timer) clearInterval(timer);
                timer = setInterval(advance, AUTO_SCROLL_INTERVAL);
            };

            const stopAuto = () => {
                if (timer) { clearInterval(timer); timer = null; }
            };

            const pauseTemporarily = () => {
                if (!playing) return;
                stopAuto();
                if (idleTimer) clearTimeout(idleTimer);
                idleTimer = setTimeout(() => {
                    // Only resume if still playing and document is visible
                    if (playing && !document.hidden) startAuto();
                }, RESUME_AFTER_IDLE);
            };

            // Start immediately
            startAuto();

            // ── 3. Interaction & Drag Detection ────────────────────────
            let isDown = false, startX = 0, scrollStart = 0;
            let dragThreshold = 5; // px
            let hasMoved = false;

            const touchStart = () => {
                pauseTemporarily();
                hasMoved = false;
            };

            const touchMove = () => { hasMoved = true; }; // Simple approximation

            const mouseDown = (e) => {
                isDown = true;
                hasMoved = false;
                startX = e.pageX;
                scrollStart = grid.scrollLeft;
                grid.style.scrollSnapType = 'none';
                pauseTemporarily();
            };

            const mouseLeave = () => {
                isDown = false;
                grid.style.scrollSnapType = 'x mandatory';
            };

            const mouseUp = (e) => {
                isDown = false;
                grid.style.scrollSnapType = 'x mandatory';

                // Check if it was a drag or a click
                if (Math.abs(e.pageX - startX) > dragThreshold) {
                    // It was a drag
                    hasMoved = true;
                } else {
                    hasMoved = false;
                }

                // Mark cards as dragging if moved, so click listener can ignore
                cards.forEach(c => c.dataset.isDragging = hasMoved ? 'true' : 'false');
            };

            const mouseMove = (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX;
                const walk = (x - startX);
                grid.scrollLeft = scrollStart - walk;

                if (Math.abs(walk) > dragThreshold) {
                    hasMoved = true;
                    // Proactively mark cards to prevent click during drag
                    cards.forEach(c => c.dataset.isDragging = 'true');
                }
            };

            // Attach interaction listeners
            grid.addEventListener('touchstart', touchStart, { passive: true });
            grid.addEventListener('touchmove', touchMove, { passive: true });

            // For Touchend, we rely on the click listener's 'isDragging' check? 
            // Actually touch scrolling is handled by browser native, so 'click' fires after.
            // But if native scroll happened, browser usually cancels click.
            // However, we want to update the 'playing' state on touch.
            grid.addEventListener('touchend', pauseTemporarily, { passive: true });

            // Mouse events
            grid.addEventListener('mousedown', mouseDown);
            grid.addEventListener('mouseleave', mouseLeave);
            grid.addEventListener('mouseup', mouseUp);
            grid.addEventListener('mousemove', mouseMove);


            // ── 4. Pause/Play Button ───────────────────────────────────
            const oldBtn = category && category.querySelector('.carousel-pause-btn');
            if (oldBtn) oldBtn.remove();

            const pauseBtn = document.createElement('button');
            pauseBtn.className = 'carousel-pause-btn';
            pauseBtn.setAttribute('aria-label', 'Pause auto-scroll');
            pauseBtn.innerHTML = `
                <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                    <rect x="5" y="4" width="4" height="16" rx="1"/>
                    <rect x="15" y="4" width="4" height="16" rx="1"/>
                </svg>
                <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" width="10" height="10" style="display:none;">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
            `;

            const dotsRow = category && category.querySelector('.events-carousel-dots');
            if (dotsRow) dotsRow.appendChild(pauseBtn);
            else if (category) category.appendChild(pauseBtn);

            const togglePause = (e) => {
                e.stopPropagation(); // Don't trigger card click
                playing = !playing;
                const pauseSvg = pauseBtn.querySelector('.icon-pause');
                const playSvg = pauseBtn.querySelector('.icon-play');

                if (playing) {
                    startAuto();
                    pauseBtn.setAttribute('aria-label', 'Pause auto-scroll');
                    pauseSvg.style.display = '';
                    playSvg.style.display = 'none';
                    pauseBtn.classList.remove('paused');
                } else {
                    stopAuto();
                    if (idleTimer) clearTimeout(idleTimer);
                    pauseBtn.setAttribute('aria-label', 'Resume auto-scroll');
                    pauseSvg.style.display = 'none';
                    playSvg.style.display = '';
                    pauseBtn.classList.add('paused');
                }
            };
            pauseBtn.addEventListener('click', togglePause);

            // Visibility handling
            const visHandler = () => {
                if (document.hidden) stopAuto();
                else if (playing) startAuto();
            };
            document.addEventListener('visibilitychange', visHandler);

            // ── 5. CLEANUP CONTROLLER ─────────────────────────────────
            // Attach a destroy method to the grid element so we can call it next time
            grid.carouselController = {
                destroy: () => {
                    stopAuto();
                    if (idleTimer) clearTimeout(idleTimer);
                    grid.removeEventListener('scroll', scrollHandler);
                    grid.removeEventListener('touchstart', touchStart);
                    grid.removeEventListener('touchmove', touchMove);
                    grid.removeEventListener('touchend', pauseTemporarily);
                    grid.removeEventListener('mousedown', mouseDown);
                    grid.removeEventListener('mouseleave', mouseLeave);
                    grid.removeEventListener('mouseup', mouseUp);
                    grid.removeEventListener('mousemove', mouseMove);
                    document.removeEventListener('visibilitychange', visHandler);
                    pauseBtn.remove();
                    if (dotsRow) dotsRow.remove(); // Removes the dots we created
                }
            };
        });
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
                        <span class="detail-value">
                            ${(() => {
                if (!event.prizeMoney) return 'TBD';
                const prizes = [];
                if (event.prizeMoney.first) prizes.push(`1st: ₹${event.prizeMoney.first}`);
                if (event.prizeMoney.second) prizes.push(`2nd: ₹${event.prizeMoney.second}`);
                if (event.prizeMoney.third) prizes.push(`3rd: ₹${event.prizeMoney.third}`);
                return prizes.length > 0 ? prizes.join(' | ') : 'TBD';
            })()}
                        </span>
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

            // Add Instruction if exists
            if (field.instruction && field.showInstruction) {
                const instr = document.createElement('p');
                instr.className = 'field-instruction';
                instr.style.fontSize = '0.75rem';
                instr.style.color = 'rgba(255, 255, 255, 0.6)';
                instr.style.marginTop = '0.5rem';
                instr.style.marginBottom = '0';
                instr.style.fontStyle = 'italic';
                instr.style.lineHeight = '1.4';
                instr.style.whiteSpace = 'pre-line';
                instr.textContent = field.instruction;
                formGroup.appendChild(instr);
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

                // Close modal
                self.closeModal('modal-register');
                const regNum = result.registration_number || result.registrationNumber || 'Success';

                // --- Success Modal with WhatsApp Links ---
                try {
                    // 1. Identify selected events and get their links
                    let whatsappLinks = [];
                    const allEvents = await dataLoader.getEvents(); // Use cached or fresh
                    const values = Object.values(data).flat();

                    console.log('--- Register Success Debug ---');
                    console.log('Form Values:', values);
                    console.log('All Events:', allEvents.map(e => ({ name: e.name, id: e.id, link: e.registrationLink })));

                    const normalize = s => String(s).trim().toLowerCase();

                    if (allEvents && allEvents.length > 0) {
                        values.forEach(val => {
                            if (!val) return;

                            const nVal = normalize(val);
                            // TYPO FIX: Handle "papper" -> "paper" mismatch specifically
                            const cleanVal = nVal.replace('papper', 'paper');

                            // Try multiple matching strategies
                            let match = allEvents.find(e => {
                                const eName = normalize(e.name);
                                const eId = normalize(e.id);
                                return eName === nVal || eId === nVal || eName === cleanVal;
                            });

                            // Fallback 1: Form value contains Event Name
                            if (!match) {
                                match = allEvents.find(e => {
                                    const eName = normalize(e.name);
                                    return nVal.includes(eName) || cleanVal.includes(eName);
                                });
                            }

                            // Fallback 2: Event Name contains Form value (e.g. Form: "Paper Presentation", DB: "Paper Presentation (Civil)")
                            // Constraint: nVal should be reasonably long to avoid matching "yes", "no", "active" etc.
                            if (!match && nVal.length > 4) {
                                match = allEvents.find(e => normalize(e.name).includes(nVal));
                            }

                            if (match) {
                                console.log('Matched Event:', match.name, 'Link:', match.registrationLink);
                                if (match.registrationLink) {
                                    // Avoid duplicates
                                    if (!whatsappLinks.some(l => l.name === match.name)) {
                                        whatsappLinks.push({ name: match.name, link: match.registrationLink });
                                    }
                                }
                            }
                        });
                    }
                    console.log('Final WhatsApp Links:', whatsappLinks);
                    console.log('------------------------------');

                    // 2. Remove existing success modal if any
                    const existingModal = document.getElementById('modal-success');
                    if (existingModal) existingModal.remove();

                    // 3. Create Modal HTML matching existing structure
                    const modalHtml = `
                    <div id="modal-success" class="modal" aria-hidden="true" style="z-index: 10002;">
                        <div class="modal-backdrop" data-modal-close></div>
                        <div class="modal-dialog" style="max-width: 450px; text-align: center;">
                            <button class="modal-close" data-modal-close>&times;</button>
                            <div class="modal-body" style="padding: 1rem;">
                                <div style="font-size: 3.5rem; margin-bottom: 1rem; line-height: 1;">🎉</div>
                                <h2 style="margin-bottom: 0.5rem; color: var(--color-text);">Registration Successful!</h2>
                                <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">Thank you for registering! You are now confirmed.</p>
                                
                                <div style="background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem;">
                                    <label style="display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.5rem;">Registration Number</label>
                                    <div style="font-size: 1.75rem; font-weight: 700; color: var(--color-accent); font-family: monospace; user-select: all;">${regNum}</div>
                                </div>
                                
                                ${whatsappLinks.length > 0 ? `
                                    <div style="text-align: left; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed rgba(255,255,255,0.1);">
                                        <h3 style="font-size: 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--color-text);">
                                            <span style="color: #25D366;">📱</span> Join WhatsApp Groups
                                        </h3>
                                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                            ${whatsappLinks.map(l => `
                                                <a href="${l.link}" target="_blank" rel="noopener noreferrer" class="btn" style="width: 100%; justify-content: space-between; padding: 0.75rem 1rem; border: 1px solid rgba(37, 211, 102, 0.3); background: rgba(37, 211, 102, 0.1); color: var(--color-text); text-decoration: none; display: flex; align-items: center; border-radius: 6px; pointer-events: auto; position: relative; z-index: 10;">
                                                    <span style="font-weight: 500;">${l.name}</span>
                                                    <span style="font-size: 0.75rem; color: #25D366; display: flex; align-items: center; gap: 4px; font-weight: bold;">
                                                        JOIN &rarr;
                                                    </span>
                                                </a>
                                            `).join('')}
                                        </div>
                                        <p style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.75rem; text-align: center;">Click to join the official groups for updates.</p>
                                    </div>
                                ` : ''}

                                <div style="margin-top: 2rem;">
                                    <button class="btn btn-primary" data-modal-close style="min-width: 120px;">Done</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;

                    // 4. Inject
                    const temp = document.createElement('div');
                    temp.innerHTML = modalHtml;
                    const matchModal = temp.firstElementChild;
                    document.body.appendChild(matchModal);

                    // 5. Open it using existing logic or manually
                    setTimeout(() => {
                        self.openModal('modal-success');

                        // Automatically open the first WhatsApp link if available
                        if (whatsappLinks.length > 0) {
                            try {
                                const firstLink = whatsappLinks[0].link;
                                window.open(firstLink, '_blank');
                            } catch (err) {
                                console.warn('Auto-opening WhatsApp link blocked:', err);
                            }
                        }

                        // Attach clean up on close
                        const closeHandler = () => {
                            setTimeout(() => { if (matchModal.parentNode) matchModal.remove(); }, 500);
                        };
                        matchModal.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', closeHandler));
                    }, 50);

                } catch (e) {
                    console.error('Error showing success modal:', e);
                    // Fallback
                    self.showNotification(`Registration successful! ID: ${regNum}`, 'success');
                }

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

    // Development Request Modal
    initDevelopmentModal() {
        const devBtn = document.querySelector('.dev-request-btn');
        if (devBtn) {
            devBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Check if openModal exists (it should as it's part of the class)
                if (typeof this.openModal === 'function') {
                    this.openModal('modal-development');
                } else {
                    const modal = document.getElementById('modal-development');
                    if (modal) {
                        modal.classList.add('open');
                        modal.setAttribute('aria-hidden', 'false');
                    }
                }
            });
        }

        const devForm = document.getElementById('development-form');
        if (devForm) {
            devForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const name = document.getElementById('dev-name').value;
                const phone = document.getElementById('dev-phone').value;
                const email = document.getElementById('dev-email').value;
                const service = document.getElementById('dev-service').value;
                const message = document.getElementById('dev-message').value;

                const subject = `Development Request: ${service} - ${name}`;
                const fullBody = `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nService: ${service}\nMessage: ${message}`;

                const safeMailto = `mailto:qynta2025@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;

                window.location.href = safeMailto;

                // Show success and close
                if (typeof this.showNotification === 'function') {
                    this.showNotification('Redirecting to email client...', 'info');
                } else {
                    alert('Redirecting to email client...');
                }

                setTimeout(() => {
                    if (typeof this.closeModal === 'function') {
                        this.closeModal('modal-development');
                    } else {
                        const modal = document.getElementById('modal-development');
                        if (modal) {
                            modal.classList.remove('open');
                            modal.setAttribute('aria-hidden', 'true');
                        }
                    }
                    devForm.reset();
                }, 1000);
            });
        }
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
