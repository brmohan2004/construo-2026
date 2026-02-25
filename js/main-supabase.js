/**
 * CONSTRUO 2026 - Main JavaScript (Supabase)
 * Supabase data loading functions for public website
 */

import supabase from './supabase-config.js?v=2.5';

class ConstruoSupabaseData {
    constructor() {
        this.cache = {};
        this.currentVersion = '1.3';
        this.checkUrlParams();
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('clearCache') === 'true' || urlParams.get('refresh') === 'true') {
            console.log('Force clearing cache due to URL parameter');
            this.clearAllCache();
            // Clean up the URL
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }

    async loadAll() {
        try {
            console.log('Loading website data from Supabase...');

            // Try to load any available parts from cache for partial instant render
            const cachedData = this.getAllFromCache();

            if (cachedData) {
                console.log('Using cached data for instant render');
                this.refreshAllData(); // Refresh in background
                return cachedData;
            }

            // If some parts are missing, fetchAllFresh will handle it
            return await this.fetchAllFresh();
        } catch (error) {
            console.error('Error loading data from Supabase:', error);
            throw error;
        }
    }

    async fetchAllFresh() {
        // Fetch smaller, critical assets first in parallel
        const [events, timeline, speakers, sponsors, organizers] = await Promise.all([
            this.getEvents(),
            this.getTimeline(),
            this.getSpeakers(),
            this.getSponsors(),
            this.getOrganizers()
        ]);

        // Fetch the large siteConfig independently so it doesn't block the rest
        const siteConfig = await this.getSiteConfig();

        return {
            siteConfig,
            events,
            timeline,
            speakers,
            sponsors,
            organizers
        };
    }

    async refreshAllData() {
        console.log('Refreshing data in background...');
        try {
            const freshData = await this.fetchAllFresh();
            // Dispatch event for UI to update if needed (optional)
            const event = new CustomEvent('construo-data-refreshed', { detail: freshData });
            window.dispatchEvent(event);
        } catch (e) {
            console.warn('Background refresh failed', e);
        }
    }

    // --- Cache Helpers ---
    getFromCache(key) {
        // Caching disabled
        return null;
    }

    saveToCache(key, data) {
        // Caching disabled
    }

    clearAllCache() {
        return true;
    }

    getAllFromCache() {
        // Caching disabled
        return null;
    }

    // --- Data Fetchers ---

    async getSiteConfig() {
        if (this.cache.siteConfig) return this.cache.siteConfig;
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('*')
                .eq('config_key', 'main')
                .single();

            if (error) throw error;
            this.cache.siteConfig = data;
            this.saveToCache('siteConfig', data);
            this.dispatchPartialProgress();
            return data;
        } catch (error) {
            console.error('Error fetching site config:', error);
            const cached = this.getFromCache('siteConfig');
            if (cached) {
                this.cache.siteConfig = cached;
                return cached;
            }
            return null;
        }
    }

    async getEvents() {
        if (this.cache.events) return this.cache.events;
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedData = data.map(event => ({
                ...event,
                id: event.event_id,
                teamSize: event.team_size,
                prizeMoney: event.prize_money,
                entryFee: event.entry_fee,
                registrationFee: event.entry_fee,
                registrationLink: event.registration_link,
                shortDescription: event.description,
                createdAt: event.created_at,
                updatedAt: event.updated_at
            }));

            this.cache.events = mappedData;
            this.saveToCache('events', mappedData);
            this.dispatchPartialProgress();
            return mappedData;
        } catch (error) {
            console.error('Error fetching events:', error);
            const cached = this.getFromCache('events');
            if (cached) {
                this.cache.events = cached;
                return cached;
            }
            return [];
        }
    }

    async getTimeline() {
        if (this.cache.timeline) return this.cache.timeline;
        try {
            const { data, error } = await supabase
                .from('timeline_days')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.timeline = data;
            this.saveToCache('timeline', data);
            this.dispatchPartialProgress();
            return data;
        } catch (error) {
            console.error('Error fetching timeline:', error);
            return this.getFromCache('timeline') || [];
        }
    }

    async getSpeakers() {
        if (this.cache.speakers) return this.cache.speakers;
        try {
            const { data, error } = await supabase
                .from('speakers')
                .select('*')
                .eq('status', 'active')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.speakers = data;
            this.saveToCache('speakers', data);
            this.dispatchPartialProgress();
            return data;
        } catch (error) {
            console.error('Error fetching speakers:', error);
            return this.getFromCache('speakers') || [];
        }
    }

    async getSponsors() {
        if (this.cache.sponsors) return this.cache.sponsors;
        try {
            const { data, error } = await supabase
                .from('sponsors')
                .select('*')
                .eq('status', 'active')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.sponsors = data;
            this.saveToCache('sponsors', data);
            this.dispatchPartialProgress();
            return data;
        } catch (error) {
            console.error('Error fetching sponsors:', error);
            return this.getFromCache('sponsors') || [];
        }
    }

    async getOrganizers() {
        if (this.cache.organizers) return this.cache.organizers;
        try {
            const { data, error } = await supabase
                .from('organizers')
                .select('*')
                .eq('status', 'active')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.organizers = data;
            this.saveToCache('organizers', data);
            this.dispatchPartialProgress();
            return data;
        } catch (error) {
            console.error('Error fetching organizers:', error);
            return this.getFromCache('organizers') || [];
        }
    }

    dispatchPartialProgress() {
        if (!this.loadedModules) this.loadedModules = 0;
        this.loadedModules++;
        const totalModules = 6;
        const percent = Math.round((this.loadedModules / totalModules) * 100);
        window.dispatchEvent(new CustomEvent('construo-partial-load', { detail: { percent } }));
    }

    async getActiveForm() {
        try {
            const { data, error } = await supabase
                .from('registration_forms')
                .select('*')
                .eq('is_active', true)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No active form found
                throw error;
            }
            return {
                ...data,
                isActive: data.is_active,
                updatedAt: data.updated_at
            };
        } catch (error) {
            console.error('Error fetching active form:', error);
            return null;
        }
    }

    async createRegistration(regData) {
        try {
            const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const { data, error } = await supabase
                .from('registrations')
                .insert({
                    registration_id: registrationId,
                    registration_number: '', // Will be auto-generated by trigger
                    form_id: regData.formId || null,
                    participant: regData.participant || {},
                    data: regData.data || {},
                    events: regData.events || [],
                    team_members: regData.teamMembers || [],
                    payment: regData.payment || { amount: 0, status: 'pending' },
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating registration:', error);
            throw error;
        }
    }
}

window.ConstruoSupabaseData = new ConstruoSupabaseData();
console.log('ConstruoSupabaseData initialized with methods:', Object.getOwnPropertyNames(ConstruoSupabaseData.prototype));
export default ConstruoSupabaseData;
