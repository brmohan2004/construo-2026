/**
 * CONSTRUO 2026 - Main Supabase Data Loader
 * 
 * Smart caching system ("stale-while-revalidate"):
 * 
 *  1. FIRST VISIT:
 *     - Fetch all data from Supabase
 *     - Store in user's localStorage (phone memory)
 *     - Display the data
 * 
 *  2. RETURN VISITS:
 *     - Instantly load data from localStorage (super fast, no network wait)
 *     - Display cached data immediately
 *     - Fetch fresh data from Supabase in the background
 *     - If data changed (admin made edits), update localStorage + update UI
 * 
 *  3. ADMIN CHANGES:
 *     - When admin updates anything in the admin panel, Supabase has new data
 *     - On user's next visit/refresh, background fetch detects the change
 *     - localStorage is updated and UI refreshes automatically
 * 
 * NO ES MODULES - uses window globals for maximum mobile compatibility.
 */

(function () {
    'use strict';

    var CACHE_PREFIX = 'construo_v4_';
    var CACHE_KEYS = {
        siteConfig: CACHE_PREFIX + 'siteConfig',
        events: CACHE_PREFIX + 'events',
        timeline: CACHE_PREFIX + 'timeline',
        speakers: CACHE_PREFIX + 'speakers',
        sponsors: CACHE_PREFIX + 'sponsors',
        organizers: CACHE_PREFIX + 'organizers',
        lastFetch: CACHE_PREFIX + 'lastFetch',
        dataHash: CACHE_PREFIX + 'dataHash'
    };

    // ========================================================
    // CACHE HELPERS - localStorage for mobile persistence
    // ========================================================

    /**
     * Check if localStorage is enabled by admin
     */
    function isLocalStorageEnabled(siteConfig) {
        // Check if admin has disabled localStorage
        if (siteConfig && siteConfig.settings && siteConfig.settings.enableLocalStorage === false) {
            return false;
        }
        return true; // Default to enabled
    }

    /**
     * Save data to localStorage.
     * Handles quota exceeded errors gracefully.
     */
    function saveToStorage(key, data) {
        try {
            var json = JSON.stringify(data);
            localStorage.setItem(key, json);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                console.warn('[cache] localStorage quota exceeded, clearing old cache');
                clearAllStorage();
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    return true;
                } catch (e2) {
                    console.error('[cache] Still cannot save after clearing:', e2);
                }
            } else {
                console.error('[cache] Error saving to localStorage:', e);
            }
            return false;
        }
    }

    /**
     * Read data from localStorage.
     */
    function readFromStorage(key) {
        try {
            var json = localStorage.getItem(key);
            if (!json) return null;
            return JSON.parse(json);
        } catch (e) {
            console.error('[cache] Error reading from localStorage:', e);
            return null;
        }
    }

    /**
     * Clear all construo cache entries from localStorage.
     */
    function clearAllStorage() {
        try {
            Object.keys(CACHE_KEYS).forEach(function (k) {
                localStorage.removeItem(CACHE_KEYS[k]);
            });
            console.log('[cache] All cache cleared');
            return true;
        } catch (e) {
            console.error('[cache] Error clearing cache:', e);
            return false;
        }
    }

    /**
     * Clear old cache versions (v1, v2, etc.) to free up space
     */
    function clearOldCacheVersions() {
        try {
            var oldPrefixes = ['construo_v1_', 'construo_v2_'];
            var keysToRemove = [];
            
            // Find all old cache keys
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key) {
                    for (var j = 0; j < oldPrefixes.length; j++) {
                        if (key.startsWith(oldPrefixes[j])) {
                            keysToRemove.push(key);
                            break;
                        }
                    }
                }
            }
            
            // Remove old cache keys
            keysToRemove.forEach(function(key) {
                localStorage.removeItem(key);
            });
            
            if (keysToRemove.length > 0) {
                console.log('[cache] Cleared ' + keysToRemove.length + ' old cache entries');
            }
        } catch (e) {
            console.error('[cache] Error clearing old cache versions:', e);
        }
    }

    /**
     * Generate a simple hash of data to detect changes.
     * Uses a fast string hash - not cryptographic, just for comparison.
     */
    function simpleHash(str) {
        var hash = 0;
        if (!str || str.length === 0) return hash.toString();
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    /**
     * Get all cached data from localStorage.
     * Returns null if any critical piece is missing OR if localStorage is disabled by admin.
     */
    function getAllCachedData() {
        updateDebugStatus('Checking localStorage...');
        var siteConfig = readFromStorage(CACHE_KEYS.siteConfig);
        
        // Check if admin has disabled localStorage
        if (siteConfig && !isLocalStorageEnabled(siteConfig)) {
            console.log('[cache] localStorage disabled by admin - clearing cache and forcing fresh fetch');
            updateDebugStatus('localStorage disabled by admin');
            clearAllStorage();
            return null;
        }

        var events = readFromStorage(CACHE_KEYS.events);
        var timeline = readFromStorage(CACHE_KEYS.timeline);
        var speakers = readFromStorage(CACHE_KEYS.speakers);
        var sponsors = readFromStorage(CACHE_KEYS.sponsors);
        var organizers = readFromStorage(CACHE_KEYS.organizers);
        var lastFetch = readFromStorage(CACHE_KEYS.lastFetch);

        // Need at least siteConfig to consider cache valid
        if (!siteConfig) {
            console.log('[cache] No cached siteConfig found - cache miss');
            updateDebugStatus('No cache found, fetching from Supabase...');
            return null;
        }

        console.log('[cache] Cache HIT - loaded from localStorage', {
            hasSiteConfig: !!siteConfig,
            eventsCount: events ? events.length : 0,
            timelineCount: timeline ? timeline.length : 0,
            speakersCount: speakers ? speakers.length : 0,
            sponsorsCount: sponsors ? sponsors.length : 0,
            organizersCount: organizers ? organizers.length : 0,
            lastFetch: lastFetch ? new Date(lastFetch).toLocaleString() : 'unknown'
        });
        
        updateDebugStatus('Using cached data');

        return {
            siteConfig: siteConfig,
            events: events || [],
            timeline: timeline || [],
            speakers: speakers || [],
            sponsors: sponsors || [],
            organizers: organizers || []
        };
    }

    /**
     * Update debug status on screen (for mobile debugging)
     */
    function updateDebugStatus(message) {
        try {
            var debugEl = document.getElementById('debug-status');
            if (debugEl) {
                debugEl.textContent = message;
            }
        } catch (e) {
            // Ignore if element doesn't exist yet
        }
    }

    /**
     * Save all data to localStorage.
     * Only saves if localStorage is enabled by admin.
     */
    function saveAllToStorage(data) {
        if (!data) return;

        // Check if localStorage is enabled
        if (data.siteConfig && !isLocalStorageEnabled(data.siteConfig)) {
            console.log('[cache] localStorage disabled by admin - skipping cache save');
            return;
        }

        if (data.siteConfig) saveToStorage(CACHE_KEYS.siteConfig, data.siteConfig);
        if (data.events) saveToStorage(CACHE_KEYS.events, data.events);
        if (data.timeline) saveToStorage(CACHE_KEYS.timeline, data.timeline);
        if (data.speakers) saveToStorage(CACHE_KEYS.speakers, data.speakers);
        if (data.sponsors) saveToStorage(CACHE_KEYS.sponsors, data.sponsors);
        if (data.organizers) saveToStorage(CACHE_KEYS.organizers, data.organizers);
        saveToStorage(CACHE_KEYS.lastFetch, Date.now());

        // Save a hash of the data to detect changes on next visit
        var hashStr = JSON.stringify(data.siteConfig) +
            JSON.stringify(data.events) +
            JSON.stringify(data.speakers);
        saveToStorage(CACHE_KEYS.dataHash, simpleHash(hashStr));

        console.log('[cache] All data saved to localStorage');
    }

    // ========================================================
    // SUPABASE CLIENT HELPER
    // ========================================================

    function getClient() {
        return window._construoSupabase || null;
    }

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

    // ========================================================
    // MAIN DATA LOADER CLASS
    // ========================================================

    function ConstruoSupabaseData() {
        this.cache = {};
        this.currentVersion = '3.0';
        this._supabase = getClient();
        this._readyPromise = null;
        this.loadedModules = 0;
        
        // Clear old cache versions on initialization
        clearOldCacheVersions();
        
        this.checkUrlParams();
    }

    ConstruoSupabaseData.prototype.checkUrlParams = function () {
        try {
            var urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('clearCache') === 'true' || urlParams.get('refresh') === 'true') {
                console.log('[main-supabase] Force clearing cache due to URL parameter');
                clearAllStorage();
                var newUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        } catch (e) {
            // URLSearchParams may not exist on very old browsers
        }
    };

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

    /**
     * MAIN LOAD METHOD - Implements stale-while-revalidate:
     * 
     * 1. Check localStorage for cached data
     * 2. If cached data exists → return it immediately (instant render)
     *    AND start a background fetch from Supabase
     * 3. If no cached data → fetch from Supabase directly
     * 4. After fresh fetch, compare with cache. If different → update cache + notify UI
     */
    ConstruoSupabaseData.prototype.loadAll = function () {
        var self = this;
        console.log('[main-supabase] loadAll() called');
        updateDebugStatus('Starting data load...');

        // Step 1: Check localStorage
        var cachedData = getAllCachedData();

        if (cachedData) {
            // Step 2a: We have cached data! Return it instantly.
            console.log('[main-supabase] ✅ Returning cached data for INSTANT render');
            updateDebugStatus('Loaded from cache');

            // Step 2b: Check if we need a background refresh (Cooldown Timer)
            var lastFetch = readFromStorage(CACHE_KEYS.lastFetch);
            var now = Date.now();
            var cooldownMs = 3 * 60 * 1000; // 3 minutes cooldown

            if (!lastFetch || (now - lastFetch) > cooldownMs) {
                console.log('[main-supabase] Cache is older than 3 minutes, starting background refresh...');
                updateDebugStatus('Checking for updates...');
                self.backgroundRefresh(cachedData);
            } else {
                console.log('[main-supabase] ⏳ Cache is fresh (less than 3 min old), skipping background check to save bandwidth.');
            }

            return Promise.resolve(cachedData);
        }

        // Step 3: No cache - must fetch from Supabase (first visit)
        console.log('[main-supabase] 📡 First visit - fetching from Supabase...');
        updateDebugStatus('Fetching from Supabase...');
        return self.ensureClient().then(function (client) {
            if (!client) {
                updateDebugStatus('❌ Supabase client not available');
                throw new Error('Supabase client not available');
            }
            updateDebugStatus('Connected to Supabase');
            return self.fetchAllFresh();
        }).then(function (freshData) {
            if (!freshData) {
                updateDebugStatus('❌ No data received');
                throw new Error('No data received from Supabase');
            }
            updateDebugStatus('✅ Data loaded successfully');
            // Save to localStorage for next visit
            saveAllToStorage(freshData);
            return freshData;
        }).catch(function (error) {
            updateDebugStatus('❌ Error: ' + error.message);
            throw error;
        });
    };

    /**
     * Background refresh: Fetch fresh data from Supabase and compare with cached data.
     * If data has changed (admin made edits), update localStorage and notify the UI.
     */
    ConstruoSupabaseData.prototype.backgroundRefresh = function (cachedData) {
        var self = this;

        // Small delay to let the UI render first with cached data
        setTimeout(function () {
            console.log('[main-supabase] 🔄 Background refresh starting...');

            self.ensureClient().then(function (client) {
                if (!client) {
                    console.warn('[main-supabase] No client for background refresh');
                    return;
                }
                return self.fetchAllFresh();
            }).then(function (freshData) {
                if (!freshData) return;

                // Compare fresh data with cached data using hash
                var freshHashStr = JSON.stringify(freshData.siteConfig) +
                    JSON.stringify(freshData.events) +
                    JSON.stringify(freshData.speakers);
                var freshHash = simpleHash(freshHashStr);
                var cachedHash = readFromStorage(CACHE_KEYS.dataHash);

                if (freshHash !== cachedHash) {
                    // Data has changed! Admin made edits.
                    console.log('[main-supabase] 🆕 DATA CHANGED - admin made edits! Updating cache + UI...');

                    // Update localStorage with new data
                    saveAllToStorage(freshData);

                    // Notify the UI to re-render with fresh data
                    var event = new CustomEvent('construo-data-refreshed', { detail: freshData });
                    window.dispatchEvent(event);

                    console.log('[main-supabase] ✅ Cache updated and UI refreshed with new data');
                } else {
                    console.log('[main-supabase] ✅ Data unchanged - cache is up to date');
                }
            }).catch(function (err) {
                console.warn('[main-supabase] Background refresh failed (will use cached data):', err.message);
            });
        }, 500); // 500ms delay to let cached data render first
    };

    /**
     * Force refresh all data - bypasses cache completely.
     * Called when user adds ?refresh=true to URL.
     */
    ConstruoSupabaseData.prototype.refreshAllData = function () {
        var self = this;
        console.log('[main-supabase] Force refreshing all data...');
        clearAllStorage();
        return this.ensureClient().then(function (client) {
            if (!client) throw new Error('No client');
            return self.fetchAllFresh();
        }).then(function (freshData) {
            saveAllToStorage(freshData);
            var event = new CustomEvent('construo-data-refreshed', { detail: freshData });
            window.dispatchEvent(event);
            return freshData;
        });
    };

    // ========================================================
    // INDIVIDUAL DATA FETCHERS
    // ========================================================

    ConstruoSupabaseData.prototype.fetchAllFresh = function () {
        var self = this;
        self.loadedModules = 0; // Reset progress counter

        return Promise.all([
            self.getEvents(),
            self.getTimeline(),
            self.getSpeakers(),
            self.getSponsors(),
            self.getOrganizers()
        ]).then(function (results) {
            return self.getSiteConfig().then(function (siteConfig) {
                var data = {
                    siteConfig: siteConfig,
                    events: results[0],
                    timeline: results[1],
                    speakers: results[2],
                    sponsors: results[3],
                    organizers: results[4]
                };
                console.log('[main-supabase] All data fetched from Supabase');
                return data;
            });
        });
    };

    ConstruoSupabaseData.prototype.getSiteConfig = function () {
        if (this.cache.siteConfig) return Promise.resolve(this.cache.siteConfig);
        var self = this;

        return this.ensureClient().then(function (supabase) {
            if (!supabase) {
                console.error('[main-supabase] No Supabase client available for getSiteConfig');
                return null;
            }
            console.log('[main-supabase] Fetching site_config from Supabase...');
            return supabase
                .from('site_config')
                .select('*')
                .eq('config_key', 'main')
                .single()
                .then(function (result) {
                    if (result.error) {
                        console.error('[main-supabase] Supabase error in getSiteConfig:', result.error);
                        throw result.error;
                    }
                    console.log('[main-supabase] ✅ site_config fetched successfully');
                    self.cache.siteConfig = result.data;
                    self.dispatchPartialProgress();
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching site config:', error);
            var cached = readFromStorage(CACHE_KEYS.siteConfig);
            if (cached) {
                console.log('[main-supabase] Using cached site_config as fallback');
            } else {
                console.error('[main-supabase] No cached site_config available');
            }
            return cached;
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
                    return mappedData;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching events:', error);
            return readFromStorage(CACHE_KEYS.events) || [];
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
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching timeline:', error);
            return readFromStorage(CACHE_KEYS.timeline) || [];
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
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching speakers:', error);
            return readFromStorage(CACHE_KEYS.speakers) || [];
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
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching sponsors:', error);
            return readFromStorage(CACHE_KEYS.sponsors) || [];
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
                    return result.data;
                });
        }).catch(function (error) {
            console.error('[main-supabase] Error fetching organizers:', error);
            return readFromStorage(CACHE_KEYS.organizers) || [];
        });
    };

    ConstruoSupabaseData.prototype.dispatchPartialProgress = function () {
        this.loadedModules++;
        var totalModules = 6;
        var percent = Math.round((this.loadedModules / totalModules) * 100);
        window.dispatchEvent(new CustomEvent('construo-partial-load', { detail: { percent: percent } }));
    };

    // ========================================================
    // REGISTRATION (not cached - always live)
    // ========================================================

    ConstruoSupabaseData.prototype.getActiveForm = function () {
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

    // ========================================================
    // EXPOSE GLOBALLY
    // ========================================================

    window.ConstruoSupabaseData = new ConstruoSupabaseData();
    console.log('[main-supabase] ConstruoSupabaseData created (v2.0 with smart caching)');
})();
