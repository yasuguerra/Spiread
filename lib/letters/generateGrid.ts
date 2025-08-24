/**
 * Fast, synchronous grid generation for Letters Grid game
 * Ensures no async race conditions and < 600ms render on phones
 */

export type GridCell = {
  id: string;
  char: string;
  isTarget: boolean;
};

export interface GenerateGridArgs {
  rows: number;
  cols: number;
  targetLetter: string;
  targetCount: number;
  confusables: string[];
}

/**
 * Generates a grid with guaranteed target letters and confusable fillers
 * @param args Grid generation parameters
 * @returns Array of grid cells in row-major order
 */
export function generateGrid(args: GenerateGridArgs): GridCell[] {
  const { rows, cols, targetLetter, targetCount, confusables } = args;
  
  const totalCells = rows * cols;
  const grid: GridCell[] = [];
  
  // Validate inputs
  if (targetCount > totalCells) {
    throw new Error(`Cannot place ${targetCount} targets in ${totalCells} cells`);
  }
  
  if (targetCount < 1) {
    throw new Error('Must have at least 1 target');
  }
  
  // Create array of all positions
  const positions = Array.from({ length: totalCells }, (_, i) => i);
  
  // Shuffle positions using Fisher-Yates algorithm for even distribution
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // Place target letters first
  const targetPositions = positions.slice(0, targetCount);
  const nonTargetPositions = positions.slice(targetCount);
  
  // Initialize all cells as non-targets
  for (let i = 0; i < totalCells; i++) {
    grid[i] = {
      id: `cell-${i}`,
      char: '',
      isTarget: false
    };
  }
  
  // Place targets
  targetPositions.forEach(pos => {
    grid[pos] = {
      id: `cell-${pos}`,
      char: targetLetter,
      isTarget: true
    };
  });
  
  // Fill remaining cells with confusables
  // If no confusables provided, use a default set
  const fillers = confusables.length > 0 ? confusables : [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ].filter(char => char !== targetLetter);
  
  // Ensure we have enough fillers
  if (fillers.length === 0) {
    throw new Error('No confusable characters available for filling grid');
  }
  
  // Fill non-target positions
  nonTargetPositions.forEach(pos => {
    const randomChar = fillers[Math.floor(Math.random() * fillers.length)];
    grid[pos] = {
      id: `cell-${pos}`,
      char: randomChar,
      isTarget: false
    };
  });
  
  return grid;
}

/**
 * Helper function to get confusable letters for a target
 * @param targetLetter The target letter
 * @returns Array of confusable letters
 */
export function getConfusables(targetLetter: string): string[] {
  const confusableMap: Record<string, string[]> = {
    'A': ['Á', 'À', 'Ä', 'Â', 'Ã', 'H', 'R'],
    'B': ['D', 'P', 'R', '8'],
    'C': ['G', 'O', 'Q', '('],
    'D': ['B', 'P', 'O', '0'],
    'E': ['F', 'B', 'É', 'È', 'Ë', 'Ê'],
    'F': ['E', 'P', 'T'],
    'G': ['C', 'O', 'Q', '6', '9'],
    'H': ['A', 'N', 'U'],
    'I': ['L', '1', 'l', 'J', 'Í', 'Ì', 'Ï', 'Î'],
    'J': ['I', 'L', '1'],
    'K': ['R', 'X'],
    'L': ['I', '1', 'J', 'T'],
    'M': ['N', 'W', 'H'],
    'N': ['M', 'H', 'U', 'Ñ'],
    'O': ['C', 'G', 'Q', '0', 'Ó', 'Ò', 'Ö', 'Ô', 'Õ'],
    'P': ['B', 'D', 'F', 'R'],
    'Q': ['C', 'G', 'O', '0'],
    'R': ['A', 'B', 'P', 'K'],
    'S': ['5', '$', 'Z'],
    'T': ['F', 'L', '7'],
    'U': ['N', 'H', 'V', 'Ú', 'Ù', 'Ü', 'Û'],
    'V': ['U', 'Y'],
    'W': ['M', 'N', 'V'],
    'X': ['K', '+'],
    'Y': ['V', 'T'],
    'Z': ['S', '2']
  };
  
  return confusableMap[targetLetter.toUpperCase()] || ['A', 'B', 'C', 'D', 'E'];
}

/**
 * Quick generation with sensible defaults for Letters Grid
 * @param level Game level (1-20)
 * @returns Grid configuration for the level
 */
export function getGridConfig(level: number): {
  rows: number;
  cols: number;
  targetLetter: string;
  targetCount: number;
  confusables: string[];
} {
  // Progressive difficulty
  const size = Math.min(5 + Math.floor(level / 3), 8); // 5x5 to 8x8
  const targetCount = Math.min(1 + Math.floor(level / 5), 6); // 1 to 6 targets
  
  // Common target letters that are easily recognizable
  const targetLetters = ['A', 'E', 'O', 'B', 'D', 'P', 'C', 'G', 'H', 'N'];
  const targetLetter = targetLetters[level % targetLetters.length];
  
  return {
    rows: size,
    cols: size,
    targetLetter,
    targetCount,
    confusables: getConfusables(targetLetter)
  };
}
