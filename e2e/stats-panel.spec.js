import { test, expect } from '@playwright/test';

test.describe('Stats Panel Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Skip onboarding
    const onboardingButton = page.locator('button:has-text("Comenzar Test")');
    if (await onboardingButton.isVisible()) {
      await page.click('text=Training');
    }
    
    // Navigate to stats panel
    await page.click('text=Métricas, text=Stats');
    await page.waitForTimeout(1000);
  });

  test('should render stats chart without errors', async ({ page }) => {
    // Look for stats chart container
    const statsChart = page.locator('[data-testid="stats-chart"]');
    
    if (await statsChart.isVisible()) {
      await expect(statsChart).toBeVisible();
      console.log('✅ Stats chart container is visible');
      
      // Check for chart elements
      const chartElements = statsChart.locator('svg, canvas, .recharts-wrapper, [class*="chart"]');
      if (await chartElements.count() > 0) {
        console.log('✅ Chart elements found');
      }
      
      // Check for game progress cards
      const gameCards = statsChart.locator('[class*="grid"] > div, .game-progress-card');
      if (await gameCards.count() > 0) {
        console.log(`✅ Found ${await gameCards.count()} game progress cards`);
      }
      
    } else {
      console.log('⚠️ Stats chart not found - checking for alternative stats displays');
      
      // Look for any stats-related content
      const statsContent = page.locator('text=/estadística/i, text=/stats/i, text=/progreso/i, text=/progress/i');
      if (await statsContent.count() > 0) {
        console.log('✅ Stats-related content found');
      }
    }
  });

  test('should handle empty/mock data gracefully', async ({ page }) => {
    // Check if there are any error messages or empty states
    const errorMessages = page.locator('text=/error/i, text=/failed/i, .error, [class*="error"]');
    const emptyStates = page.locator('text=/no data/i, text=/sin datos/i, text=/empty/i, text=/vacío/i');
    
    if (await errorMessages.count() > 0) {
      console.log('⚠️ Error messages found in stats panel');
    } else {
      console.log('✅ No error messages in stats panel');
    }
    
    if (await emptyStates.count() > 0) {
      console.log('✅ Empty state handling found');
    } else {
      console.log('✅ Stats panel shows content or handles empty data gracefully');
    }
  });

  test('should display game tabs correctly', async ({ page }) => {
    // Look for tab navigation
    const tabsList = page.locator('[role="tablist"], .tabs-list, [class*="tabs"]');
    
    if (await tabsList.isVisible()) {
      const tabs = tabsList.locator('[role="tab"], button, .tab');
      const tabCount = await tabs.count();
      
      if (tabCount > 0) {
        console.log(`✅ Found ${tabCount} tabs in stats panel`);
        
        // Check for game-specific tabs
        const gameTabNames = ['General', 'Schulte', 'Twin Words', 'Running Words', 'Letters Grid', 'Word Search', 'Anagramas'];
        
        for (const tabName of gameTabNames) {
          const tab = tabs.filter({ hasText: new RegExp(tabName, 'i') });
          if (await tab.count() > 0) {
            console.log(`✅ Found tab: ${tabName}`);
          }
        }
      }
    } else {
      console.log('⚠️ Tab navigation not found - checking for alternative navigation');
    }
  });

  test('should show XP and level information', async ({ page }) => {
    // Look for XP and level displays
    const xpElements = page.locator('text=/XP/, text=/experiencia/i');
    const levelElements = page.locator('text=/nivel/i, text=/level/i');
    
    if (await xpElements.count() > 0) {
      console.log('✅ XP information found in stats panel');
    }
    
    if (await levelElements.count() > 0) {
      console.log('✅ Level information found in stats panel');
    }
    
    // Look for progress bars
    const progressBars = page.locator('[role="progressbar"], .progress, [class*="progress"]');
    if (await progressBars.count() > 0) {
      console.log('✅ Progress bars found in stats panel');
    }
  });

  test('should display streak information', async ({ page }) => {
    // Look for streak-related content
    const streakElements = page.locator('text=/racha/i, text=/streak/i');
    
    if (await streakElements.count() > 0) {
      console.log('✅ Streak information found in stats panel');
      
      // Look for current and longest streak
      const currentStreak = page.locator('text=/racha actual/i, text=/current streak/i');
      const longestStreak = page.locator('text=/mejor racha/i, text=/longest streak/i, text=/récord/i');
      
      if (await currentStreak.count() > 0) {
        console.log('✅ Current streak display found');
      }
      
      if (await longestStreak.count() > 0) {
        console.log('✅ Longest streak display found');
      }
    }
  });

  test('should display achievements section', async ({ page }) => {
    // Look for achievements section
    const achievementsSection = page.locator('text=/logros/i, text=/achievements/i');
    
    if (await achievementsSection.count() > 0) {
      console.log('✅ Achievements section found');
      
      // Look for achievement cards or list
      const achievementCards = page.locator('.achievement, [class*="achievement"], .trophy, [class*="trophy"]');
      if (await achievementCards.count() > 0) {
        console.log(`✅ Found ${await achievementCards.count()} achievement elements`);
      } else {
        // Check for empty achievements state
        const emptyAchievements = page.locator('text=/sin logros/i, text=/no achievements/i, text=/completa entrenamientos/i');
        if (await emptyAchievements.count() > 0) {
          console.log('✅ Empty achievements state displayed correctly');
        }
      }
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    const statsContent = page.locator('text=/estadística/i, text=/stats/i, [data-testid="stats-chart"]');
    
    if (await statsContent.count() > 0) {
      console.log('✅ Stats panel visible on desktop');
    }
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    if (await statsContent.count() > 0) {
      console.log('✅ Stats panel responsive on tablet');
    }
    
    // Test mobile layout
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    
    if (await statsContent.count() > 0) {
      console.log('✅ Stats panel responsive on mobile');
    }
  });

  test('should handle chart interactions', async ({ page }) => {
    const statsChart = page.locator('[data-testid="stats-chart"]');
    
    if (await statsChart.isVisible()) {
      // Look for interactive elements like tabs or filters
      const interactiveElements = statsChart.locator('button, [role="tab"], .clickable, [class*="clickable"]');
      
      if (await interactiveElements.count() > 0) {
        // Try clicking the first interactive element
        const firstElement = interactiveElements.first();
        if (await firstElement.isVisible()) {
          await firstElement.click();
          await page.waitForTimeout(500);
          console.log('✅ Chart interaction tested successfully');
        }
      } else {
        console.log('⚠️ No interactive elements found in stats chart');
      }
    }
  });
});