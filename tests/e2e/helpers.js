/**
 * Test Helpers for CONSTRUO 2026 E2E Tests
 * 
 * This file contains utility functions, selectors, and Supabase integration
 * for the Playwright test suite.
 */

const { expect } = require('@playwright/test');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Timeouts
  defaultTimeout: 10000,
  navigationTimeout: 30000,

  // URLs
  adminBasePath: '/admin',

  // Test Data
  testData: {
    siteTitle: 'CONSTRUO 2026 Test',
    heroSubtitle: 'Building the Future Together - Test',
    aboutTitle: 'About CONSTRUO 2026 Test',
    eventTitle: 'Test Event - Structural Engineering',
    speakerName: 'Dr. Test Speaker',
    sponsorName: 'Test Sponsor Corp'
  }
};

// ============================================================================
// Selectors - Updated to match actual HTML structure
// ============================================================================

const SELECTORS = {
  // Login Page
  login: {
    username: '#username',
    password: '#password',
    submitButton: 'button[type="submit"]',
    errorMessage: '.login-error, #loginError, .error-message, .alert-error'
  },

  // Dashboard / Layout
  dashboard: {
    sidebar: '#admin-sidebar',
    navLinks: '#admin-sidebar a, #admin-sidebar .nav-link',
    logoutButton: '#logout-btn, .logout-btn',
    contentArea: '#main-content, .admin-content',
    loader: '.loading, .spinner'
  },

  // Step 2: Hero Section
  hero: {
    form: '#hero-form, .hero-form',
    siteTitle: '#site-title, input[name="title"]',
    subtitle: '#hero-subtitle, input[name="subtitle"]',
    description: '#hero-description, textarea[name="description"]',
    eventDate: '#event-date, input[name="date"]',
    venue: '#event-venue, input[name="venue"]',
    ctaText: '#cta-text, input[name="cta_text"]',
    saveButton: 'button:has-text("Save"), button[type="submit"]'
  },

  // Step 3: About Section
  about: {
    form: '#about-form, .about-form',
    title: '#about-title, input[name="about_title"]',
    description: '#about-description, textarea[name="about_description"]',
    featuresList: '.features-list, #features-container',
    addFeatureButton: 'button:has-text("Add Feature")'
  },

  // Step 4: Stats Section
  stats: {
    form: '#stats-form, .stats-form',
    counters: '.stat-item, .counter-item',
    counterValue: 'input[name*="value"], input[name*="count"]',
    counterLabel: 'input[name*="label"], input[name*="title"]'
  },

  // Step 5: Timeline
  timeline: {
    container: '#timeline-container, .timeline-days',
    addDayButton: 'button:has-text("Add Day")',
    dayCard: '.timeline-day, .day-card',
    dayDate: 'input[type="date"]',
    dayTitle: 'input[name*="day_title"]'
  },

  // Step 6: Events
  events: {
    container: '#events-container, .events-list',
    addButton: 'button:has-text("Add Event"), button:has-text("New Event")',
    eventCard: '.event-item, .event-card',
    title: 'input[name*="event_title"], input[name*="title"]',
    description: 'textarea[name*="description"]',
    time: 'input[type="time"]',
    speakerSelect: 'select[name*="speaker"]'
  },

  // Step 7: Speakers
  speakers: {
    container: '#speakers-container, .speakers-list',
    addButton: 'button:has-text("Add Speaker"), button:has-text("New Speaker")',
    speakerCard: '.speaker-item, .speaker-card',
    name: 'input[name*="name"], input[name*="speaker_name"]',
    bio: 'textarea[name*="bio"]',
    title: 'input[name*="title"], input[name*="role"]',
    photoUpload: 'input[type="file"][accept*="image"]'
  },

  // Step 8: Sponsors
  sponsors: {
    container: '#sponsors-container, .sponsors-list',
    addButton: 'button:has-text("Add Sponsor"), button:has-text("New Sponsor")',
    sponsorCard: '.sponsor-item, .sponsor-card',
    name: 'input[name*="sponsor_name"], input[name*="name"]',
    tier: 'select[name*="tier"]',
    website: 'input[type="url"]',
    logoUpload: 'input[type="file"][accept*="image"]'
  },

  // Step 9: Venue
  venue: {
    form: '#venue-form, .venue-form',
    name: 'input[name*="venue_name"], input[name*="location_name"]',
    address: 'textarea[name*="address"]',
    description: 'textarea[name*="venue_description"]',
    facilities: '.facilities-list, #facilities-container'
  },

  // Step 10: Organizers
  organizers: {
    container: '#organizers-container, .organizers-list',
    addButton: 'button:has-text("Add Organizer")',
    organizerCard: '.organizer-item, .organizer-card',
    name: 'input[name*="organizer_name"], input[name*="name"]',
    role: 'select[name*="role"], input[name*="role"]',
    email: 'input[type="email"]'
  },

  // Step 11: Footer & Settings
  footer: {
    form: '#footer-form, .footer-form',
    footerText: 'textarea[name*="footer_text"]',
    socialLinks: '.social-links, #social-container',
    copyright: 'input[name*="copyright"]'
  },
  settings: {
    form: '#settings-form, .settings-form',
    seoTitle: 'input[name*="seo_title"], input[name*="meta_title"]',
    seoDescription: 'textarea[name*="seo_description"], textarea[name*="meta_description"]',
    faviconUpload: 'input[type="file"][name*="favicon"]'
  },

  // Step 12: Registrations
  registrations: {
    container: '#registrations-container, .registrations-list',
    filterSelect: 'select[name*="status"], select[name*="filter"]',
    searchInput: 'input[type="search"], input[name*="search"]',
    exportButton: 'button:has-text("Export"), button:has-text("Download")',
    registrationRow: '.registration-item, tr[data-registration]',
    statusBadge: '.status-badge, .badge'
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wait for page to be fully loaded
 */
async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Login helper function
 */
async function login(page, username, password) {
  await page.goto(`${CONFIG.adminBasePath}/`);
  await waitForPageLoad(page);

  // Fill in login form
  await page.fill(SELECTORS.login.username, username);
  await page.fill(SELECTORS.login.password, password);

  // Click submit
  await page.click(SELECTORS.login.submitButton);

  // Wait for navigation to dashboard
  await page.waitForURL(/.*dashboard.*/);
  await waitForPageLoad(page);
}

/**
 * Logout helper function
 */
async function logout(page) {
  const logoutBtn = page.locator(SELECTORS.dashboard.logoutButton);
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click();
    await page.waitForURL(/.*index.*/);
  }
}

/**
 * Navigate to a specific admin section
 */
async function navigateToSection(page, sectionName) {
  const navLinks = page.locator(SELECTORS.dashboard.navLinks);
  const link = navLinks.filter({ hasText: new RegExp(sectionName, 'i') });
  await link.click();
  await waitForPageLoad(page);
}

/**
 * Wait for loading to complete
 */
async function waitForLoading(page) {
  const loader = page.locator(SELECTORS.dashboard.loader);
  await loader.waitFor({ state: 'hidden', timeout: CONFIG.defaultTimeout }).catch(() => { });
}

/**
 * Fill form field with retry logic
 */
async function fillField(page, selector, value, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.fill(selector, '');
      await page.fill(selector, value);
      const actualValue = await page.inputValue(selector);
      if (actualValue === value) return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Take screenshot with descriptive name
 */
async function takeScreenshot(page, name) {
  await page.screenshot({
    path: `screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}

/**
 * Generate unique test data
 */
function generateTestData(prefix = 'test') {
  const timestamp = Date.now();
  return {
    title: `${prefix}-title-${timestamp}`,
    name: `${prefix}-name-${timestamp}`,
    email: `${prefix}-${timestamp}@test.com`,
    description: `Test description ${timestamp}`,
    timestamp
  };
}

// ============================================================================
// Supabase Integration (Optional)
// ============================================================================

/**
 * Create Supabase client for database validation
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 */
function createSupabaseClient() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured, skipping DB validation');
      return null;
    }

    return createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn('Supabase client not available:', e.message);
    return null;
  }
}

/**
 * Verify data in Supabase database
 */
async function verifyDatabaseRecord(table, filter) {
  const supabase = createSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .match(filter)
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// Security Test Helpers
// ============================================================================

const SECURITY_PAYLOADS = {
  xss: [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    'javascript:alert("xss")',
    '<svg onload=alert("xss")>',
    '";alert("xss");//',
    "<body onload=alert('xss')>",
    '<iframe src="javascript:alert(\'xss\')"></iframe>'
  ],

  sqlInjection: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' OR 1=1 --",
    "admin'--",
    "1'; WAITFOR DELAY '0:0:5' --",
    "' OR '1'='1' /*"
  ],

  nosqlInjection: [
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$regex": ".*"}',
    '{"$where": "this.password.length > 0"}'
  ],

  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
  ],

  commandInjection: [
    '; cat /etc/passwd',
    '| whoami',
    '&& dir',
    '$(id)',
    '`ls -la`'
  ]
};

/**
 * Test input field for XSS vulnerability
 */
async function testXSSInput(page, selector, payload) {
  await page.fill(selector, payload);
  await page.blur(selector);

  // Check if script was executed (it shouldn't be)
  const hasAlert = await page.evaluate(() => {
    return window.alert.toString().includes('native') === false;
  });

  // Check if payload is rendered as text (safe) or HTML (unsafe)
  const element = page.locator(selector);
  const value = await element.inputValue();

  return {
    payload,
    sanitized: value !== payload || !hasAlert,
    value
  };
}

/**
 * Verify security headers are present
 */
async function checkSecurityHeaders(response) {
  const headers = response.headers();
  const securityHeaders = {
    'X-Content-Type-Options': headers['x-content-type-options'],
    'X-Frame-Options': headers['x-frame-options'],
    'X-XSS-Protection': headers['x-xss-protection'],
    'Content-Security-Policy': headers['content-security-policy'],
    'Strict-Transport-Security': headers['strict-transport-security']
  };

  return securityHeaders;
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  CONFIG,
  SELECTORS,
  SECURITY_PAYLOADS,
  login,
  logout,
  navigateToSection,
  waitForPageLoad,
  waitForLoading,
  fillField,
  takeScreenshot,
  generateTestData,
  createSupabaseClient,
  verifyDatabaseRecord,
  testXSSInput,
  checkSecurityHeaders
};
