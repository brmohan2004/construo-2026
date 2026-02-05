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

            const updateData = {
                [section]: {
                    ...sectionData,
                    updatedAt: timestamp,
                    updatedBy: user ? user.username : 'unknown'
                },
                updated_at: timestamp
            };

            const { data, error } = await supabase
                .from('site_config')
                .update(updateData)
                .eq('config_key', 'main')
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('update', section, `Updated ${section} section`);
            this.cache.siteConfig = data;
            return data;
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
                .select()
                .single();

            if (error) throw error;

            await this.logActivity('update', 'timeline', `Updated timeline day: ${dayData.title}`);
            return data;
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
                .single();

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
            return data;
        } catch (error) {
            console.error('Error fetching registrations:', error);
            throw error;
        }
    },

    async updateRegistration(id, regData) {
        try {
            const user = await Auth.getCurrentUser();

            const { data, error } = await supabase
                .from('registrations')
                .update({
                    status: regData.status,
                    payment: regData.payment,
                    updated_by: user ? user.username : null
                })
                .eq('registration_id', id)
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
                .eq('registration_id', id);

            if (error) throw error;

            await this.logActivity('delete', 'registrations', `Deleted registration: ${id}`);
            return true;
        } catch (error) {
            console.error('Error deleting registration:', error);
            throw error;
        }
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

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
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
    Admin.init();
});

window.Admin = Admin;
export default Admin;
