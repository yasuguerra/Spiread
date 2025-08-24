import { generateNumberGrid } from './generateNumberGrid';

describe('generateNumberGrid', () => {
  test('generates correct number of items', () => {
    const grid = generateNumberGrid({
      gridSize: 16,
      targetParity: 'even',
      ratioTargets: 0.5,
      min: 1,
      max: 99
    });
    
    expect(grid).toHaveLength(16);
    expect(grid.every(item => typeof item.id === 'string')).toBe(true);
    expect(grid.every(item => typeof item.value === 'number')).toBe(true);
    expect(grid.every(item => typeof item.isTarget === 'boolean')).toBe(true);
  });

  test('respects target ratio approximately', () => {
    const grid = generateNumberGrid({
      gridSize: 16,
      targetParity: 'even',
      ratioTargets: 0.5,
      min: 1,
      max: 99
    });
    
    const targets = grid.filter(item => item.isTarget);
    const expectedTargets = Math.round(16 * 0.5);
    
    expect(targets.length).toBeCloseTo(expectedTargets, 1);
  });

  test('target parity matches configuration', () => {
    const evenGrid = generateNumberGrid({
      gridSize: 16,
      targetParity: 'even',
      ratioTargets: 0.5,
      min: 1,
      max: 99
    });
    
    const evenTargets = evenGrid.filter(item => item.isTarget);
    expect(evenTargets.every(item => item.value % 2 === 0)).toBe(true);

    const oddGrid = generateNumberGrid({
      gridSize: 16,
      targetParity: 'odd',
      ratioTargets: 0.5,
      min: 1,
      max: 99
    });
    
    const oddTargets = oddGrid.filter(item => item.isTarget);
    expect(oddTargets.every(item => item.value % 2 === 1)).toBe(true);
  });

  test('values are within specified range', () => {
    const grid = generateNumberGrid({
      gridSize: 16,
      targetParity: 'even',
      ratioTargets: 0.5,
      min: 10,
      max: 50
    });
    
    expect(grid.every(item => item.value >= 10 && item.value <= 50)).toBe(true);
  });
});
