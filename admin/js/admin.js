/**
 * CONSTRUO 2026 - Admin Core Module (Supabase)
 * Main admin panel functionality with Supabase integration
 */

import supabase from './supabase-config.js';
import Auth from './auth.js';

const Admin = {
    config: {
        debounceDelay: 300
    },

    cache: {
        siteConfig: null,
        events: null,
        timeline: null,
        speakers: null,
        sponsors: null,
        registrations: null,
        users: null
    },

    loading: {},

    init() {
        this.checkAuth();
        this.initSidebar();
        this.initTheme();
        this.loadUserInfo();
        this.loadDashboardStats();
        this.bindGlobalEvents();
        this.initLoadingStates();
    },

    async checkAuth() {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.warn('Authentication check failed: no session found');
            await Auth.handleLogout();
            return false;
        }

        return true;
    },

    initSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return; // Exit if no sidebar exists (e.g. builder page)

        const sidebarToggle = document.getElementById('sidebarToggle');
        const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');

        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed && window.innerWidth > 1024) {
            sidebar.classList.add('collapsed');
        }

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
            });
        }

        if (mobileSidebarToggle) {
            mobileSidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!sidebar.contains(e.target) && !mobileSidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        this.setActiveNavLink();
    },

    setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href.includes(currentPage)) {
                link.classList.add('active');
            }
        });
    },

    initTheme() {
        const savedTheme = localStorage.getItem('admin_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('admin_theme', newTheme);
                this.updateThemeIcon(newTheme);
            });
        }
    },

    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const icon = themeToggle.querySelector('svg');
        if (icon) {
            if (theme === 'dark') {
                icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
            } else {
                icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
            }
        }
    },

    async loadUserInfo() {
        const user = await Auth.getCurrentUser();
        if (!user) return;

        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const welcomeName = document.getElementById('welcomeName');

        if (userAvatar) {
            userAvatar.textContent = this.getInitials(user.name);
        }
        if (userName) {
            userName.textContent = user.name;
        }
        if (userRole) {
            userRole.textContent = this.formatRole(user.role);
        }
        if (welcomeName) {
            welcomeName.textContent = user.name.split(' ')[0];
        }
    },

    async loadDashboardStats() {
        // Elements
        const totalRegEl = document.getElementById('totalRegistrations');
        const totalEventsEl = document.getElementById('totalEvents');
        const recentRegTbody = document.getElementById('recentRegistrations');

        if (!totalRegEl) return; // Not on dashboard

        try {
            // 1. Fetch Registrations (Total count + Recent 5)
            // We need created_at for sorting and date display, registration_number/id, and status
            const { data: recentRegs, count: regCount, error: regErr } = await supabase
                .from('registrations')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(0, 4);

            if (regErr) throw regErr;

            // 2. Fetch Events Count
            const { count: eventsCount, error: evtErr } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true });

            if (evtErr) throw evtErr;

            // Update Stats Cards
            if (totalRegEl) totalRegEl.textContent = regCount || 0;
            if (totalEventsEl) totalEventsEl.textContent = eventsCount || 0;

            // Update Recent Registrations Table
            if (recentRegTbody && recentRegs) {
                if (recentRegs.length === 0) {
                    recentRegTbody.innerHTML = '<tr><td colspan="3" class="text-center">No registrations yet</td></tr>';
                } else {
                    recentRegTbody.innerHTML = recentRegs.map(reg => {
                        const date = new Date(reg.created_at);
                        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return `
                        <tr>
                            <td><code>${reg.registration_number || 'N/A'}</code></td>
                            <td>${formattedDate}</td>
                            <td><span class="badge badge-${this.getStatusBadgeColor(reg.status)}">${reg.status}</span></td>
                        </tr>
                    `}).join('');
                }
            }

            console.log('[Admin] Dashboard stats updated dynamically');
        } catch (error) {
            console.error('[Admin] Failed to load dashboard stats:', error);
            if (totalRegEl) totalRegEl.textContent = 'Err';
            if (totalEventsEl) totalEventsEl.textContent = 'Err';
        }
    },

    getStatusBadgeColor(status) {
        switch (status) {
            case 'confirmed': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    },

    getActivityIconColor(action) {
        switch (action) {
            case 'create': return 'success';
            case 'update': return 'info';
            case 'delete': return 'warning'; // or danger
            default: return 'primary';
        }
    },

    getActivityIcon(action) {
        switch (action) {
            case 'create': return '➕';
            case 'update': return '✏️';
            case 'delete': return '🗑️';
            default: return '📝';
        }
    },

    formatActivityTitle(action, section) {
        return `${action.charAt(0).toUpperCase() + action.slice(1)} ${section}`;
    },

    timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    },

    bindGlobalEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.handleLogout());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeModal(e.target);
            }
        });

        window.addEventListener('resize', this.debounce(() => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && window.innerWidth <= 1024) {
                sidebar.classList.remove('collapsed');
            }
        }, 250));
    },

    initLoadingStates() {
        if (!document.getElementById('globalLoader')) {
            const loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-spinner">
                    <div class="spinner"></div>
                    <span class="loader-text">Loading...</span>
                </div>
            `;
            document.body.appendChild(loader);
        }
    },

    // -------------------- SUPABASE DATA METHODS --------------------

    async getSiteConfig() {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('*')
                .eq('config_key', 'main')
                .single();

            if (error) throw error;
            this.cache.siteConfig = data;
            return data;
        } catch (error) {
            console.error('Error fetching site config:', error);
            throw error;
        }
    },

    async updateSiteConfig(section, sectionData) {
        try {
            const user = await Auth.getCurrentUser();
            const timestamp = new Date().toISOString();

            // Add metadata to the section data
            const dataWithMetadata = {
                ...sectionData,
                updatedAt: timestamp,
                updatedBy: user ? user.username : 'unknown'
            };

            // Build update object - only update the specific JSONB column
            const updateData = {
                [section]: dataWithMetadata,
                updated_at: timestamp
            };

            // Perform update without select to avoid timeout
            const { error: updateError } = await supabase
                .from('site_config')
                .update(updateData)
                .eq('config_key', 'main');

            if (updateError) throw updateError;

            // Log activity (don't await to avoid blocking)
            this.logActivity('update', section, `Updated ${section} section`).catch(e => 
                console.warn('Failed to log activity:', e)
            );

            // Invalidate cache
            this.cache.siteConfig = null;

            // Return the updated data
            return { [section]: dataWithMetadata };
        } catch (error) {
            console.error('Error updating site config:', error);
            throw error;
        }
    },

    async getEvents() {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.cache.events = data;
            return data;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    },

    async getEvent(id) {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('event_id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching event:', error);
            throw error;
        }
    },

    async createEvent(eventData) {
        try {
            const user = await Auth.getCurrentUser();
            const eventId = eventData.id || `evt_${Date.now()}`;

            const { data, error } = await supabase
                .from('events')
                .insert({
                    event_id: eventId,
                    name: eventData.name,
                    slug: eventData.slug || this.slugify(eventData.name),
                    category: eventData.category,
                    logo: eventData.logo || null,
                    participation: eventData.participation || 'individual',
                    team_size: eventData.teamSize || { min: 1, max: 1 },
                    entry_fee: eventData.entryFee || 0,
                    prize_money: eventData.prizeMoney || { first: 0, second: 0, third: 0 },
                    description: eventData.description || null,
                    rules: eventData.rules || [],
                    materials: eventData.materials || [],
                    certificate: eventData.certificate || false,
                    timeline: eventData.timeline || [],
                    coordinator: eventData.coordinator || {},
                    registration_link: eventData.registrationLink || null,
                    status: eventData.status || 'active',
                    // Added duration field
                    duration: eventData.duration || null,
                    featured: eventData.featured || false,
                    created_by: user ? user.username : null,
                    updated_by: user ? user.username : null
                })
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('create', 'events', `Created event: ${eventData.name}`);
            return data;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },

    async updateEvent(id, eventData) {
        try {
            const user = await Auth.getCurrentUser();

            const { data, error } = await supabase
                .from('events')
                .update({
                    name: eventData.name,
                    slug: eventData.slug,
                    category: eventData.category,
                    logo: eventData.logo,
                    participation: eventData.participation,
                    team_size: eventData.teamSize,
                    entry_fee: eventData.entryFee,
                    prize_money: eventData.prizeMoney,
                    description: eventData.description,
                    rules: eventData.rules,
                    materials: eventData.materials,
                    certificate: eventData.certificate,
                    timeline: eventData.timeline,
                    coordinator: eventData.coordinator,
                    registration_link: eventData.registrationLink,
                    status: eventData.status,
                    // Added duration field
                    duration: eventData.duration,
                    featured: eventData.featured,
                    updated_by: user ? user.username : null
                })
                .eq('event_id', id)
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('update', 'events', `Updated event: ${eventData.name}`);
            return data;
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    },

    async deleteEvent(id) {
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('event_id', id);

            if (error) throw error;

            await this.logActivity('delete', 'events', `Deleted event: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    },

    async getSpeakers() {
        try {
            const { data, error } = await supabase
                .from('speakers')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.speakers = data;
            return data;
        } catch (error) {
            console.error('Error fetching speakers:', error);
            throw error;
        }
    },

    async createSpeaker(speakerData) {
        try {
            const user = await Auth.getCurrentUser();
            const speakerId = speakerData.id || `spk_${Date.now()}`;

            const { data, error } = await supabase
                .from('speakers')
                .insert({
                    speaker_id: speakerId,
                    name: speakerData.name,
                    title: speakerData.title || null,
                    organization: speakerData.organization || null,
                    photo: speakerData.photo || null,
                    image: speakerData.image || speakerData.photo || null,
                    bio: speakerData.bio || null,
                    social: speakerData.social || {},
                    sessions: speakerData.sessions || [],
                    featured: speakerData.featured || false,
                    order: speakerData.order || 0,
                    status: speakerData.status || 'active',
                    created_by: user ? user.username : null,
                    updated_by: user ? user.username : null
                })
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('create', 'speakers', `Created speaker: ${speakerData.name}`);
            return data;
        } catch (error) {
            console.error('Error creating speaker:', error);
            throw error;
        }
    },

    async updateSpeaker(id, speakerData) {
        try {
            const user = await Auth.getCurrentUser();

            const { data, error } = await supabase
                .from('speakers')
                .update({
                    name: speakerData.name,
                    title: speakerData.title,
                    organization: speakerData.organization,
                    photo: speakerData.photo,
                    image: speakerData.image || speakerData.photo,
                    bio: speakerData.bio,
                    social: speakerData.social,
                    sessions: speakerData.sessions,
                    featured: speakerData.featured,
                    order: speakerData.order,
                    status: speakerData.status,
                    updated_by: user ? user.username : null
                })
                .eq('speaker_id', id)
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('update', 'speakers', `Updated speaker: ${speakerData.name}`);
            return data;
        } catch (error) {
            console.error('Error updating speaker:', error);
            throw error;
        }
    },

    async deleteSpeaker(id) {
        try {
            const { error } = await supabase
                .from('speakers')
                .delete()
                .eq('speaker_id', id);

            if (error) throw error;

            await this.logActivity('delete', 'speakers', `Deleted speaker: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting speaker:', error);
            throw error;
        }
    },

    async getSponsors() {
        try {
            const { data, error } = await supabase
                .from('sponsors')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.sponsors = data;
            return data;
        } catch (error) {
            console.error('Error fetching sponsors:', error);
            throw error;
        }
    },

    async createSponsor(sponsorData) {
        try {
            const user = await Auth.getCurrentUser();
            const sponsorId = sponsorData.id || `spo_${Date.now()}`;

            const { data, error } = await supabase
                .from('sponsors')
                .insert({
                    sponsor_id: sponsorId,
                    tier_id: sponsorData.tierId,
                    name: sponsorData.name,
                    logo: sponsorData.logo || null,
                    website: sponsorData.website || null,
                    description: sponsorData.description || null,
                    order: sponsorData.order || 0,
                    status: sponsorData.status || 'active',
                    created_by: user ? user.username : null,
                    updated_by: user ? user.username : null
                })
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('create', 'sponsors', `Created sponsor: ${sponsorData.name}`);
            return data;
        } catch (error) {
            console.error('Error creating sponsor:', error);
            throw error;
        }
    },

    async updateSponsor(id, sponsorData) {
        try {
            const user = await Auth.getCurrentUser();

            const { data, error } = await supabase
                .from('sponsors')
                .update({
                    tier_id: sponsorData.tierId,
                    name: sponsorData.name,
                    logo: sponsorData.logo,
                    website: sponsorData.website,
                    description: sponsorData.description,
                    order: sponsorData.order,
                    status: sponsorData.status,
                    updated_by: user ? user.username : null
                })
                .eq('sponsor_id', id)
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('update', 'sponsors', `Updated sponsor: ${sponsorData.name}`);
            return data;
        } catch (error) {
            console.error('Error updating sponsor:', error);
            throw error;
        }
    },

    async deleteSponsor(id) {
        try {
            const { error } = await supabase
                .from('sponsors')
                .delete()
                .eq('sponsor_id', id);

            if (error) throw error;

            await this.logActivity('delete', 'sponsors', `Deleted sponsor: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting sponsor:', error);
            throw error;
        }
    },

    async getTimeline() {
        try {
            const { data, error } = await supabase
                .from('timeline_days')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.timeline = data;
            return data;
        } catch (error) {
            console.error('Error fetching timeline:', error);
            throw error;
        }
    },

    async createTimelineDay(dayData) {
        try {
            const dayId = dayData.id || `day_${Date.now()}`;

            const { data, error } = await supabase
                .from('timeline_days')
                .insert({
                    day_id: dayId,
                    date: dayData.date,
                    title: dayData.title,
                    sessions: dayData.sessions || [],
                    order: dayData.order || 0
                })
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('create', 'timeline', `Created timeline day: ${dayData.title}`);
            return data;
        } catch (error) {
            console.error('Error creating timeline day:', error);
            throw error;
        }
    },

    async updateTimelineDay(id, dayData) {
        try {
            const { data, error } = await supabase
                .from('timeline_days')
                .update({
                    date: dayData.date,
                    title: dayData.title,
                    sessions: dayData.sessions,
                    order: dayData.order
                })
                .eq('day_id', id)
                .select();

            if (error) throw error;

            // If no data returned, it might mean the row wasn't found or just no return (though select() should return).
            // PGRST116 "The result contains 0 rows" happens with .single() if no row matches.
            // Without .single(), we get an empty array if no match.
            const updated = (data && data.length > 0) ? data[0] : null;

            if (updated) {
                await this.logActivity('update', 'timeline', `Updated timeline day: ${dayData.title}`);
                return updated;
            }
            return null;
        } catch (error) {
            console.error('Error updating timeline day:', error);
            throw error;
        }
    },

    async deleteTimelineDay(id) {
        try {
            const { error } = await supabase
                .from('timeline_days')
                .delete()
                .eq('day_id', id);

            if (error) throw error;

            await this.logActivity('delete', 'timeline', `Deleted timeline day: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting timeline day:', error);
            throw error;
        }
    },

    async getOrganizers() {
        try {
            const { data, error } = await supabase
                .from('organizers')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching organizers:', error);
            throw error;
        }
    },

    async createOrganizer(organizerData) {
        try {
            const user = await Auth.getCurrentUser();
            const organizerId = organizerData.id || `org_${Date.now()}`;

            const { data, error } = await supabase
                .from('organizers')
                .insert({
                    organizer_id: organizerId,
                    name: organizerData.name,
                    role: organizerData.role,
                    designation: organizerData.designation || null,
                    department: organizerData.department || null,
                    organization: organizerData.organization || null,
                    image: organizerData.image || null,
                    email: organizerData.email || null,
                    phone: organizerData.phone || null,
                    social: organizerData.social || {},
                    category: organizerData.category || 'organizing',
                    order: organizerData.order || 0,
                    featured: organizerData.featured || false,
                    status: organizerData.status || 'active',
                    created_by: user ? user.username : null,
                    updated_by: user ? user.username : null
                })
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('create', 'organizers', `Created organizer: ${organizerData.name}`);
            return data;
        } catch (error) {
            console.error('Error creating organizer:', error);
            throw error;
        }
    },

    async updateOrganizer(id, organizerData) {
        if (!id) throw new Error('Cannot update organizer without ID');
        console.log('Admin: Updating organizer', id);

        try {
            const user = await Auth.getCurrentUser();

            const { data, error } = await supabase
                .from('organizers')
                .update({
                    name: organizerData.name,
                    role: organizerData.role,
                    designation: organizerData.designation,
                    department: organizerData.department,
                    organization: organizerData.organization,
                    image: organizerData.image,
                    email: organizerData.email,
                    phone: organizerData.phone,
                    social: organizerData.social,
                    category: organizerData.category,
                    order: organizerData.order,
                    featured: organizerData.featured,
                    status: organizerData.status,
                    updated_by: user ? user.username : null
                })
                .eq('organizer_id', id)
                .select()
                .maybeSingle();

            if (error) throw error;

            await this.logActivity('update', 'organizers', `Updated organizer: ${organizerData.name}`);
            return data;
        } catch (error) {
            console.error('Error updating organizer:', error);
            throw error;
        }
    },

    async deleteOrganizer(id) {
        try {
            const { error } = await supabase
                .from('organizers')
                .delete()
                .eq('organizer_id', id);

            if (error) throw error;

            await this.logActivity('delete', 'organizers', `Deleted organizer: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting organizer:', error);
            throw error;
        }
    },

    async getRegistrations() {
        try {
            const { data, error } = await supabase
                .from('registrations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.cache.registrations = data;

            const stats = {
                total: data.length,
                pending: data.filter(s => s.status === 'pending').length,
                confirmed: data.filter(s => s.status === 'confirmed').length,
                cancelled: data.filter(s => s.status === 'cancelled').length
            };

            return {
                registrations: data.map(s => ({
                    ...s,
                    registrationId: s.registration_id,
                    registrationNumber: s.registration_number,
                    college: s.college || ''
                })),
                stats
            };
        } catch (error) {
            console.error('Error fetching registrations:', error);
            throw error;
        }
    },

    async updateRegistration(id, regData) {
        try {
            const user = await Auth.getCurrentUser();

            const updatePayload = {
                updated_by: user ? user.username : null
            };
            
            if (regData.status !== undefined) updatePayload.status = regData.status;
            if (regData.payment !== undefined) updatePayload.payment = regData.payment;
            if (regData.events !== undefined) updatePayload.events = regData.events;
            if (regData.participant !== undefined) updatePayload.participant = regData.participant;
            if (regData.data !== undefined) updatePayload.data = regData.data;

            const { data, error } = await supabase
                .from('registrations')
                .update(updatePayload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('update', 'registrations', `Updated registration: ${id}`);
            return data;
        } catch (error) {
            console.error('Error updating registration:', error);
            throw error;
        }
    },

    async deleteRegistration(id) {
        try {
            const { error } = await supabase
                .from('registrations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.logActivity('delete', 'registrations', `Deleted registration: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting registration:', error);
            throw error;
        }
    },

    // -------------------- REGISTRATION FORMS METHODS --------------------

    async getRegistrationForms() {
        try {
            const { data, error } = await supabase
                .from('registration_forms')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formsWithCount = await Promise.all(data.map(async (form) => {
                const { count, error: countError } = await supabase
                    .from('registrations')
                    .select('*', { count: 'exact', head: true })
                    .eq('form_id', form.id);
                return {
                    ...form,
                    isActive: form.is_active,
                    updatedAt: form.updated_at,
                    submissionsCount: count || 0
                };
            }));

            return { forms: formsWithCount };
        } catch (error) {
            console.error('Error fetching registration forms:', error);
            throw error;
        }
    },

    async getFormSubmissions(formId) {
        try {
            const { data: form, error: formError } = await supabase
                .from('registration_forms')
                .select('*')
                .eq('id', formId)
                .single();
            if (formError) throw formError;

            const { data: submissions, error: subError } = await supabase
                .from('registrations')
                .select('*')
                .eq('form_id', formId)
                .order('created_at', { ascending: false });
            if (subError) throw subError;

            return {
                form: {
                    ...form,
                    isActive: form.is_active,
                    updatedAt: form.updated_at
                },
                submissions: (submissions || []).map(s => ({
                    ...s,
                    registrationId: s.registration_id,
                    registrationNumber: s.registration_number,
                    college: s.college || '' // Ensure college exists
                })),
                stats: {
                    total: submissions.length,
                    pending: submissions.filter(s => s.status === 'pending').length,
                    confirmed: submissions.filter(s => s.status === 'confirmed').length,
                    cancelled: submissions.filter(s => s.status === 'cancelled').length
                }
            };
        } catch (error) {
            console.error('Error fetching form submissions:', error);
            throw error;
        }
    },

    async getRegistrationStats() {
        try {
            const { data: forms } = await supabase.from('registration_forms').select('id');
            const { data: subs } = await supabase.from('registrations').select('status');

            return {
                totalForms: forms?.length || 0,
                totalSubmissions: subs?.length || 0,
                pendingSubmissions: subs?.filter(s => s.status === 'pending').length || 0,
                confirmedSubmissions: subs?.filter(s => s.status === 'confirmed').length || 0,
                cancelledSubmissions: subs?.filter(s => s.status === 'cancelled').length || 0
            };
        } catch (error) {
            console.error('Error fetching registration stats:', error);
            throw error;
        }
    },

    // -------------------- USER MANAGEMENT METHODS --------------------

    async getUsers() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.cache.users = data;
            return data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    async createUser(userData) {
        try {
            // Note: Creating auth users from frontend without service role is limited.
            // We use signUp which may affect the current session if not handled correctly.
            // Ideally, an Edge Function should be used for this.
            // For now, we'll try to insert into profiles if the user already exists in auth,
            // or use signUp if it's a new user (warning: this might log the admin out).

            // Checking if user exists in profiles first
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', userData.username)
                .maybeSingle();

            if (existing) throw new Error('Username already exists');

            // If a password and email are provided, we try to create an auth user
            if (userData.password) {
                if (!userData.email) throw new Error('Email is required for new users');

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: userData.email,
                    password: userData.password,
                    options: {
                        data: {
                            username: userData.username,
                            name: userData.name,
                            role: userData.role
                        }
                    }
                });

                if (authError) throw authError;

                // Profile is usually created via trigger or signUp options, 
                // but let's ensure it's there or update it
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        username: userData.username,
                        name: userData.name,
                        role: userData.role,
                        status: userData.status || 'active'
                    })
                    .eq('user_id', authData.user.id);

                // If update failed (maybe no record yet), try insert
                if (profileError) {
                    await supabase.from('profiles').insert({
                        user_id: authData.user.id,
                        username: userData.username,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        status: userData.status || 'active'
                    });
                }
            } else {
                // Just create/update profile
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .insert({
                        username: userData.username,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        status: userData.status || 'active'
                    })
                    .select()
                    .single();

                if (error) throw error;
                return profile;
            }

            await this.logActivity('create', 'users', `Created user: ${userData.username}`);
            return true;
        } catch (error) {
            console.error('Error creating user:', error);
            if (error.status === 429 || error.message?.includes('security purposes')) {
                throw new Error('Security Cooldown: Please wait a few seconds before creating another user.');
            }
            throw error;
        }
    },

    async updateUser(id, userData) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    name: userData.name,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    status: userData.status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('update', 'users', `Updated user: ${userData.username}`);
            return data;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    async deleteUser(id) {
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.logActivity('delete', 'users', `Deleted user: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // -------------------- GENERIC API HELPERS (BACKWARD COMPAT) --------------------

    async apiGet(endpoint) {
        if (endpoint === 'users') return this.getUsers();
        if (endpoint === 'registrations/stats') return this.getRegistrationStats();
        if (endpoint === 'registrations/forms') return this.getRegistrationForms();
        if (endpoint === 'registrations') return this.getRegistrations();
        if (endpoint.startsWith('registrations/forms/') && endpoint.split('/').length === 3) {
            const formId = endpoint.split('/')[2];
            const { data, error } = await supabase.from('registration_forms').select('*').eq('id', formId).single();
            if (error) throw error;
            return data;
        }
        if (endpoint.startsWith('registrations/forms/') && endpoint.endsWith('/submissions')) {
            const formId = endpoint.split('/')[2];
            return this.getFormSubmissions(formId);
        }

        // Fallback for other potential endpoints
        console.warn(`Direct API call to ${endpoint} not fully mapped, trying fetch (likely to fail)`);
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`/api/${endpoint}`, {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        return response.json();
    },

    async apiPost(endpoint, body) {
        if (endpoint === 'users') return this.createUser(body);
        if (endpoint === 'registrations/forms') {
            const { data, error } = await supabase.from('registration_forms').insert({
                ...body,
                form_id: body.form_id || `form_${Date.now()}`,
                created_at: new Date(),
                updated_at: new Date()
            }).select().single();
            if (error) throw error;
            return data;
        }

        if (endpoint.startsWith('registrations/forms/') && endpoint.endsWith('/duplicate')) {
            const formId = endpoint.split('/')[2];
            // Implement duplicate logic
            const { data: original, error: fetchErr } = await supabase.from('registration_forms').select('*').eq('id', formId).single();
            if (fetchErr) throw fetchErr;
            const { data, error } = await supabase.from('registration_forms').insert({
                ...original,
                id: undefined,
                form_id: `form_${Date.now()}`,
                title: `${original.title} (Copy)`,
                created_at: new Date(),
                updated_at: new Date()
            }).select().single();
            if (error) throw error;
            return data;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        return response.json();
    },

    async apiPut(endpoint, body) {
        if (endpoint.startsWith('users/')) {
            const userId = endpoint.split('/')[1];
            return this.updateUser(userId, body);
        }
        if (endpoint.startsWith('registrations/forms/')) {
            const formId = endpoint.split('/')[2];
            if (endpoint.endsWith('/toggle')) {
                const { data: original } = await supabase.from('registration_forms').select('is_active').eq('id', formId).single();
                const newStatus = !original.is_active;

                if (newStatus) {
                    // Activate this form: First deactivate all others
                    await supabase.from('registration_forms').update({ is_active: false }).neq('id', formId);
                }

                const { error } = await supabase.from('registration_forms').update({ is_active: newStatus }).eq('id', formId);
                if (error) throw error;
                return { message: 'Status updated' };
            }
            // Update form
            const { data, error } = await supabase.from('registration_forms').update({
                ...body,
                updated_at: new Date()
            }).eq('id', formId).select().single();
            if (error) throw error;
            return data;
        }

        if (endpoint.startsWith('registrations/submissions/') && endpoint.endsWith('/status')) {
            const subId = endpoint.split('/')[2];
            const { error } = await supabase.from('registrations').update({ status: body.status }).eq('id', subId);
            if (error) throw error;
            return { message: 'Status updated' };
        }

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`/api/${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        return response.json();
    },

    async apiDelete(endpoint) {
        if (endpoint.startsWith('users/')) {
            const userId = endpoint.split('/')[1];
            return this.deleteUser(userId);
        }
        if (endpoint.startsWith('registrations/forms/')) {
            const formId = endpoint.split('/')[2];
            const { error } = await supabase.from('registration_forms').delete().eq('id', formId);
            if (error) throw error;
            return { message: 'Form deleted' };
        }

        if (endpoint.startsWith('registrations/submissions/')) {
            const subId = endpoint.split('/')[2];
            const { error } = await supabase.from('registrations').delete().eq('id', subId);
            if (error) throw error;
            return { message: 'Submission deleted' };
        }

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`/api/${endpoint}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        return response.json();
    },

    async getActivityLogs(limit = 100) {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            throw error;
        }
    },

    async logActivity(action, section, description) {
        try {
            const user = await Auth.getCurrentUser();

            await supabase.from('activity_logs').insert({
                action,
                section,
                description,
                user_id: user ? user.id : null,
                user_ref: user ? user.id : null,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    },

    async uploadFile(bucket, file, path) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = path ? `${path}/${fileName}` : fileName;

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading file:', error);
            if (error.message && error.message.includes('row-level security policy')) {
                console.warn('💡 ACTION REQUIRED: Please run the "fix_sponsors_storage.sql" script in your Supabase SQL Editor to allow file uploads.');
                this.showToast('error', 'Permission Error', 'Storage policies not configured. Check console.');
            }
            throw error;
        }
    },

    async deleteFile(bucket, path) {
        try {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([path]);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    },

    // -------------------- UI UTILITY METHODS --------------------

    showToast(type, title, message) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        container.appendChild(toast);

        // Balanced Timing: longer for errors, shorter for success
        const duration = (type === 'error' || type === 'warning') ? 60000 : 30000;

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 100);
        }, duration);
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    closeAllModals() {
        const modals = document.querySelectorAll('.modal-backdrop.active');
        modals.forEach(modal => this.closeModal(modal));
    },

    showLoader() {
        const loader = document.getElementById('globalLoader');
        if (loader) loader.classList.add('active');
    },

    hideLoader() {
        const loader = document.getElementById('globalLoader');
        if (loader) loader.classList.remove('active');
    },

    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },

    formatRole(role) {
        const roles = {
            superadmin: 'Super Admin',
            admin: 'Administrator',
            moderator: 'Moderator',
            viewer: 'Viewer'
        };
        return roles[role] || role;
    },

    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Prevent Admin.init from running on view-only page to avoid conflicts
    if (!window.location.pathname.includes('registration-view-only')) {
        Admin.init();
    }
});

window.Admin = Admin;
export default Admin;
