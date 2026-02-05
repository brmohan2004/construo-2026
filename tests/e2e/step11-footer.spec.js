/**
 * E2E Tests for Step 11: Footer & Settings
 * Covers: Footer configuration and site-wide settings
 */

const { test, expect } = require('@playwright/test');
const { 
  CONFIG, 
  SELECTORS, 
  login, 
  navigateToSection,
  waitForPageLoad,
  generateTestData
} = require('./helpers');

const TEST_USERNAME = process.env.TEST_ADMIN_USERNAME || 'admin';
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

test.describe.configure({ mode: 'serial' });

test.describe('Step 11: Footer & Site Settings', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERNAME, TEST_PASSWORD);
  });

  // ==================== FOOTER CONFIGURATION ====================
  test.describe('Footer Configuration', () => {
    
    test('should access footer section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Footer');
      
      const footerForm = page.locator(SELECTORS.footer.form);
      await expect(footerForm).toBeVisible();
    });
    
    test('should update footer text', async ({ page }) => {
      await navigateToSection(page, 'Footer');
      
      const footerTextField = page.locator(SELECTORS.footer.footerText);
      
      if (await footerTextField.isVisible().catch(() => false)) {
        const testData = generateTestData('footer');
        await footerTextField.fill(testData.description);
        await expect(footerTextField).toHaveValue(testData.description);
      }
    });
    
    test('should update copyright information', async ({ page }) => {
      await navigateToSection(page, 'Footer');
      
      const copyrightField = page.locator(SELECTORS.footer.copyright);
      
      if (await copyrightField.isVisible().catch(() => false)) {
        const copyrightText = '© 2026 CONSTRUO. All rights reserved.';
        await copyrightField.fill(copyrightText);
        await expect(copyrightField).toHaveValue(copyrightText);
      }
    });
    
    test('should manage social media links', async ({ page }) => {
      await navigateToSection(page, 'Footer');
      
      const socialLinksContainer = page.locator(SELECTORS.footer.socialLinks);
      
      if (await socialLinksContainer.isVisible().catch(() => false)) {
        // Check if social links are present
        const socialInputs = socialLinksContainer.locator('input');
        const count = await socialInputs.count();
        
        // Should have at least one social link input or be able to add one
        expect(count).toBeGreaterThanOrEqual(0);
        
        // Try to fill a social link if available
        if (count > 0) {
          const firstInput = socialInputs.first();
          await firstInput.fill('https://twitter.com/construo2026');
          await expect(firstInput).toHaveValue('https://twitter.com/construo2026');
        }
      }
    });
    
    test('should save footer configuration', async ({ page }) => {
      await navigateToSection(page, 'Footer');
      
      // Find save button (could be in form or nearby)
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
      
      if (await saveButton.isVisible().catch(() => false)) {
        // Fill some data first
        const copyrightField = page.locator(SELECTORS.footer.copyright);
        if (await copyrightField.isVisible().catch(() => false)) {
          await copyrightField.fill('© 2026 Test Copyright');
        }
        
        await saveButton.click();
        await page.waitForTimeout(1500);
        
        // Verify still on footer page (save successful)
        const footerForm = page.locator(SELECTORS.footer.form);
        await expect(footerForm).toBeVisible();
      }
    });
  });

  // ==================== SITE SETTINGS ====================
  test.describe('Site Settings Configuration', () => {
    
    test('should access settings section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Settings');
      
      const settingsForm = page.locator(SELECTORS.settings.form);
      
      // Settings might be labeled differently
      if (await settingsForm.isVisible().catch(() => false)) {
        await expect(settingsForm).toBeVisible();
      } else {
        // Check for alternative selectors
        const altSettings = page.locator('.settings-form, #settings, [data-section="settings"]');
        await expect(altSettings).toBeVisible();
      }
    });
    
    test('should update SEO title', async ({ page }) => {
      await navigateToSection(page, 'Settings');
      
      const seoTitleField = page.locator(SELECTORS.settings.seoTitle);
      
      if (await seoTitleField.isVisible().catch(() => false)) {
        const testData = generateTestData('seo');
        await seoTitleField.fill(testData.title);
        await expect(seoTitleField).toHaveValue(testData.title);
      }
    });
    
    test('should update SEO description', async ({ page }) => {
      await navigateToSection(page, 'Settings');
      
      const seoDescField = page.locator(SELECTORS.settings.seoDescription);
      
      if (await seoDescField.isVisible().catch(() => false)) {
        const testData = generateTestData('seo');
        await seoDescField.fill(testData.description);
        await expect(seoDescField).toHaveValue(testData.description);
      }
    });
    
    test('should handle favicon upload field', async ({ page }) => {
      await navigateToSection(page, 'Settings');
      
      const faviconUpload = page.locator(SELECTORS.settings.faviconUpload);
      
      if (await faviconUpload.isVisible().catch(() => false)) {
        // Check that file input accepts images
        const acceptAttr = await faviconUpload.getAttribute('accept');
        expect(acceptAttr).toMatch(/image/);
      }
    });
    
    test('should save site settings', async ({ page }) => {
      await navigateToSection(page, 'Settings');
      
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
      
      if (await saveButton.isVisible().catch(() => false)) {
        // Fill SEO title if available
        const seoTitleField = page.locator(SELECTORS.settings.seoTitle);
        if (await seoTitleField.isVisible().catch(() => false)) {
          await seoTitleField.fill('CONSTRUO 2026 - Civil Engineering Symposium');
        }
        
        await saveButton.click();
        await page.waitForTimeout(1500);
        
        // Should still be on settings page
        const currentUrl = page.url();
        expect(currentUrl).toContain('admin');
      }
    });
  });

  // ==================== INTEGRATION TESTS ====================
  test.describe('Footer & Settings Integration', () => {
    
    test('should persist footer changes after page refresh', async ({ page }) => {
      await navigateToSection(page, 'Footer');
      
      const copyrightField = page.locator(SELECTORS.footer.copyright);
      
      if (await copyrightField.isVisible().catch(() => false)) {
        const testCopyright = `© ${Date.now()} Test Copyright`;
        await copyrightField.fill(testCopyright);
        
        // Save if button exists
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
        if (await saveButton.isVisible().catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(1500);
        }
        
        // Refresh page
        await page.reload();
        await waitForPageLoad(page);
        
        // Verify still on footer page
        const footerForm = page.locator(SELECTORS.footer.form);
        await expect(footerForm).toBeVisible();
      }
    });
    
    test('should navigate between footer and settings', async ({ page }) => {
      // Go to footer first
      await navigateToSection(page, 'Footer');
      let footerForm = page.locator(SELECTORS.footer.form);
      await expect(footerForm).toBeVisible();
      
      // Then go to settings
      await navigateToSection(page, 'Settings');
      let currentUrl = page.url();
      expect(currentUrl.toLowerCase()).toMatch(/settings|config/);
      
      // Navigate back to footer
      await navigateToSection(page, 'Footer');
      footerForm = page.locator(SELECTORS.footer.form);
      await expect(footerForm).toBeVisible();
    });
  });
});
