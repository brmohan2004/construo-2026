/**
 * CONSTRUO 2026 - Main JavaScript (Supabase)
 * Supabase data loading functions for public website
 * 
 * NO ES MODULES - uses window globals for maximum mobile compatibility.
 * This must load after supabase-config.js which sets window._construoSupabase
 */

(function () {
    'use strict';

    function getClient() {
        return window._construoSupabase || null;
    }

    /**
     * Wait for the Supabase client to be ready.
     * Handles cases where the CDN or config script is still loading.
     */
    function waitForClient(timeoutMs) {
        timeoutMs = timeoutMs || 15000;
        return new Promise(function (resolve) {
            var client = getClient();
            if (client) {
                resolve(client);
                return;
            }
            var start = Date.now();
            var interval = setInterval(function () {
                client = getClient();
                if (client) {
                    clearInterval(interval);
                    resolve(client);
                } else if (Date.now() - start > timeoutMs) {
                    clearInterval(interval);
                    console.error('[main-supabase] Client not ready after ' + timeoutMs + 'ms');
                    resolve(null);
                }
            }, 100);
        });
    }

    function ConstruoSupabaseData() {
        this.cache = {};
        this.currentVersion = '1.5';
        this._supabase = getClient();
        this._readyPromise = null;
        this.loadedModules = 0;
        this.checkUrlParams();
    }

    ConstruoSupabaseData.prototype.checkUrlParams = function () {
        try {
            var urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('clearCache') === 'true' || urlParams.get('refresh') === 'true') {
                console.log('[main-supabase] Force clearing cache due to URL parameter');
                var newUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        } catch (e) {
            // URLSearchParams may not exist on very old browsers
        }
    };

    /**
     * Ensure we have a valid Supabase client before making requests.
     */
    ConstruoSupabaseData.prototype.ensureClient = function () {
        if (this._supabase) return Promise.resolve(this._supabase);
        if (this._readyPromise) return this._readyPromise;

        var self = this;
        this._readyPromise = waitForClient(15000).then(function (client) {
            self._supabase = client;
            return client;
        });
        return this._readyPromise;
    };

    ConstruoSupabaseData.prototype.loadAll = function () {
        var self = this;
        console.log('[main-supabase] loadAll() called');

        return this.ensureClient().then(function (client) {
            if (!client) {
                throw new Error('Supabase client not available');
            }
            console.log('[main-supabase] Client ready, fetching all data...');
            return self.fetchAllFresh();
        });
    };

    ConstruoSupabaseData.prototype.fetchAllFresh = function () {
        var self = this;
        console.log('[main-supabase] Fetching all data fresh from Supabase...');

        return Promise.all([
            self.getEvents(),
            self.getTimeline(),
            self.getSpeakers(),
            self.getSponsors(),
            self.getOrganizers()
        ]).then(function (results) {
            var events = results[0];
            var timeline = results[1];
            var speakers = results[2];
            var sponsors = results[3];
            var organizers = results[4];

            return self.getSiteConfig().then(function (siteConfig) {
                console.log('[main-supabase] All data fetched successfully');
                return {
                    siteConfig: siteConfig,
                    events: events,
                    timeline: timeline,
                    speakers: speakers,
                    sponsors: sponsors,
                    organizers: organizers
                };
            });
        });
    };

    ConstruoSupabaseData.prototype.refreshAllData = function () {
        var self = this;
        console.log('[main-supabase] Refreshing data in background...');
        return this.fetchAllFresh().then(function (freshData) {
            var event = new CustomEvent('construo-data-refreshed', { detail: freshData });
            window.dispatchEvent(event);
        }).catch(function (e) {
            console.warn('[main-supabase] Background refresh failed', e);
        });
    };

    // --- Data Fetchers ---

    ConstruoSupabaseData.prototype.getSiteConfig = function () {
        if (this.cache.siteConfig) return Promise.resolve(this.cache.siteConfig);
        var self = this;

        return this.ensureClient().then(function (supabase) {
            if (!supabase) return null;
            return supabase
                .from('site_config')
                .select('*')
                .eq('config_key', 'main')
                .single()
                .then(function (result) {
                    if (result.error) throw result.error;
                    self.cache.siteConfig = result.data;
                    self.dispatchPartialProgress();
                    console.log('[main-supabase] site_config loaded');
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching site config:', error);
            return null;
        });
    };

    ConstruoSupabaseData.prototype.getEvents = function () {
        if (this.cache.events) return Promise.resolve(this.cache.events);
        var self = this;

        return this.ensureClient().then(function (supabase) {
            if (!supabase) return [];
            return supabase
                .from('events')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .then(function (result) {
                    if (result.error) throw result.error;
                    var mappedData = result.data.map(function (event) {
                        return Object.assign({}, event, {
                            id: event.event_id,
                            teamSize: event.team_size,
                            prizeMoney: event.prize_money,
                            entryFee: event.entry_fee,
                            registrationFee: event.entry_fee,
                            registrationLink: event.registration_link,
                            shortDescription: event.description,
                            createdAt: event.created_at,
                            updatedAt: event.updated_at
                        });
                    });
                    self.cache.events = mappedData;
                    self.dispatchPartialProgress();
                    console.log('[main-supabase] events loaded:', mappedData.length);
                    return mappedData;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching events:', error);
            return [];
        });
    };

    ConstruoSupabaseData.prototype.getTimeline = function () {
        if (this.cache.timeline) return Promise.resolve(this.cache.timeline);
        var self = this;

        return this.ensureClient().then(function (supabase) {
            if (!supabase) return [];
            return supabase
                .from('timeline_days')
                .select('*')
                .order('order', { ascending: true })
                .then(function (result) {
                    if (result.error) throw result.error;
                    self.cache.timeline = result.data;
                    self.dispatchPartialProgress();
                    console.log('[main-supabase] timeline loaded:', result.data.length);
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching timeline:', error);
            return [];
        });
    };

    ConstruoSupabaseData.prototype.getSpeakers = function () {
        if (this.cache.speakers) return Promise.resolve(this.cache.speakers);
        var self = this;

        return this.ensureClient().then(function (supabase) {
            if (!supabase) return [];
            return supabase
                .from('speakers')
                .select('*')
                .eq('status', 'active')
                .order('order', { ascending: true })
                .then(function (result) {
                    if (result.error) throw result.error;
                    self.cache.speakers = result.data;
                    self.dispatchPartialProgress();
                    console.log('[main-supabase] speakers loaded:', result.data.length);
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching speakers:', error);
            return [];
        });
    };

    ConstruoSupabaseData.prototype.getSponsors = function () {
        if (this.cache.sponsors) return Promise.resolve(this.cache.sponsors);
        var self = this;

        return this.ensureClient().then(function (supabase) {
            if (!supabase) return [];
            return supabase
                .from('sponsors')
                .select('*')
                .eq('status', 'active')
                .order('order', { ascending: true })
                .then(function (result) {
                    if (result.error) throw result.error;
                    self.cache.sponsors = result.data;
                    self.dispatchPartialProgress();
                    console.log('[main-supabase] sponsors loaded:', result.data.length);
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching sponsors:', error);
            return [];
        });
    };

    ConstruoSupabaseData.prototype.getOrganizers = function () {
        if (this.cache.organizers) return Promise.resolve(this.cache.organizers);
        var self = this;

        return this.ensureClient().then(function (supabase) {
            if (!supabase) return [];
            return supabase
                .from('organizers')
                .select('*')
                .eq('status', 'active')
                .order('order', { ascending: true })
                .then(function (result) {
                    if (result.error) throw result.error;
                    self.cache.organizers = result.data;
                    self.dispatchPartialProgress();
                    console.log('[main-supabase] organizers loaded:', result.data.length);
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching organizers:', error);
            return [];
        });
    };

    ConstruoSupabaseData.prototype.dispatchPartialProgress = function () {
        this.loadedModules++;
        var totalModules = 6;
        var percent = Math.round((this.loadedModules / totalModules) * 100);
        window.dispatchEvent(new CustomEvent('construo-partial-load', { detail: { percent: percent } }));
    };

    ConstruoSupabaseData.prototype.getActiveForm = function () {
        var self = this;
        return this.ensureClient().then(function (supabase) {
            if (!supabase) return null;
            return supabase
                .from('registration_forms')
                .select('*')
                .eq('is_active', true)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()
                .then(function (result) {
                    if (result.error) {
                        if (result.error.code === 'PGRST116') return null;
                        throw result.error;
                    }
                    return Object.assign({}, result.data, {
                        isActive: result.data.is_active,
                        updatedAt: result.data.updated_at
                    });
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching active form:', error);
            return null;
        });
    };

    ConstruoSupabaseData.prototype.createRegistration = function (regData) {
        var self = this;
        return this.ensureClient().then(function (supabase) {
            if (!supabase) throw new Error('Supabase client not available');
            var registrationId = 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(7);

            return supabase
                .from('registrations')
                .insert({
                    registration_id: registrationId,
                    registration_number: '',
                    form_id: regData.formId || null,
                    participant: regData.participant || {},
                    data: regData.data || {},
                    events: regData.events || [],
                    team_members: regData.teamMembers || [],
                    payment: regData.payment || { amount: 0, status: 'pending' },
                    status: 'pending'
                })
                .select()
                .single()
                .then(function (result) {
                    if (result.error) throw result.error;
                    return result.data;
                });
        });
    };

    // Create global instance
    window.ConstruoSupabaseData = new ConstruoSupabaseData();
    console.log('[main-supabase] ConstruoSupabaseData created and attached to window');
})();
