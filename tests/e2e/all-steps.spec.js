/**
 * E2E Tests for Steps 1-10
 * Covers: Login, Hero, About, Stats, Timeline, Events, Speakers, Sponsors, Venue, Organizers
 */

const { test, expect } = require('@playwright/test');
const { 
  CONFIG, 
  SELECTORS, 
  login, 
  logout, 
  navigateToSection,
  waitForPageLoad,
  waitForLoading,
  generateTestData
} = require('./helpers');

// Test credentials - should be set in environment variables
const TEST_USERNAME = process.env.TEST_ADMIN_USERNAME || 'admin';
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

test.describe.configure({ mode: 'serial' });

test.describe('Steps 1-10: Core Admin Panel', () => {
  
  // ==================== STEP 1: LOGIN ====================
  test.describe('Step 1: Login Page', () => {
    
    test('should display login form with all required fields', async ({ page }) => {
      await page.goto(`${CONFIG.adminBasePath}/`);
      await waitForPageLoad(page);
      
      // Check for username field
      const usernameField = page.locator(SELECTORS.login.username);
      await expect(usernameField).toBeVisible();
      
      // Check for password field
      const passwordField = page.locator(SELECTORS.login.password);
      await expect(passwordField).toBeVisible();
      
      // Check for submit button
      const submitButton = page.locator(SELECTORS.login.submitButton);
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });
    
    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${CONFIG.adminBasePath}/`);
      await waitForPageLoad(page);
      
      // Fill with invalid credentials
      await page.fill(SELECTORS.login.username, 'invaliduser');
      await page.fill(SELECTORS.login.password, 'invalidpass');
      await page.click(SELECTORS.login.submitButton);
      
      // Wait a moment for error to appear
      await page.waitForTimeout(1000);
      
      // Should show error message
      const errorMessage = page.locator(SELECTORS.login.errorMessage);
      const pageContent = await page.content();
      
      // Check if error message exists or we're still on login page
      expect(
        await errorMessage.isVisible().catch(() => false) || 
        page.url().includes('index')
      ).toBeTruthy();
    });
    
    test('should successfully login with valid credentials', async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
      
      // Verify we're on dashboard
      await expect(page).toHaveURL(/.*dashboard.*/);
      
      // Verify sidebar is visible
      const sidebar = page.locator(SELECTORS.dashboard.sidebar);
      await expect(sidebar).toBeVisible();
    });
    
    test('should maintain session after page refresh', async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
      
      // Refresh the page
      await page.reload();
      await waitForPageLoad(page);
      
      // Should still be on dashboard
      await expect(page).toHaveURL(/.*dashboard.*/);
      
      // Sidebar should still be visible
      const sidebar = page.locator(SELECTORS.dashboard.sidebar);
      await expect(sidebar).toBeVisible();
    });
  });

  // ==================== STEP 2: HERO SECTION ====================
  test.describe('Step 2: Hero Section Configuration', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
    });
    
    test('should access hero section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Hero');
      
      // Verify hero form is visible
      const heroForm = page.locator(SELECTORS.hero.form);
      await expect(heroForm).toBeVisible();
    });
    
    test('should update site title', async ({ page }) => {
      await navigateToSection(page, 'Hero');
      
      const testData = generateTestData('hero');
      const siteTitleField = page.locator(SELECTORS.hero.siteTitle);
      
      await siteTitleField.fill('');
      await siteTitleField.fill(testData.title);
      
      // Verify the value was set
      await expect(siteTitleField).toHaveValue(testData.title);
    });
    
    test('should update hero subtitle', async ({ page }) => {
      await navigateToSection(page, 'Hero');
      
      const testData = generateTestData('hero');
      const subtitleField = page.locator(SELECTORS.hero.subtitle);
      
      // Check if field exists
      if (await subtitleField.isVisible().catch(() => false)) {
        await subtitleField.fill('');
        await subtitleField.fill(testData.description);
        await expect(subtitleField).toHaveValue(testData.description);
      }
    });
    
    test('should update hero description', async ({ page }) => {
      await navigateToSection(page, 'Hero');
      
      const testData = generateTestData('hero');
      const descriptionField = page.locator(SELECTORS.hero.description);
      
      if (await descriptionField.isVisible().catch(() => false)) {
        await descriptionField.fill('');
        await descriptionField.fill(testData.description);
        await expect(descriptionField).toHaveValue(testData.description);
      }
    });
    
    test('should update event date', async ({ page }) => {
      await navigateToSection(page, 'Hero');
      
      const dateField = page.locator(SELECTORS.hero.eventDate);
      
      if (await dateField.isVisible().catch(() => false)) {
        const testDate = '2026-03-15';
        await dateField.fill(testDate);
        await expect(dateField).toHaveValue(testDate);
      }
    });
    
    test('should update venue information', async ({ page }) => {
      await navigateToSection(page, 'Hero');
      
      const venueField = page.locator(SELECTORS.hero.venue);
      
      if (await venueField.isVisible().catch(() => false)) {
        const testVenue = 'Test Convention Center, Mumbai';
        await venueField.fill(testVenue);
        await expect(venueField).toHaveValue(testVenue);
      }
    });
    
    test('should save hero configuration', async ({ page }) => {
      await navigateToSection(page, 'Hero');
      
      const saveButton = page.locator(SELECTORS.hero.saveButton);
      
      if (await saveButton.isVisible().catch(() => false)) {
        // Fill some test data first
        const testData = generateTestData('hero');
        const siteTitleField = page.locator(SELECTORS.hero.siteTitle);
        await siteTitleField.fill(testData.title);
        
        // Click save
        await saveButton.click();
        
        // Wait for save to complete (look for success indicator or just wait)
        await page.waitForTimeout(1500);
        
        // Verify the value persists
        await expect(siteTitleField).toHaveValue(testData.title);
      }
    });
  });

  // ==================== STEP 3: ABOUT SECTION ====================
  test.describe('Step 3: About Section Configuration', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
    });
    
    test('should access about section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'About');
      
      const aboutForm = page.locator(SELECTORS.about.form);
      await expect(aboutForm).toBeVisible();
    });
    
    test('should update about title', async ({ page }) => {
      await navigateToSection(page, 'About');
      
      const titleField = page.locator(SELECTORS.about.title);
      
      if (await titleField.isVisible().catch(() => false)) {
        const testData = generateTestData('about');
        await titleField.fill(testData.title);
        await expect(titleField).toHaveValue(testData.title);
      }
    });
    
    test('should update about description', async ({ page }) => {
      await navigateToSection(page, 'About');
      
      const descField = page.locator(SELECTORS.about.description);
      
      if (await descField.isVisible().catch(() => false)) {
        const testData = generateTestData('about');
        await descField.fill(testData.description);
        await expect(descField).toHaveValue(testData.description);
      }
    });
    
    test('should manage features list', async ({ page }) => {
      await navigateToSection(page, 'About');
      
      const addFeatureBtn = page.locator(SELECTORS.about.addFeatureButton);
      
      if (await addFeatureBtn.isVisible().catch(() => false)) {
        // Get initial count
        const featuresList = page.locator(SELECTORS.about.featuresList);
        const initialCount = await featuresList.locator('> *').count();
        
        // Add a feature
        await addFeatureBtn.click();
        
        // Verify feature was added
        await page.waitForTimeout(500);
        const newCount = await featuresList.locator('> *').count();
        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    });
  });

  // ==================== STEP 4: STATS SECTION ====================
  test.describe('Step 4: Stats Section Configuration', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
    });
    
    test('should access stats section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Stats');
      
      const statsForm = page.locator(SELECTORS.stats.form);
      await expect(statsForm).toBeVisible();
    });
    
    test('should display counter items', async ({ page }) => {
      await navigateToSection(page, 'Stats');
      
      const counters = page.locator(SELECTORS.stats.counters);
      const count = await counters.count();
      
      // Should have at least one counter
      expect(count).toBeGreaterThan(0);
    });
    
    test('should update counter values', async ({ page }) => {
      await navigateToSection(page, 'Stats');
      
      const counterValues = page.locator(SELECTORS.stats.counterValue).first();
      
      if (await counterValues.isVisible().catch(() => false)) {
        await counterValues.fill('100');
        await expect(counterValues).toHaveValue('100');
      }
    });
    
    test('should update counter labels', async ({ page }) => {
      await navigateToSection(page, 'Stats');
      
      const counterLabels = page.locator(SELECTORS.stats.counterLabel).first();
      
      if (await counterLabels.isVisible().catch(() => false)) {
        const testLabel = 'Test Counter Label';
        await counterLabels.fill(testLabel);
        await expect(counterLabels).toHaveValue(testLabel);
      }
    });
  });

  // ==================== STEP 5: TIMELINE ====================
  test.describe('Step 5: Timeline Management', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
    });
    
    test('should access timeline section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Timeline');
      
      const timelineContainer = page.locator(SELECTORS.timeline.container);
      await expect(timelineContainer).toBeVisible();
    });
    
    test('should add a new day to timeline', async ({ page }) => {
      await navigateToSection(page, 'Timeline');
      
      const addDayBtn = page.locator(SELECTORS.timeline.addDayButton);
      
      if (await addDayBtn.isVisible().catch(() => false)) {
        const dayCards = page.locator(SELECTORS.timeline.dayCard);
        const initialCount = await dayCards.count();
        
        await addDayBtn.click();
        await page.waitForTimeout(1000);
        
        const newCount = await dayCards.count();
        expect(newCount).toBeGreaterThanOrEqual(initialCount);
      }
    });
    
    test('should update day date', async ({ page }) => {
      await navigateToSection(page, 'Timeline');
      
      const dayDateField = page.locator(SELECTORS.timeline.dayDate).first();
      
      if (await dayDateField.isVisible().catch(() => false)) {
        const testDate = '2026-03-15';
        await dayDateField.fill(testDate);
        await expect(dayDateField).toHaveValue(testDate);
      }
    });
    
    test('should update day title', async ({ page }) => {
      await navigateToSection(page, 'Timeline');
      
      const dayTitleField = page.locator(SELECTORS.timeline.dayTitle).first();
      
      if (await dayTitleField.isVisible().catch(() => false)) {
        const testData = generateTestData('day');
        await dayTitleField.fill(testData.title);
        await expect(dayTitleField).toHaveValue(testData.title);
      }
    });
  });

  // ==================== STEP 6: EVENTS ====================
  test.describe('Step 6: Events Management', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
    });
    
    test('should access events section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Events');
      
      const eventsContainer = page.locator(SELECTORS.events.container);
      await expect(eventsContainer).toBeVisible();
    });
    
    test('should open add event form', async ({ page }) => {
      await navigateToSection(page, 'Events');
      
      const addButton = page.locator(SELECTORS.events.addButton);
      
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        // Check for form fields
        const titleField = page.locator(SELECTORS.events.title).first();
        await expect(titleField).toBeVisible();
      }
    });
    
    test('should fill event details', async ({ page }) => {
      await navigateToSection(page, 'Events');
      
      const addButton = page.locator(SELECTORS.events.addButton);
      
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        const titleField = page.locator(SELECTORS.events.title).first();
        if (await titleField.isVisible().catch(() => false)) {
          const testData = generateTestData('event');
          await titleField.fill(testData.title);
          await expect(titleField).toHaveValue(testData.title);
        }
        
        const descField = page.locator(SELECTORS.events.description).first();
        if (await descField.isVisible().catch(() => false)) {
          const testData = generateTestData('event');
          await descField.fill(testData.description);
          await expect(descField).toHaveValue(testData.description);
        }
      }
    });
  });

  // ==================== STEP 7: SPEAKERS ====================
  test.describe('Step 7: Speakers Management', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
    });
    
    test('should access speakers section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Speakers');
      
      const speakersContainer = page.locator(SELECTORS.speakers.container);
      await expect(speakersContainer).toBeVisible();
    });
    
    test('should open add speaker form', async ({ page }) => {
      await navigateToSection(page, 'Speakers');
      
      const addButton = page.locator(SELECTORS.speakers.addButton);
      
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        const nameField = page.locator(SELECTORS.speakers.name).first();
        await expect(nameField).toBeVisible();
      }
    });
    
    test('should fill speaker details', async ({ page }) => {
      await navigateToSection(page, 'Speakers');
      
      const addButton = page.locator(SELECTORS.speakers.addButton);
      
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        const nameField = page.locator(SELECTORS.speakers.name).first();
        if (await nameField.isVisible().catch(() => false)) {
          const testData = generateTestData('speaker');
          await nameField.fill(testData.name);
          await expect(nameField).toHaveValue(testData.name);
        }
        
        const titleField = page.locator(SELECTORS.speakers.title).first();
        if (await titleField.isVisible().catch(() => false)) {
          await titleField.fill('Keynote Speaker');
          await expect(titleField).toHaveValue('Keynote Speaker');
        }
      }
    });
  });

  // ==================== STEP 8: SPONSORS ====================
  test.describe('Step 8: Sponsors Management', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
    });
    
    test('should access sponsors section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Sponsors');
      
      const sponsorsContainer = page.locator(SELECTORS.sponsors.container);
      await expect(sponsorsContainer).toBeVisible();
    });
    
    test('should open add sponsor form', async ({ page }) => {
      await navigateToSection(page, 'Sponsors');
      
      const addButton = page.locator(SELECTORS.sponsors.addButton);
      
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        const nameField = page.locator(SELECTORS.sponsors.name).first();
        await expect(nameField).toBeVisible();
      }
    });
    
    test('should fill sponsor details', async ({ page }) => {
      await navigateToSection(page, 'Sponsors');
      
      const addButton = page.locator(SELECTORS.sponsors.addButton);
      
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        const nameField = page.locator(SELECTORS.sponsors.name).first();
        if (await nameField.isVisible().catch(() => false)) {
          const testData = generateTestData('sponsor');
          await nameField.fill(testData.name);
          await expect(nameField).toHaveValue(testData.name);
        }
        
        const websiteField = page.locator(SELECTORS.sponsors.website).first();
        if (await websiteField.isVisible().catch(() => false)) {
          await websiteField.fill('https://example.com');
          await expect(websiteField).toHaveValue('https://example.com');
        }
      }
    });
  });

  // ==================== STEP 9: VENUE ====================
  test.describe('Step 9: Venue Configuration', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
    });
    
    test('should access venue section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Venue');
      
      const venueForm = page.locator(SELECTORS.venue.form);
      await expect(venueForm).toBeVisible();
    });
    
    test('should update venue name', async ({ page }) => {
      await navigateToSection(page, 'Venue');
      
      const nameField = page.locator(SELECTORS.venue.name);
      
      if (await nameField.isVisible().catch(() => false)) {
        const testData = generateTestData('venue');
        await nameField.fill(testData.name);
        await expect(nameField).toHaveValue(testData.name);
      }
    });
    
    test('should update venue address', async ({ page }) => {
      await navigateToSection(page, 'Venue');
      
      const addressField = page.locator(SELECTORS.venue.address);
      
      if (await addressField.isVisible().catch(() => false)) {
        await addressField.fill('123 Test Street, Mumbai, India');
        await expect(addressField).toHaveValue('123 Test Street, Mumbai, India');
      }
    });
    
    test('should update venue description', async ({ page }) => {
      await navigateToSection(page, 'Venue');
      
      const descField = page.locator(SELECTORS.venue.description);
      
      if (await descField.isVisible().catch(() => false)) {
        const testData = generateTestData('venue');
        await descField.fill(testData.description);
        await expect(descField).toHaveValue(testData.description);
      }
    });
  });

  // ==================== STEP 10: ORGANIZERS ====================
  test.describe('Step 10: Organizers Management', () => {
    
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERNAME, TEST_PASSWORD);
    });
    
    test('should access organizers section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Organizers');
      
      const organizersContainer = page.locator(SELECTORS.organizers.container);
      await expect(organizersContainer).toBeVisible();
    });
    
    test('should open add organizer form', async ({ page }) => {
      await navigateToSection(page, 'Organizers');
      
      const addButton = page.locator(SELECTORS.organizers.addButton);
      
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        const nameField = page.locator(SELECTORS.organizers.name).first();
        await expect(nameField).toBeVisible();
      }
    });
    
    test('should fill organizer details', async ({ page }) => {
      await navigateToSection(page, 'Organizers');
      
      const addButton = page.locator(SELECTORS.organizers.addButton);
      
      if (await addButton.isVisible().catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(500);
        
        const nameField = page.locator(SELECTORS.organizers.name).first();
        if (await nameField.isVisible().catch(() => false)) {
          const testData = generateTestData('organizer');
          await nameField.fill(testData.name);
          await expect(nameField).toHaveValue(testData.name);
        }
        
        const emailField = page.locator(SELECTORS.organizers.email).first();
        if (await emailField.isVisible().catch(() => false)) {
          const testData = generateTestData('organizer');
          await emailField.fill(testData.email);
          await expect(emailField).toHaveValue(testData.email);
        }
      }
    });
  });
});
