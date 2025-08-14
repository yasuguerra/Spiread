import { test, expect } from '@playwright/test';

test.describe('Games Grid Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Wait for the page to load and skip onboarding if present
    await page.waitForLoadState('networkidle');
    
    // Check if onboarding is present and skip it
    const onboardingButton = page.locator('button:has-text("Comenzar Test")');
    if (await onboardingButton.isVisible()) {
      // Skip onboarding by going directly to training
      await page.click('text=Training');
    }
    
    // Navigate to games section
    await page.click('[data-testid="training"]', { timeout: 10000 });
    await page.click('text=Ejercicios Individuales');
    
    // Wait for games grid to load
    await page.waitForSelector('[data-testid="games-list"]', { timeout: 10000 });
  });

  test('should display exactly 9 game cards', async ({ page }) => {
    // Wait for games list to be visible
    const gamesList = page.locator('[data-testid="games-list"]');
    await expect(gamesList).toBeVisible();
    
    // Count all game cards
    const gameCards = page.locator('[data-testid^="game-card-"]');
    await expect(gameCards).toHaveCount(9);
    
    console.log('✅ Found exactly 9 game cards');
  });

  test('should display all required game keys', async ({ page }) => {
    const expectedGameKeys = [
      'rsvp', 'schulte', 'twinwords', 'parimpar', 'memorydigits',
      'runningwords', 'lettersgrid', 'wordsearch', 'anagrams'
    ];
    
    for (const gameKey of expectedGameKeys) {
      const gameCard = page.locator(`[data-testid="game-card-${gameKey}"]`);
      await expect(gameCard).toBeVisible();
      console.log(`✅ Found game card: ${gameKey}`);
    }
  });

  test('should display game card components correctly', async ({ page }) => {
    const gameCards = page.locator('[data-testid^="game-card-"]');
    const firstCard = gameCards.first();
    
    // Check that each game card has required elements
    await expect(firstCard).toBeVisible();
    
    // Check for title (should be in CardTitle)
    const title = firstCard.locator('.font-semibold, h3, [class*="title"]').first();
    await expect(title).toBeVisible();
    
    // Check for description
    const description = firstCard.locator('p').first();
    await expect(description).toBeVisible();
    
    // Check for badges
    const badges = firstCard.locator('[class*="badge"], .badge');
    await expect(badges.first()).toBeVisible();
    
    // Check for "Comenzar" button
    const startButton = firstCard.locator('[data-testid^="start-btn-"]');
    await expect(startButton).toBeVisible();
    await expect(startButton).toContainText('Comenzar');
    
    console.log('✅ Game card components are correctly displayed');
  });

  test('should have working "Comenzar" buttons for all games', async ({ page }) => {
    const expectedGameKeys = [
      'rsvp', 'schulte', 'twinwords', 'parimpar', 'memorydigits',
      'runningwords', 'lettersgrid', 'wordsearch', 'anagrams'
    ];
    
    for (const gameKey of expectedGameKeys) {
      const startButton = page.locator(`[data-testid="start-btn-${gameKey}"]`);
      await expect(startButton).toBeVisible();
      await expect(startButton).toBeEnabled();
      console.log(`✅ Start button for ${gameKey} is visible and enabled`);
    }
  });

  test('should display games in responsive grid layout', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    const gamesList = page.locator('[data-testid="games-list"]');
    await expect(gamesList).toHaveClass(/grid/);
    await expect(gamesList).toHaveClass(/lg:grid-cols-3/);
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(gamesList).toHaveClass(/md:grid-cols-2/);
    
    // Test mobile layout
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(gamesList).toHaveClass(/grid-cols-1/);
    
    console.log('✅ Responsive grid layout working correctly');
  });
});