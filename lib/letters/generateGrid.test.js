/**
 * Tests for Letters Grid generator function
 * Verifies fast, synchronous grid generation
 */

import { generateGrid, getGridConfig, getConfusables } from '../lib/letters/generateGrid.ts'

describe('Letters Grid Generator', () => {
  test('should generate grid synchronously and quickly', () => {
    const startTime = performance.now()
    
    const result = generateGrid({
      rows: 5,
      cols: 5,
      targetLetter: 'A',
      targetCount: 3,
      confusables: ['B', 'H', 'R']
    })
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Should generate in under 10ms (well under 600ms requirement)
    expect(duration).toBeLessThan(10)
    
    // Should return correct number of cells
    expect(result).toHaveLength(25)
    
    // Should have exact number of target letters
    const targets = result.filter(cell => cell.isTarget)
    expect(targets).toHaveLength(3)
    
    // All target cells should have correct letter
    targets.forEach(cell => {
      expect(cell.char).toBe('A')
    })
  })

  test('should handle different grid sizes', () => {
    const configs = [
      { rows: 3, cols: 3, total: 9 },
      { rows: 5, cols: 5, total: 25 },
      { rows: 6, cols: 6, total: 36 },
      { rows: 8, cols: 8, total: 64 }
    ]

    configs.forEach(({ rows, cols, total }) => {
      const result = generateGrid({
        rows,
        cols,
        targetLetter: 'E',
        targetCount: 2,
        confusables: ['F', 'B']
      })

      expect(result).toHaveLength(total)
      
      // Each cell should have required properties
      result.forEach(cell => {
        expect(cell).toHaveProperty('id')
        expect(cell).toHaveProperty('char')
        expect(cell).toHaveProperty('isTarget')
        expect(typeof cell.char).toBe('string')
        expect(cell.char.length).toBeGreaterThan(0)
      })
    })
  })

  test('should validate input parameters', () => {
    // Too many targets for grid size
    expect(() => {
      generateGrid({
        rows: 2,
        cols: 2,
        targetLetter: 'A',
        targetCount: 5,
        confusables: ['B']
      })
    }).toThrow()

    // Zero targets
    expect(() => {
      generateGrid({
        rows: 5,
        cols: 5,
        targetLetter: 'A',
        targetCount: 0,
        confusables: ['B']
      })
    }).toThrow()
  })

  test('should work with no confusables', () => {
    const result = generateGrid({
      rows: 4,
      cols: 4,
      targetLetter: 'X',
      targetCount: 2,
      confusables: []
    })

    expect(result).toHaveLength(16)
    
    const targets = result.filter(cell => cell.isTarget)
    expect(targets).toHaveLength(2)
    
    // Should fill non-target cells with default alphabet
    const nonTargets = result.filter(cell => !cell.isTarget)
    expect(nonTargets.length).toBe(14)
    
    // All cells should have valid characters
    result.forEach(cell => {
      expect(cell.char).toMatch(/[A-Z]/)
    })
  })

  test('getGridConfig should return valid configurations', () => {
    for (let level = 1; level <= 20; level++) {
      const config = getGridConfig(level)
      
      expect(config.rows).toBeGreaterThanOrEqual(5)
      expect(config.cols).toBeGreaterThanOrEqual(5)
      expect(config.targetCount).toBeGreaterThanOrEqual(1)
      expect(config.targetLetter).toMatch(/[A-Z]/)
      expect(Array.isArray(config.confusables)).toBe(true)
      
      // Target count should not exceed grid size
      expect(config.targetCount).toBeLessThanOrEqual(config.rows * config.cols)
    }
  })

  test('getConfusables should return valid confusable arrays', () => {
    const testLetters = ['A', 'E', 'O', 'B', 'P', 'C']
    
    testLetters.forEach(letter => {
      const confusables = getConfusables(letter)
      expect(Array.isArray(confusables)).toBe(true)
      expect(confusables.length).toBeGreaterThan(0)
      
      // Should not include the target letter itself
      expect(confusables).not.toContain(letter)
    })
  })

  test('should generate different grids on multiple calls', () => {
    const params = {
      rows: 5,
      cols: 5,
      targetLetter: 'B',
      targetCount: 3,
      confusables: ['D', 'P', 'R']
    }

    const grid1 = generateGrid(params)
    const grid2 = generateGrid(params)
    
    // Grids should be different (randomization)
    const positions1 = grid1.filter(cell => cell.isTarget).map(cell => cell.id)
    const positions2 = grid2.filter(cell => cell.isTarget).map(cell => cell.id)
    
    // Very unlikely to have identical target positions in random generation
    expect(positions1).not.toEqual(positions2)
  })
})
