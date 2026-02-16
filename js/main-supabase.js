/**
 * CONSTRUO 2026 - Main JavaScript (Supabase)
 * Supabase data loading functions for public website
 */

import supabase from './supabase-config.js';

class ConstruoSupabaseData {
    constructor() {
        this.cache = {};
    }

    async loadAll() {
        try {
            console.log('Loading website data from Supabase...');

            // Try to load everything from cache first for instant render
            const cachedData = this.getAllFromCache();
            if (cachedData) {
                console.log('Using cached data for instant render');
                // Trigger background refresh
                this.refreshAllData();
                return cachedData;
            }

            // Fallback to normal fetch if no cache
            return await this.fetchAllFresh();
        } catch (error) {
            console.error('Error loading data from Supabase:', error);
            throw error;
        }
    }

    async fetchAllFresh() {
        const [siteConfig, events, timeline, speakers, sponsors, organizers] = await Promise.all([
            this.getSiteConfig(),
            this.getEvents(),
            this.getTimeline(),
            this.getSpeakers(),
            this.getSponsors(),
            this.getOrganizers()
        ]);

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
        try {
            const cached = localStorage.getItem(`construo_${key}`);
            if (!cached) return null;

            const { data, timestamp, version } = JSON.parse(cached);
            // 1 hour cache validity
            if (Date.now() - timestamp > 60 * 60 * 1000) return null;

            return data;
        } catch (e) {
            return null;
        }
    }

    saveToCache(key, data) {
        try {
            const cacheObj = {
                data,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(`construo_${key}`, JSON.stringify(cacheObj));
        } catch (e) {
            console.warn('Cache save failed', e);
        }
    }

    getAllFromCache() {
        const siteConfig = this.getFromCache('siteConfig');
        const events = this.getFromCache('events');
        const timeline = this.getFromCache('timeline');
        const speakers = this.getFromCache('speakers');
        const sponsors = this.getFromCache('sponsors');
        const organizers = this.getFromCache('organizers');

        if (siteConfig && events && timeline && speakers && organizers) {
            return { siteConfig, events, timeline, speakers, sponsors, organizers };
        }
        return null;
    }

    // --- Data Fetchers ---

    async getSiteConfig() {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('*')
                .eq('config_key', 'main')
                .single();

            if (error) throw error;
            this.cache.siteConfig = data;
            this.saveToCache('siteConfig', data);
            return data;
        } catch (error) {
            console.error('Error fetching site config:', error);
            return this.getFromCache('siteConfig') || null;
        }
    }

    async getEvents() {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*') // Select only necessary fields if possible
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map snake_case to camelCase for frontend compatibility
            const mappedData = data.map(event => ({
                ...event,
                id: event.event_id, // Ensure ID is consistent
                teamSize: event.team_size,
                prizeMoney: event.prize_money,
                entryFee: event.entry_fee,
                registrationFee: event.entry_fee, // Map entry_fee to registrationFee for frontend
                registrationLink: event.registration_link,
                shortDescription: event.description,
                // Ensure other potential camelCase fields are covered if needed
                createdAt: event.created_at,
                updatedAt: event.updated_at
            }));

            this.cache.events = mappedData;
            this.saveToCache('events', mappedData);
            return mappedData;
        } catch (error) {
            console.error('Error fetching events:', error);
            return this.getFromCache('events') || [];
        }
    }

    async getTimeline() {
        try {
            const { data, error } = await supabase
                .from('timeline_days')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.timeline = data;
            this.saveToCache('timeline', data);
            return data;
        } catch (error) {
            console.error('Error fetching timeline:', error);
            return this.getFromCache('timeline') || [];
        }
    }

    async getSpeakers() {
        try {
            const { data, error } = await supabase
                .from('speakers')
                .select('*')
                .eq('status', 'active')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.speakers = data;
            this.saveToCache('speakers', data);
            return data;
        } catch (error) {
            console.error('Error fetching speakers:', error);
            return this.getFromCache('speakers') || [];
        }
    }

    async getSponsors() {
        try {
            const { data, error } = await supabase
                .from('sponsors')
                .select('*')
                .eq('status', 'active')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.sponsors = data;
            this.saveToCache('sponsors', data);
            return data;
        } catch (error) {
            console.error('Error fetching sponsors:', error);
            return this.getFromCache('sponsors') || [];
        }
    }

    async getOrganizers() {
        try {
            const { data, error } = await supabase
                .from('organizers')
                .select('*')
                .eq('status', 'active')
                .order('order', { ascending: true });

            if (error) throw error;
            this.cache.organizers = data;
            this.saveToCache('organizers', data);
            return data;
        } catch (error) {
            console.error('Error fetching organizers:', error);
            return this.getFromCache('organizers') || [];
        }
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
