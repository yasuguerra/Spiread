import { selectPairs, getDifficultyLevel, getFontStyling } from './selectPairs';
import { TWIN_PAIRS } from '../words-es';

describe('selectPairs', () => {
  test('returns correct number of pairs', () => {
    const pairs = selectPairs({
      level: 2,
      count: 8,
      ratioIdentical: 0.5
    });
    
    expect(pairs).toHaveLength(8);
  });

  test('honors ratioIdentical parameter', () => {
    const pairs = selectPairs({
      level: 2,
      count: 10,
      ratioIdentical: 0.3
    });
    
    const identicalCount = pairs.filter(p => p.identical).length;
    const expectedIdentical = Math.round(10 * 0.3);
    
    expect(identicalCount).toBeCloseTo(expectedIdentical, 1);
  });

  test('filters pairs by difficulty level', () => {
    const pairs = selectPairs({
      level: 1,
      count: 8,
      ratioIdentical: 0.5
    });
    
    // All returned pairs should have difficulty <= 1
    pairs.forEach(pair => {
      if (pair.difficulty) {
        expect(pair.difficulty).toBeLessThanOrEqual(1);
      }
    });
  });

  test('no duplicate pairs in a round', () => {
    const pairs = selectPairs({
      level: 3,
      count: 8,
      ratioIdentical: 0.5
    });
    
    const pairStrings = pairs.map(p => `${p.left}|${p.right}|${p.identical}`);
    const uniquePairStrings = new Set(pairStrings);
    
    expect(uniquePairStrings.size).toBe(pairs.length);
  });

  test('includes different pair types', () => {
    const pairs = selectPairs({
      level: 3,
      count: 12,
      ratioIdentical: 0.4
    });
    
    const kinds = new Set(pairs.map(p => p.kind).filter(Boolean));
    
    // Should include multiple types at level 3
    expect(kinds.size).toBeGreaterThan(1);
    expect([...kinds]).toEqual(expect.arrayContaining(['accent', 'glyph', 'minimal']));
  });

  test('identical pairs are actually identical', () => {
    const pairs = selectPairs({
      level: 2,
      count: 8,
      ratioIdentical: 0.5
    });
    
    const identicalPairs = pairs.filter(p => p.identical);
    identicalPairs.forEach(pair => {
      expect(pair.left).toBe(pair.right);
    });
  });

  test('different pairs are actually different', () => {
    const pairs = selectPairs({
      level: 2,
      count: 8,
      ratioIdentical: 0.5
    });
    
    const differentPairs = pairs.filter(p => !p.identical);
    differentPairs.forEach(pair => {
      expect(pair.left).not.toBe(pair.right);
    });
  });

  test('throws error for invalid level', () => {
    expect(() => {
      selectPairs({
        level: 999, // No pairs available at this level
        count: 8,
        ratioIdentical: 0.5
      });
    }).toThrow('No pairs available for level 999');
  });
});

describe('getDifficultyLevel', () => {
  test('returns correct levels based on consecutive correct', () => {
    expect(getDifficultyLevel(0)).toBe(1);
    expect(getDifficultyLevel(2)).toBe(1);
    expect(getDifficultyLevel(3)).toBe(2);
    expect(getDifficultyLevel(5)).toBe(2);
    expect(getDifficultyLevel(6)).toBe(3);
    expect(getDifficultyLevel(8)).toBe(3);
    expect(getDifficultyLevel(9)).toBe(4);
    expect(getDifficultyLevel(15)).toBe(4);
  });
});

describe('getFontStyling', () => {
  test('returns appropriate styling for each level', () => {
    const level1 = getFontStyling(1);
    const level4 = getFontStyling(4);
    
    expect(level1.fontSize).toBe('text-2xl'); // Easier levels have larger text
    expect(level4.fontSize).toBe('text-lg'); // Harder levels have smaller text
    
    expect(level1.fontWeight).toBe('font-normal');
    expect(level4.fontWeight).toBe('font-bold'); // Harder levels have more weight
  });

  test('returns valid CSS classes', () => {
    const styling = getFontStyling(2);
    
    expect(styling.fontSize).toMatch(/^text-/);
    expect(styling.fontWeight).toMatch(/^font-/);
    expect(styling.letterSpacing).toMatch(/^tracking-/);
    expect(styling.lineHeight).toMatch(/^leading-/);
  });
});

describe('TWIN_PAIRS data integrity', () => {
  test('all pairs have required properties', () => {
    TWIN_PAIRS.forEach(pair => {
      expect(pair).toHaveProperty('a');
      expect(pair).toHaveProperty('b');
      expect(pair).toHaveProperty('kind');
      expect(pair).toHaveProperty('difficulty');
      
      expect(typeof pair.a).toBe('string');
      expect(typeof pair.b).toBe('string');
      expect(['accent', 'glyph', 'minimal']).toContain(pair.kind);
      expect(typeof pair.difficulty).toBe('number');
      expect(pair.difficulty).toBeGreaterThan(0);
    });
  });

  test('pairs are actually different (for non-identical pairs)', () => {
    TWIN_PAIRS.forEach(pair => {
      // All pairs in TWIN_PAIRS should represent different words
      expect(pair.a).not.toBe(pair.b);
    });
  });

  test('has good distribution of difficulty levels', () => {
    const difficulties = TWIN_PAIRS.map(p => p.difficulty);
    const uniqueDifficulties = new Set(difficulties);
    
    expect(uniqueDifficulties.size).toBeGreaterThanOrEqual(3); // At least 3 different levels
    expect(Math.max(...difficulties)).toBeGreaterThan(1); // Has advanced levels
  });

  test('has good distribution of pair types', () => {
    const kinds = TWIN_PAIRS.map(p => p.kind);
    const uniqueKinds = new Set(kinds);
    
    expect(uniqueKinds).toContain('accent');
    expect(uniqueKinds).toContain('glyph');
    expect(uniqueKinds).toContain('minimal');
    expect(uniqueKinds.size).toBe(3); // All three types represented
  });
});
