const { test, expect } = require('@playwright/test');

test.describe('Word Search Game', () => {
  test('should allow selecting a word with pointer events', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the main content to load and start the game
    await page.waitForSelector('[data-testid="games-list"]');
    await page.click('[data-testid="game-card-wordsearch"]');
    await page.click('[data-testid="start-btn-wordsearch"]');

    // Wait for the game grid to be visible
    const grid = page.locator('[data-testid="word-search-grid"]');
    await expect(grid).toBeVisible();

    // --- This part is tricky because the grid is random ---
    // For a robust test, we would need to either:
    // 1. Seed the random number generator.
    // 2. Read the words and the grid from the DOM and programmatically find a word.
    // 3. Expose the grid data to the window object in a test environment.

    // Let's try a simplified approach for now. We'll assume a word can be found.
    // This test might be flaky if the word isn't present or is in a different position.

    // Get the list of words to find
    const wordElements = page.locator('.flex-wrap > .inline-flex');
    const wordsToFindCount = await wordElements.count();
    const words = [];
    for (let i = 0; i < wordsToFindCount; i++) {
      words.push(await wordElements.nth(i).textContent());
    }

    // Find a word in the grid (this is the complex part)
    // We'll have to read the grid state
    const letters = await grid.evaluate((el) => {
      const letterNodes = el.querySelectorAll('div > div');
      const gridSize = Math.sqrt(letterNodes.length);
      const gridState = [];
      let row = [];
      letterNodes.forEach((node, i) => {
        row.push(node.textContent);
        if ((i + 1) % gridSize === 0) {
          gridState.push(row);
          row = [];
        }
      });
      return gridState;
    });

    let foundWordInfo = null;

    // Function to search for words horizontally and vertically
    const findWord = (word) => {
      const gridSize = letters.length;
      // Horizontal search
      for (let r = 0; r < gridSize; r++) {
        const rowStr = letters[r].join('');
        let c = rowStr.indexOf(word);
        if (c !== -1) {
          return { word: word, start: { r: r, c: c }, end: { r: r, c: c + word.length - 1 } };
        }
        c = rowStr.indexOf([...word].reverse().join(''));
        if (c !== -1) {
          return { word: word, start: { r: r, c: c + word.length - 1 }, end: { r: r, c: c } };
        }
      }
      // Vertical search
      for (let c = 0; c < gridSize; c++) {
        const colStr = letters.map(row => row[c]).join('');
        let r = colStr.indexOf(word);
        if (r !== -1) {
          return { word: word, start: { r: r, c: c }, end: { r: r + word.length - 1, c: c } };
        }
        r = colStr.indexOf([...word].reverse().join(''));
        if (r !== -1) {
          return { word: word, start: { r: r + word.length - 1, c: c }, end: { r: r, c: c } };
        }
      }
      return null;
    };

    for (const word of words) {
      foundWordInfo = findWord(word.toLowerCase());
      if (foundWordInfo) break;
    }

    // If we found a word, perform the drag
    test.fail(!foundWordInfo, 'Could not find any of the words in the generated grid.');

    const gridBoundingBox = await grid.boundingBox();
    const cellWidth = gridBoundingBox.width / letters.length;
    const cellHeight = gridBoundingBox.height / letters.length;

    const startX = gridBoundingBox.x + foundWordInfo.start.c * cellWidth + cellWidth / 2;
    const startY = gridBoundingBox.y + foundWordInfo.start.r * cellHeight + cellHeight / 2;
    const endX = gridBoundingBox.x + foundWordInfo.end.c * cellWidth + cellWidth / 2;
    const endY = gridBoundingBox.y + foundWordInfo.end.r * cellHeight + cellHeight / 2;

    // Simulate the drag
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Assert that the word is marked as found
    const foundWordBadge = page.locator(`:text("${foundWordInfo.word.toUpperCase()}")`);
    await expect(foundWordBadge).toHaveClass(/bg-green-500/);
  });
});
