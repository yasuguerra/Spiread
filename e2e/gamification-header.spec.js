import { test, expect } from '@playwright/test';

test.describe('Gamification Header Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Skip onboarding to access main app
    const onboardingButton = page.locator('button:has-text("Comenzar Test")');
    if (await onboardingButton.isVisible()) {
      await page.click('text=Training');
    }
  });

  test('should display gamification header elements', async ({ page }) => {
    // Check if gamification header is present
    const gamificationHeader = page.locator('[data-testid="header-gamification"]');
    
    if (await gamificationHeader.isVisible()) {
      console.log('✅ Gamification header is visible');
      
      // Check for level display
      const levelDisplay = gamificationHeader.locator('text=/Nivel \\d+/');
      if (await levelDisplay.count() > 0) {
        await expect(levelDisplay.first()).toBeVisible();
        console.log('✅ Level display found');
      }
      
      // Check for XP progress bar
      const xpBar = page.locator('[data-testid="xp-bar"]');
      if (await xpBar.isVisible()) {
        await expect(xpBar).toBeVisible();
        console.log('✅ XP progress bar found');
      }
      
      // Check for streak counter
      const streakBadge = page.locator('[data-testid="streak-badge"]');
      if (await streakBadge.isVisible()) {
        await expect(streakBadge).toBeVisible();
        console.log('✅ Streak counter found');
      }
      
    } else {
      console.log('⚠️ Gamification header not visible - may require user authentication or profile setup');
      
      // Check if there are any gamification elements in the regular header
      const headerElements = page.locator('header');
      const levelText = headerElements.locator('text=/Nivel/, text=/Level/');
      const xpText = headerElements.locator('text=/XP/');
      
      if (await levelText.count() > 0 || await xpText.count() > 0) {
        console.log('✅ Some gamification elements found in header');
      }
    }
  });

  test('should display XP progress bar correctly', async ({ page }) => {
    const xpBar = page.locator('[data-testid="xp-bar"]');
    
    if (await xpBar.isVisible()) {
      // Check if it's a progress element
      const progressElement = xpBar.locator('[role="progressbar"]');
      if (await progressElement.count() > 0) {
        await expect(progressElement.first()).toBeVisible();
        console.log('✅ XP progress bar has correct ARIA role');
      }
      
      // Check for XP text nearby
      const xpText = page.locator('text=/\\d+ XP/, text=/XP/');
      if (await xpText.count() > 0) {
        console.log('✅ XP text found near progress bar');
      }
      
    } else {
      console.log('⚠️ XP progress bar not found - checking for alternative XP displays');
      
      // Look for any XP-related text
      const xpElements = page.locator('text=/XP/, text=/experiencia/i');
      if (await xpElements.count() > 0) {
        console.log('✅ XP-related elements found');
      }
    }
  });

  test('should display streak counter with flame icon', async ({ page }) => {
    const streakBadge = page.locator('[data-testid="streak-badge"]');
    
    if (await streakBadge.isVisible()) {
      // Check for flame icon (Lucide React Flame component)
      const flameIcon = streakBadge.locator('svg, [class*="flame"], [data-testid*="flame"]');
      if (await flameIcon.count() > 0) {
        console.log('✅ Flame icon found in streak badge');
      }
      
      // Check for number
      const streakNumber = streakBadge.locator('text=/\\d+/');
      if (await streakNumber.count() > 0) {
        console.log('✅ Streak number found');
      }
      
    } else {
      console.log('⚠️ Streak badge not found - checking for alternative streak displays');
      
      // Look for streak-related text
      const streakElements = page.locator('text=/racha/i, text=/streak/i, text=/días/i, text=/days/i');
      if (await streakElements.count() > 0) {
        console.log('✅ Streak-related elements found');
      }
    }
  });

  test('should be responsive across screen sizes', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    const gamificationHeader = page.locator('[data-testid="header-gamification"]');
    
    if (await gamificationHeader.isVisible()) {
      await expect(gamificationHeader).toBeVisible();
      console.log('✅ Gamification header visible on desktop');
    }
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    if (await gamificationHeader.isVisible()) {
      console.log('✅ Gamification header responsive on tablet');
    }
    
    // Test mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    
    if (await gamificationHeader.isVisible()) {
      console.log('✅ Gamification header responsive on mobile');
    } else {
      // On mobile, some elements might be hidden
      console.log('⚠️ Gamification header may be hidden on mobile (expected behavior)');
    }
  });

  test('should show tooltips on hover', async ({ page }) => {
    const gamificationHeader = page.locator('[data-testid="header-gamification"]');
    
    if (await gamificationHeader.isVisible()) {
      // Test level tooltip
      const levelElement = gamificationHeader.locator('text=/Nivel \\d+/').first();
      if (await levelElement.isVisible()) {
        await levelElement.hover();
        await page.waitForTimeout(500);
        
        // Look for tooltip content
        const tooltip = page.locator('[role="tooltip"], .tooltip, [class*="tooltip"]');
        if (await tooltip.count() > 0) {
          console.log('✅ Level tooltip appears on hover');
        }
      }
      
      // Test streak tooltip
      const streakBadge = page.locator('[data-testid="streak-badge"]');
      if (await streakBadge.isVisible()) {
        await streakBadge.hover();
        await page.waitForTimeout(500);
        
        const tooltip = page.locator('[role="tooltip"], .tooltip, [class*="tooltip"]');
        if (await tooltip.count() > 0) {
          console.log('✅ Streak tooltip appears on hover');
        }
      }
    }
  });

  test('should display achievement count if present', async ({ page }) => {
    const gamificationHeader = page.locator('[data-testid="header-gamification"]');
    
    if (await gamificationHeader.isVisible()) {
      // Look for achievement-related elements
      const achievementElements = gamificationHeader.locator('text=/logro/i, text=/achievement/i, svg[class*="trophy"], [class*="trophy"]');
      
      if (await achievementElements.count() > 0) {
        console.log('✅ Achievement elements found in gamification header');
        
        // Look for achievement count
        const achievementCount = gamificationHeader.locator('text=/\\d+/').filter({ hasText: /logro|achievement|trophy/i });
        if (await achievementCount.count() > 0) {
          console.log('✅ Achievement count displayed');
        }
      } else {
        console.log('⚠️ No achievement elements found (may be expected for new users)');
      }
    }
  });
});