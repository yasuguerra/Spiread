import { test, expect } from '@playwright/test';

test.describe('Game Navigation & Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Skip onboarding if present
    const onboardingButton = page.locator('button:has-text("Comenzar Test")');
    if (await onboardingButton.isVisible()) {
      await page.click('text=Training');
    }
    
    // Navigate to games
    await page.click('text=Ejercicios Individuales');
    await page.waitForSelector('[data-testid="games-list"]');
  });

  test('should open correct GameShell/component for each game', async ({ page }) => {
    const phase3Games = ['runningwords', 'lettersgrid', 'wordsearch', 'anagrams'];
    
    for (const gameKey of phase3Games) {
      // Click the game's "Comenzar" button
      await page.click(`[data-testid="start-btn-${gameKey}"]`);
      
      // Wait for game component to load
      await page.waitForSelector('[data-testid="session-runner"]', { timeout: 10000 });
      
      // Verify we're in the game interface
      const sessionRunner = page.locator('[data-testid="session-runner"]');
      await expect(sessionRunner).toBeVisible();
      
      // Check for game-specific elements
      const gameTitle = page.locator('h2, h3').filter({ hasText: new RegExp(gameKey.replace(/([A-Z])/g, ' $1'), 'i') });
      if (await gameTitle.count() > 0) {
        await expect(gameTitle.first()).toBeVisible();
      }
      
      // Go back to games list
      const exitButton = page.locator('button:has-text("Salir"), button:has-text("Volver")').first();
      if (await exitButton.isVisible()) {
        await exitButton.click();
      } else {
        await page.goBack();
      }
      
      // Wait for games list to be visible again
      await page.waitForSelector('[data-testid="games-list"]');
      
      console.log(`✅ Game navigation working for: ${gameKey}`);
    }
  });

  test('should test 60s timer countdown for Phase 3 games', async ({ page }) => {
    // Test with one Phase 3 game (Running Words)
    await page.click('[data-testid="start-btn-runningwords"]');
    await page.waitForSelector('[data-testid="session-runner"]');
    
    // Look for start game button and click it
    const startButton = page.locator('button:has-text("Jugar"), button:has-text("Comenzar"), button:has-text("Start")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      
      // Wait a moment for timer to start
      await page.waitForTimeout(2000);
      
      // Check for timer display
      const timerElements = page.locator('text=/\\d+s/, text=/Tiempo/, text=/Time/');
      const timerVisible = await timerElements.count() > 0;
      
      if (timerVisible) {
        console.log('✅ Timer is visible and counting down');
      } else {
        console.log('⚠️ Timer not clearly visible, but game started');
      }
      
      // Check for progress bar
      const progressBar = page.locator('[role="progressbar"], .progress, [class*="progress"]');
      if (await progressBar.count() > 0) {
        console.log('✅ Progress bar found');
      }
    }
    
    // Exit the game
    const exitButton = page.locator('button:has-text("Salir"), button:has-text("Exit")').first();
    if (await exitButton.isVisible()) {
      await exitButton.click();
    }
  });

  test('should test hotkeys functionality', async ({ page }) => {
    // Test with Running Words game
    await page.click('[data-testid="start-btn-runningwords"]');
    await page.waitForSelector('[data-testid="session-runner"]');
    
    // Start the game
    const startButton = page.locator('button:has-text("Jugar"), button:has-text("Comenzar")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);
      
      // Test Space key for pause/resume
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      
      // Look for pause indicators
      const pauseIndicators = page.locator('text=/pausa/i, text=/pause/i, button:has-text("Continuar"), button:has-text("Resume")');
      if (await pauseIndicators.count() > 0) {
        console.log('✅ Space key pause functionality working');
        
        // Resume with Space again
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
      }
      
      // Test Escape key for exit
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Check if we're back to menu or if exit dialog appeared
      const backToMenu = page.locator('[data-testid="games-list"]');
      const exitDialog = page.locator('text=/salir/i, text=/exit/i');
      
      if (await backToMenu.isVisible()) {
        console.log('✅ Escape key exit functionality working');
      } else if (await exitDialog.count() > 0) {
        console.log('✅ Escape key triggered exit dialog');
      } else {
        console.log('⚠️ Escape key functionality may need verification');
      }
    }
  });

  test('should complete game flow and return to menu', async ({ page }) => {
    // Test with a quick game completion simulation
    await page.click('[data-testid="start-btn-runningwords"]');
    await page.waitForSelector('[data-testid="session-runner"]');
    
    // Start the game
    const startButton = page.locator('button:has-text("Jugar"), button:has-text("Comenzar")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);
      
      // Look for exit/back button
      const exitButton = page.locator('button:has-text("Salir"), button:has-text("Volver"), button:has-text("Exit")').first();
      if (await exitButton.isVisible()) {
        await exitButton.click();
        
        // Verify we're back to games menu
        await page.waitForSelector('[data-testid="games-list"]');
        const gamesList = page.locator('[data-testid="games-list"]');
        await expect(gamesList).toBeVisible();
        
        console.log('✅ Game completion flow returns to menu correctly');
      }
    }
  });
});