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
      const numberButtons = page.locator('.grid button, .cell');
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

  test.describe('Mobile Layout Tests', () => {
    test('should display properly on iPhone X viewport (375x812)', async ({ page }) => {
      // Set iPhone X viewport
      await page.setViewportSize({ width: 375, height: 812 });
      
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Navigate to the app and start game
      await page.goto('/');
      await page.waitForSelector('[data-testid="games-list"]');
      await page.click('[data-testid="game-card-parimpar"]');

      const introModal = page.locator('[data-testid="game-intro"]');
      await expect(introModal).toBeVisible({ timeout: 20000 });
      await introModal.locator('button:has-text("Empezar Juego")').click();

      // Wait for selecting state
      const confirmButton = page.locator('button:has-text("Confirmar Selección")');
      await expect(confirmButton).toBeVisible({ timeout: 15000 });

      // Check mobile layout requirements
      
      // 1. Grid is centered and no horizontal scroll
      const gridContainer = page.locator('.gridWrap');
      await expect(gridContainer).toBeVisible();
      
      // 2. Number cells are at least 56px and readable
      const numberCells = page.locator('.cell');
      await expect(numberCells.first()).toBeVisible();
      
      const cellBox = await numberCells.first().boundingBox();
      expect(cellBox.width).toBeGreaterThanOrEqual(56);
      expect(cellBox.height).toBeGreaterThanOrEqual(44); // Touch target requirement
      
      // 3. Only one instruction card visible
      const instructionCards = page.locator('[data-testid="instruction-card"], .instruction-banner');
      const instructionCount = await instructionCards.count();
      expect(instructionCount).toBeLessThanOrEqual(1);
      
      // 4. Confirm button is full width and doesn't overlap grid
      const buttonBox = await confirmButton.boundingBox();
      const gridBox = await gridContainer.boundingBox();
      
      // Button should be below the grid (non-overlapping)
      expect(buttonBox.y).toBeGreaterThan(gridBox.y + gridBox.height);
      
      // 5. Check for horizontal overflow
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1); // Allow 1px tolerance
      
      // 6. No layout shift when round starts
      const initialGridBox = await gridContainer.boundingBox();
      
      // Click some numbers and check grid doesn't move
      const cellCount = await numberCells.count();
      if (cellCount >= 2) {
        await numberCells.nth(0).click();
        await numberCells.nth(1).click();
      }
      
      const afterClickGridBox = await gridContainer.boundingBox();
      expect(Math.abs(afterClickGridBox.x - initialGridBox.x)).toBeLessThan(5); // Allow small tolerance
      expect(Math.abs(afterClickGridBox.y - initialGridBox.y)).toBeLessThan(5);

      // Check no console errors
      expect(consoleErrors).toEqual([]);
    });

    test('should display properly on Android viewport (360x800)', async ({ page }) => {
      // Set Android viewport
      await page.setViewportSize({ width: 360, height: 800 });
      
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Navigate to the app and start game
      await page.goto('/');
      await page.waitForSelector('[data-testid="games-list"]');
      await page.click('[data-testid="game-card-parimpar"]');

      const introModal = page.locator('[data-testid="game-intro"]');
      await expect(introModal).toBeVisible({ timeout: 20000 });
      await introModal.locator('button:has-text("Empezar Juego")').click();

      // Wait for selecting state
      const confirmButton = page.locator('button:has-text("Confirmar Selección")');
      await expect(confirmButton).toBeVisible({ timeout: 15000 });

      // Check grid is properly centered and sized for smaller Android screen
      const numberCells = page.locator('.cell');
      await expect(numberCells.first()).toBeVisible();
      
      const cellBox = await numberCells.first().boundingBox();
      expect(cellBox.width).toBeGreaterThanOrEqual(56);
      expect(cellBox.height).toBeGreaterThanOrEqual(44);
      
      // Check no horizontal overflow on narrow screen
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);

      // Check no console errors
      expect(consoleErrors).toEqual([]);
    });

    test('should handle orientation change properly', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Navigate to game
      await page.goto('/');
      await page.waitForSelector('[data-testid="games-list"]');
      await page.click('[data-testid="game-card-parimpar"]');

      const introModal = page.locator('[data-testid="game-intro"]');
      await expect(introModal).toBeVisible({ timeout: 20000 });
      await introModal.locator('button:has-text("Empezar Juego")').click();

      // Wait for selecting state
      const confirmButton = page.locator('button:has-text("Confirmar Selección")');
      await expect(confirmButton).toBeVisible({ timeout: 15000 });

      // Get initial grid state
      const gridContainer = page.locator('.gridWrap');
      const initialGridBox = await gridContainer.boundingBox();
      
      // Change to landscape
      await page.setViewportSize({ width: 812, height: 375 });
      await page.waitForTimeout(500); // Allow for reflow
      
      // Check grid is still properly positioned and sized
      const afterRotationGridBox = await gridContainer.boundingBox();
      expect(afterRotationGridBox).toBeTruthy();
      
      // Grid should still be centered (within reasonable bounds)
      const numberCells = page.locator('.cell');
      const cellBox = await numberCells.first().boundingBox();
      expect(cellBox.width).toBeGreaterThanOrEqual(56);
    });
  });
});
