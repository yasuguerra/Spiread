const { test, expect } = require('@playwright/test');

test.describe('Par/Impar Game', () => {
  test('should run without crashing and handle selections', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for the main content to load and start the game
    await page.waitForSelector('[data-testid="games-list"]');
    await page.click('[data-testid="game-card-parimpar"]');

    // The GameIntro modal should appear first.
    const introModal = page.locator('[data-testid="game-intro"]');
    await expect(introModal).toBeVisible({ timeout: 20000 });

    const startButton = introModal.locator('button:has-text("Empezar Juego")');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // The game has a "SHOWING" state first, then "SELECTING"
    // We'll wait for the confirmation button to appear, which signals the SELECTING state.
    const confirmButton = page.locator('button:has-text("Confirmar Selección")');

    // Play 3 rounds
    for (let i = 0; i < 3; i++) {
      await expect(confirmButton).toBeVisible({ timeout: 15000 }); // Wait for round to start

      // Click on the first 3 numbers
      const numberButtons = page.locator('.grid button');
      await expect(numberButtons.first()).toBeVisible();
      const count = await numberButtons.count();

      // Ensure we have at least 3 numbers to click
      if (count >= 3) {
        await numberButtons.nth(0).click();
        await numberButtons.nth(1).click();
        await numberButtons.nth(2).click();
      } else {
        // Click all available numbers if less than 3
        for(let j=0; j<count; j++) {
          await numberButtons.nth(j).click();
        }
      }

      await confirmButton.click();

      // Wait for feedback state and then the next round to start
      await page.waitForTimeout(2000); // Wait for feedback and transition
    }

    // After 3 rounds, check that no console errors occurred
    expect(consoleErrors).toEqual([]);
  });
});
