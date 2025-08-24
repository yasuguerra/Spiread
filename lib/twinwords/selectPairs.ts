import { TWIN_PAIRS, TwinPair } from '../words-es';

export type GamePair = {
  left: string;
  right: string;
  identical: boolean;
  kind?: 'accent' | 'glyph' | 'minimal';
  difficulty?: number;
};

export function selectPairs(params: {
  level: number;
  count: number;
  ratioIdentical: number;
}): GamePair[] {
  const { level, count, ratioIdentical } = params;
  
  // 1) Filter TWIN_PAIRS by difficulty <= level
  const availablePairs = TWIN_PAIRS.filter(pair => pair.difficulty <= level);
  
  if (availablePairs.length === 0) {
    throw new Error(`No pairs available for level ${level}`);
  }
  
  // 2) Calculate how many identical vs different pairs we need
  const numIdentical = Math.round(count * ratioIdentical);
  const numDifferent = count - numIdentical;
  
  const result: GamePair[] = [];
  const usedPairs = new Set<string>();
  
  // 3) Select different pairs first
  const shuffledPairs = [...availablePairs].sort(() => Math.random() - 0.5);
  let differentCount = 0;
  
  for (const pair of shuffledPairs) {
    if (differentCount >= numDifferent) break;
    
    const pairKey = `${pair.a}|${pair.b}`;
    if (!usedPairs.has(pairKey)) {
      result.push({
        left: pair.a,
        right: pair.b,
        identical: false,
        kind: pair.kind,
        difficulty: pair.difficulty
      });
      usedPairs.add(pairKey);
      differentCount++;
    }
  }
  
  // 4) Select identical pairs by duplicating words from available pairs
  let identicalCount = 0;
  const reshuffledPairs = [...availablePairs].sort(() => Math.random() - 0.5);
  
  for (const pair of reshuffledPairs) {
    if (identicalCount >= numIdentical) break;
    
    // Randomly choose either 'a' or 'b' from the pair to duplicate
    const word = Math.random() < 0.5 ? pair.a : pair.b;
    const identicalKey = `${word}|${word}`;
    
    if (!usedPairs.has(identicalKey)) {
      result.push({
        left: word,
        right: word,
        identical: true,
        kind: pair.kind,
        difficulty: pair.difficulty
      });
      usedPairs.add(identicalKey);
      identicalCount++;
    }
  }
  
  // 5) If we don't have enough pairs, fill with random selections
  while (result.length < count && availablePairs.length > 0) {
    const pair = availablePairs[Math.floor(Math.random() * availablePairs.length)];
    const isIdentical = result.filter(p => p.identical).length < numIdentical;
    
    if (isIdentical) {
      const word = Math.random() < 0.5 ? pair.a : pair.b;
      result.push({
        left: word,
        right: word,
        identical: true,
        kind: pair.kind,
        difficulty: pair.difficulty
      });
    } else {
      result.push({
        left: pair.a,
        right: pair.b,
        identical: false,
        kind: pair.kind,
        difficulty: pair.difficulty
      });
    }
  }
  
  // 6) Shuffle final result
  return result.sort(() => Math.random() - 0.5).slice(0, count);
}

// Helper function to get difficulty level based on streak
export function getDifficultyLevel(consecutiveCorrect: number): number {
  if (consecutiveCorrect < 3) return 1;
  if (consecutiveCorrect < 6) return 2;
  if (consecutiveCorrect < 9) return 3;
  return 4;
}

// Helper function to get font styling based on difficulty
export function getFontStyling(level: number) {
  const baseSize = 'text-xl';
  const fontWeights = ['font-normal', 'font-medium', 'font-semibold', 'font-bold'];
  const letterSpacings = ['tracking-normal', 'tracking-tight', 'tracking-tighter', 'tracking-tightest'];
  
  return {
    fontSize: level <= 2 ? 'text-2xl' : level <= 3 ? 'text-xl' : 'text-lg',
    fontWeight: fontWeights[Math.min(level - 1, 3)] || 'font-normal',
    letterSpacing: letterSpacings[Math.min(level - 1, 3)] || 'tracking-normal',
    lineHeight: level <= 2 ? 'leading-relaxed' : level <= 3 ? 'leading-normal' : 'leading-tight'
  };
}
