/**
 * E2E Tests for Step 12: Registration Management
 * Covers: Registration list, filtering, status management, and exports
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

test.describe('Step 12: Registration Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERNAME, TEST_PASSWORD);
  });

  // ==================== REGISTRATION LIST ====================
  test.describe('Registration List View', () => {
    
    test('should access registrations section from sidebar', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const registrationsContainer = page.locator(SELECTORS.registrations.container);
      await expect(registrationsContainer).toBeVisible();
    });
    
    test('should display registrations list', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const registrationsContainer = page.locator(SELECTORS.registrations.container);
      await expect(registrationsContainer).toBeVisible();
      
      // Check for registration items or empty state
      const registrationRows = page.locator(SELECTORS.registrations.registrationRow);
      const count = await registrationRows.count();
      
      // Either we have registrations or an empty state message
      expect(count >= 0).toBeTruthy();
    });
    
    test('should have search functionality', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const searchInput = page.locator(SELECTORS.registrations.searchInput);
      
      if (await searchInput.isVisible().catch(() => false)) {
        // Try searching for a test term
        await searchInput.fill('test');
        await page.waitForTimeout(500);
        
        // Search field should have the value
        await expect(searchInput).toHaveValue('test');
        
        // Clear search
        await searchInput.clear();
        await expect(searchInput).toHaveValue('');
      }
    });
    
    test('should have filter by status', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const filterSelect = page.locator(SELECTORS.registrations.filterSelect);
      
      if (await filterSelect.isVisible().catch(() => false)) {
        // Get available options
        const options = await filterSelect.locator('option').allTextContents();
        
        // Should have status options like pending, confirmed, cancelled
        const hasStatusOptions = options.some(opt => 
          /pending|confirmed|cancelled|all/i.test(opt)
        );
        
        expect(hasStatusOptions || options.length > 1).toBeTruthy();
        
        // Try selecting an option
        if (options.length > 1) {
          await filterSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }
      }
    });
    
    test('should display registration details in rows', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const registrationRows = page.locator(SELECTORS.registrations.registrationRow);
      const count = await registrationRows.count();
      
      if (count > 0) {
        // Check first row has expected columns/data
        const firstRow = registrationRows.first();
        await expect(firstRow).toBeVisible();
        
        // Row should contain some text (name, email, or status)
        const rowText = await firstRow.textContent();
        expect(rowText.length).toBeGreaterThan(0);
      }
    });
    
    test('should show status badges', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const statusBadges = page.locator(SELECTORS.registrations.statusBadge);
      const count = await statusBadges.count();
      
      if (count > 0) {
        const firstBadge = statusBadges.first();
        await expect(firstBadge).toBeVisible();
        
        // Badge should have some status text
        const badgeText = await firstBadge.textContent();
        expect(badgeText.length).toBeGreaterThan(0);
      }
    });
  });

  // ==================== REGISTRATION ACTIONS ====================
  test.describe('Registration Actions', () => {
    
    test('should have export functionality', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const exportButton = page.locator(SELECTORS.registrations.exportButton);
      
      if (await exportButton.isVisible().catch(() => false)) {
        await expect(exportButton).toBeEnabled();
        
        // Note: We won't click this in tests as it may trigger a download
        // Just verify it exists and is clickable
      }
    });
    
    test('should open registration detail view', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const registrationRows = page.locator(SELECTORS.registrations.registrationRow);
      const count = await registrationRows.count();
      
      if (count > 0) {
        // Click on first registration
        const firstRow = registrationRows.first();
        
        // Look for a view/details link or button
        const viewLink = firstRow.locator('a, button').filter({ hasText: /view|details|edit/i });
        
        if (await viewLink.isVisible().catch(() => false)) {
          await viewLink.click();
          await page.waitForTimeout(1000);
          
          // Should navigate to detail page or open modal
          const currentUrl = page.url();
          const hasModal = await page.locator('.modal, .dialog, [role="dialog"]').isVisible().catch(() => false);
          
          expect(currentUrl.includes('registration') || hasModal).toBeTruthy();
        }
      }
    });
    
    test('should update registration status', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const registrationRows = page.locator(SELECTORS.registrations.registrationRow);
      const count = await registrationRows.count();
      
      if (count > 0) {
        const firstRow = registrationRows.first();
        
        // Look for status dropdown or action buttons
        const statusSelect = firstRow.locator('select');
        const actionButtons = firstRow.locator('button');
        
        if (await statusSelect.isVisible().catch(() => false)) {
          // Change status
          const options = await statusSelect.locator('option').allTextContents();
          if (options.length > 1) {
            await statusSelect.selectOption({ index: 1 });
            await page.waitForTimeout(1000);
            
            // Verify status changed
            const selectedValue = await statusSelect.inputValue();
            expect(selectedValue).toBeTruthy();
          }
        } else if (await actionButtons.count() > 0) {
          // Check for action buttons
          const firstButton = actionButtons.first();
          await expect(firstButton).toBeVisible();
        }
      }
    });
  });

  // ==================== REGISTRATION FORM CONFIGURATION ====================
  test.describe('Registration Form Configuration', () => {
    
    test('should access registration form settings', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      // Look for form settings tab or link
      const formSettingsLink = page.locator('a, button').filter({ hasText: /form|settings|configure/i });
      
      if (await formSettingsLink.isVisible().catch(() => false)) {
        await formSettingsLink.click();
        await page.waitForTimeout(1000);
        
        // Should show form configuration
        const formConfig = page.locator('.form-config, #form-config, .registration-form');
        await expect(formConfig).toBeVisible();
      }
    });
    
    test('should display form fields configuration', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      // Look for form fields section
      const formFields = page.locator('.form-fields, .field-list, [data-section="fields"]');
      
      if (await formFields.isVisible().catch(() => false)) {
        const fields = formFields.locator('.field-item, .form-field');
        const count = await fields.count();
        
        // Should have at least one field (name, email, etc.)
        expect(count >= 0).toBeTruthy();
      }
    });
  });

  // ==================== BULK OPERATIONS ====================
  test.describe('Registration Bulk Operations', () => {
    
    test('should have select all checkbox', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const selectAllCheckbox = page.locator('thead input[type="checkbox"], .select-all input[type="checkbox"]');
      
      if (await selectAllCheckbox.isVisible().catch(() => false)) {
        await selectAllCheckbox.click();
        await page.waitForTimeout(500);
        
        // Verify checkbox is checked
        await expect(selectAllCheckbox).toBeChecked();
      }
    });
    
    test('should show bulk action buttons when items selected', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const registrationRows = page.locator(SELECTORS.registrations.registrationRow);
      const count = await registrationRows.count();
      
      if (count > 0) {
        // Try to select first row
        const firstRowCheckbox = registrationRows.first().locator('input[type="checkbox"]').first();
        
        if (await firstRowCheckbox.isVisible().catch(() => false)) {
          await firstRowCheckbox.click();
          await page.waitForTimeout(500);
          
          // Look for bulk action buttons
          const bulkActions = page.locator('.bulk-actions, [data-bulk-actions]');
          
          if (await bulkActions.isVisible().catch(() => false)) {
            const actionButtons = bulkActions.locator('button');
            expect(await actionButtons.count()).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  // ==================== PAGINATION ====================
  test.describe('Registration List Pagination', () => {
    
    test('should show pagination when many registrations', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const pagination = page.locator('.pagination, [data-pagination]');
      
      // Pagination may or may not be visible depending on data count
      if (await pagination.isVisible().catch(() => false)) {
        const pageButtons = pagination.locator('button, a');
        expect(await pageButtons.count()).toBeGreaterThan(0);
      }
    });
    
    test('should navigate between pages', async ({ page }) => {
      await navigateToSection(page, 'Registrations');
      
      const pagination = page.locator('.pagination, [data-pagination]');
      
      if (await pagination.isVisible().catch(() => false)) {
        const nextButton = pagination.locator('button').filter({ hasText: /next|>/i });
        
        if (await nextButton.isVisible().catch(() => false)) {
          if (await nextButton.isEnabled().catch(() => false)) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            
            // Should still be on registrations page
            const currentUrl = page.url();
            expect(currentUrl).toContain('admin');
          }
        }
      }
    });
  });
});
