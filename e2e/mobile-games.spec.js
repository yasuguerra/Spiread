import { test, expect } from '@playwright/test';

test.describe('Mobile Games Tests', () => {
  const mobileViewports = [
    { name: 'Mobile Small', width: 360, height: 800 },
    { name: 'Mobile Medium', width: 375, height: 812 }
  ];

  for (const viewport of mobileViewports) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Skip onboarding if present
        const onboardingButton = page.locator('button:has-text("Comenzar Test")');
        if (await onboardingButton.isVisible()) {
          await page.click('text=Training');
        }
        
        // Navigate to games section
        await page.click('[data-testid="training"]', { timeout: 10000 });
        await page.click('text=Ejercicios Individuales');
        await page.waitForSelector('[data-testid="games-list"]', { timeout: 10000 });
      });

      test('Par/Impar - Mobile Layout and Gameplay', async ({ page }) => {
        // Navigate to Par/Impar game
        await page.click('[data-testid="game-card-parimpar"]');
        
        // Wait for game intro modal
        const introModal = page.locator('[data-testid="game-intro"]');
        await expect(introModal).toBeVisible({ timeout: 20000 });
        
        // Take snapshot of idle state
        await page.screenshot({ 
          path: `test-results/parimpar-idle-${viewport.width}x${viewport.height}.png`,
          fullPage: true 
        });
        
        // Check for no horizontal overflow on first paint
        const bodyOverflow = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        expect(bodyOverflow).toBe(false);
        
        // Start the game
        const startButton = introModal.locator('button:has-text("Empezar Juego")');
        await startButton.click();
        
        // Wait for game to enter showing phase, then selecting phase
        const confirmButton = page.locator('button:has-text("Confirmar")');
        await expect(confirmButton).toBeVisible({ timeout: 15000 });
        
        // Take snapshot of in-game state
        await page.screenshot({ 
          path: `test-results/parimpar-ingame-${viewport.width}x${viewport.height}.png`,
          fullPage: true 
        });
        
        // Check cell sizing requirements
        const numberButtons = page.locator('.grid button, .aspect-square');
        await expect(numberButtons.first()).toBeVisible();
        
        // Check computed styles for minimum cell size and font size
        const firstButton = numberButtons.first();
        const cellStyles = await firstButton.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            width: parseInt(computed.width),
            height: parseInt(computed.height),
            fontSize: parseInt(computed.fontSize),
            minHeight: computed.minHeight
          };
        });
        
        // Assert minimum cell size >= 56px
        expect(Math.min(cellStyles.width, cellStyles.height)).toBeGreaterThanOrEqual(56);
        // Assert font size >= 24px
        expect(cellStyles.fontSize).toBeGreaterThanOrEqual(24);
        
        // Play a short round - click first 3 numbers
        const count = await numberButtons.count();
        const clickCount = Math.min(3, count);
        
        for (let i = 0; i < clickCount; i++) {
          await numberButtons.nth(i).click();
          await page.waitForTimeout(100); // Small delay between clicks
        }
        
        // Confirm selection
        await confirmButton.click();
        
        // Wait for feedback phase or next round
        await page.waitForTimeout(2000);
        
        // Check if game has progressed (either new round started or game finished)
        const gameProgressed = await page.evaluate(() => {
          // Check for any of these conditions that indicate game progression
          return document.querySelector('button:has-text("Jugar de Nuevo")') || // Game finished
                 document.querySelector('button:has-text("Volver al Menú")') || // Game finished
                 document.querySelector('.text-center:has-text("Calculando")') || // Feedback phase
                 document.querySelector('button:has-text("Confirmar")'); // New round
        });
        
        expect(gameProgressed).toBeTruthy();
        
        // If game finished, take summary screenshot
        const gameFinished = await page.locator('button:has-text("Jugar de Nuevo"), button:has-text("Volver al Menú")').isVisible();
        if (gameFinished) {
          await page.screenshot({ 
            path: `test-results/parimpar-summary-${viewport.width}x${viewport.height}.png`,
            fullPage: true 
          });
        }
      });

      test('Twin Words - Mobile Layout and Round Completion Logic', async ({ page }) => {
        // Navigate to Twin Words game
        await page.click('[data-testid="game-card-twinwords"]');
        
        // Wait for game to load (Twin Words may load directly or have intro)
        await page.waitForTimeout(2000);
        
        // Check if there's a start button or if game loads directly
        const startButton = page.locator('button:has-text("Comenzar"), button:has-text("Start")').first();
        if (await startButton.isVisible()) {
          await startButton.click();
        }
        
        // Wait for game grid to appear
        const gameGrid = page.locator('.grid, [class*="grid"]').first();
        await expect(gameGrid).toBeVisible({ timeout: 15000 });
        
        // Take snapshot of idle/ready state
        await page.screenshot({ 
          path: `test-results/twinwords-idle-${viewport.width}x${viewport.height}.png`,
          fullPage: true 
        });
        
        // Check for no horizontal overflow
        const bodyOverflow = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        expect(bodyOverflow).toBe(false);
        
        // Take snapshot of in-game state
        await page.screenshot({ 
          path: `test-results/twinwords-ingame-${viewport.width}x${viewport.height}.png`,
          fullPage: true 
        });
        
        // Check for Spanish instruction
        const instruction = page.locator('text=Marca las palabras DIFERENTES');
        await expect(instruction).toBeVisible({ timeout: 10000 });
        
        // Find word pair cards
        const wordCards = page.locator('[class*="cursor-pointer"], .card, [onclick]').filter({ hasText: /\\w+/ });
        await expect(wordCards.first()).toBeVisible();
        
        // Check computed styles for minimum card size and font size
        const firstCard = wordCards.first();
        const cardStyles = await firstCard.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            width: parseInt(computed.width),
            height: parseInt(computed.height),
            fontSize: parseInt(computed.fontSize),
            minHeight: computed.minHeight
          };
        });
        
        // Assert minimum card size >= 56px (accounting for word cards being larger)
        expect(Math.min(cardStyles.width, cardStyles.height)).toBeGreaterThanOrEqual(56);
        // Assert font size >= 24px
        expect(cardStyles.fontSize).toBeGreaterThanOrEqual(24);
        
        // Test the round completion logic: mark all incorrect pairs
        const initialProgress = await page.locator('text=Encontrados:').textContent();
        console.log('Initial progress:', initialProgress);
        
        // We need to find and click ONLY the incorrect (different) pairs
        // The game should show targets like "Encontrados: 0/X"
        const progressRegex = /Encontrados: (\d+)\/(\d+)/;
        const progressMatch = initialProgress?.match(progressRegex);
        
        if (progressMatch) {
          const totalTargets = parseInt(progressMatch[2]);
          console.log(`Total targets to find: ${totalTargets}`);
          
          // Track initial round number (if visible)
          const initialRound = await page.locator('text=Ronda').textContent().catch(() => 'Ronda 1');
          
          // Try to find and click incorrect pairs
          // We'll click cards and monitor progress
          const cardCount = await wordCards.count();
          let foundTargets = 0;
          
          for (let i = 0; i < cardCount && foundTargets < totalTargets; i++) {
            const card = wordCards.nth(i);
            
            // Check if card is already found (has green styling)
            const isAlreadyFound = await card.evaluate((el) => {
              return el.classList.contains('ring-green-500') || 
                     el.querySelector('.text-green-500') !== null ||
                     getComputedStyle(el).borderColor.includes('green');
            });
            
            if (!isAlreadyFound) {
              await card.click();
              await page.waitForTimeout(500); // Allow for game state update
              
              // Check if progress increased
              const newProgress = await page.locator('text=Encontrados:').textContent();
              const newMatch = newProgress?.match(progressRegex);
              
              if (newMatch) {
                const currentFound = parseInt(newMatch[1]);
                if (currentFound > foundTargets) {
                  foundTargets = currentFound;
                  console.log(`Found target! Progress: ${foundTargets}/${totalTargets}`);
                }
              }
            }
          }
          
          // If we found all targets, check that round advances
          if (foundTargets === totalTargets) {
            // Wait for round to advance
            await page.waitForTimeout(2000);
            
            // Check if round advanced
            const newRound = await page.locator('text=Ronda').textContent().catch(() => 'Ronda 1');
            const roundAdvanced = newRound !== initialRound;
            
            console.log(`Round advanced: ${roundAdvanced} (${initialRound} -> ${newRound})`);
            expect(roundAdvanced).toBe(true);
            
            // Take screenshot of completed round
            await page.screenshot({ 
              path: `test-results/twinwords-completed-${viewport.width}x${viewport.height}.png`,
              fullPage: true 
            });
          }
        }
        
        // Test that round does NOT advance prematurely
        // If there are still targets left, the round should not advance
        const finalProgress = await page.locator('text=Encontrados:').textContent();
        const finalMatch = finalProgress?.match(progressRegex);
        
        if (finalMatch) {
          const found = parseInt(finalMatch[1]);
          const total = parseInt(finalMatch[2]);
          
          if (found < total) {
            // Round should not have advanced yet
            const currentRound = await page.locator('text=Ronda').textContent().catch(() => 'Ronda 1');
            console.log(`Incomplete round - should not advance. Current: ${currentRound}`);
            
            // The round number should not change while targets remain
            await page.waitForTimeout(1000);
            const stillSameRound = await page.locator('text=Ronda').textContent().catch(() => 'Ronda 1');
            expect(stillSameRound).toBe(currentRound);
          }
        }
      });
    });
  }
});
