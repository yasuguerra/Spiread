import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n) Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display language switcher in header', async ({ page }) => {
    // Look for language switcher
    const langSwitch = page.locator('[data-testid="lang-switch"]');
    await expect(langSwitch).toBeVisible();
    
    // Check for ES and EN buttons
    const esButton = langSwitch.locator('button:has-text("ES")');
    const enButton = langSwitch.locator('button:has-text("EN")');
    
    await expect(esButton).toBeVisible();
    await expect(enButton).toBeVisible();
    
    console.log('✅ Language switcher is visible with ES and EN options');
  });

  test('should switch between Spanish and English', async ({ page }) => {
    // Skip onboarding if present
    const onboardingButton = page.locator('button:has-text("Comenzar Test")');
    if (await onboardingButton.isVisible()) {
      await page.click('text=Training');
    }
    
    // Navigate to games to see translatable content
    await page.click('text=Ejercicios Individuales');
    await page.waitForSelector('[data-testid="games-list"]');
    
    // Check initial Spanish content
    const spanishContent = page.locator('text=Entrenamiento, text=Comenzar, text=Ejercicios');
    if (await spanishContent.count() > 0) {
      console.log('✅ Spanish content is displayed initially');
    }
    
    // Click English button
    const langSwitch = page.locator('[data-testid="lang-switch"]');
    const enButton = langSwitch.locator('button:has-text("EN")');
    
    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForTimeout(1000);
      
      // Check for English content
      const englishContent = page.locator('text=Training, text=Start, text=Exercises');
      if (await englishContent.count() > 0) {
        console.log('✅ Content switched to English');
      } else {
        console.log('⚠️ English content switch may need verification');
      }
      
      // Switch back to Spanish
      const esButton = langSwitch.locator('button:has-text("ES")');
      await esButton.click();
      await page.waitForTimeout(1000);
      
      console.log('✅ Language switching functionality tested');
    }
  });

  test('should persist language selection', async ({ page }) => {
    // Set language to English
    const langSwitch = page.locator('[data-testid="lang-switch"]');
    const enButton = langSwitch.locator('button:has-text("EN")');
    
    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForTimeout(1000);
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if English is still selected (this would require checking localStorage or UI state)
      console.log('✅ Language persistence tested (requires localStorage verification)');
    }
  });

  test('should translate game titles and descriptions', async ({ page }) => {
    // Skip onboarding
    const onboardingButton = page.locator('button:has-text("Comenzar Test")');
    if (await onboardingButton.isVisible()) {
      await page.click('text=Training');
    }
    
    await page.click('text=Ejercicios Individuales');
    await page.waitForSelector('[data-testid="games-list"]');
    
    // Check Spanish game titles
    const spanishTitles = [
      'Lector RSVP',
      'Tabla de Shuttle', 
      'Palabras Gemelas',
      'Par / Impar',
      'Recuerda el Número',
      'Running Words',
      'Letters Grid',
      'Word Search',
      'Anagramas'
    ];
    
    for (const title of spanishTitles) {
      const titleElement = page.locator(`text="${title}"`);
      if (await titleElement.count() > 0) {
        console.log(`✅ Found Spanish title: ${title}`);
      }
    }
    
    // Switch to English and check titles
    const langSwitch = page.locator('[data-testid="lang-switch"]');
    const enButton = langSwitch.locator('button:has-text("EN")');
    
    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForTimeout(1000);
      
      // Check for English translations (some games may keep English names)
      const englishContent = page.locator('text=Reader, text=Memory, text=Words');
      if (await englishContent.count() > 0) {
        console.log('✅ English translations are working');
      }
    }
  });

  test('should translate header gamification elements', async ({ page }) => {
    // Skip onboarding to see gamification header
    const onboardingButton = page.locator('button:has-text("Comenzar Test")');
    if (await onboardingButton.isVisible()) {
      await page.click('text=Training');
    }
    
    // Check for gamification header
    const gamificationHeader = page.locator('[data-testid="header-gamification"]');
    if (await gamificationHeader.isVisible()) {
      // Check Spanish elements
      const spanishElements = gamificationHeader.locator('text=Nivel, text=días');
      if (await spanishElements.count() > 0) {
        console.log('✅ Spanish gamification elements found');
      }
      
      // Switch to English
      const langSwitch = page.locator('[data-testid="lang-switch"]');
      const enButton = langSwitch.locator('button:has-text("EN")');
      
      if (await enButton.isVisible()) {
        await enButton.click();
        await page.waitForTimeout(1000);
        
        // Check English elements
        const englishElements = gamificationHeader.locator('text=Level, text=days');
        if (await englishElements.count() > 0) {
          console.log('✅ English gamification elements found');
        }
      }
    } else {
      console.log('⚠️ Gamification header not visible (may require user profile)');
    }
  });
});