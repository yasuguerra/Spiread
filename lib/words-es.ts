/**
 * Spanish word pairs for Twin Words game
 * Provides confusable/similar word pairs for discrimination training
 */

export interface WordPair {
  word1: string;
  word2: string;
  category: 'accent' | 'lookAlike' | 'minimalPair' | 'case' | 'identical';
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = easiest, 5 = hardest
}

export const CONFUSABLE_PAIRS: WordPair[] = [
  // Accent variants (Level 1-2)
  { word1: 'practico', word2: 'práctico', category: 'accent', difficulty: 1 },
  { word1: 'esta', word2: 'está', category: 'accent', difficulty: 1 },
  { word1: 'mas', word2: 'más', category: 'accent', difficulty: 1 },
  { word1: 'si', word2: 'sí', category: 'accent', difficulty: 1 },
  { word1: 'tu', word2: 'tú', category: 'accent', difficulty: 1 },
  { word1: 'te', word2: 'té', category: 'accent', difficulty: 1 },
  { word1: 'el', word2: 'él', category: 'accent', difficulty: 1 },
  { word1: 'mi', word2: 'mí', category: 'accent', difficulty: 1 },
  { word1: 'se', word2: 'sé', category: 'accent', difficulty: 1 },
  { word1: 'de', word2: 'dé', category: 'accent', difficulty: 1 },
  { word1: 'medico', word2: 'médico', category: 'accent', difficulty: 2 },
  { word1: 'rapido', word2: 'rápido', category: 'accent', difficulty: 2 },
  { word1: 'telefono', word2: 'teléfono', category: 'accent', difficulty: 2 },
  { word1: 'musica', word2: 'música', category: 'accent', difficulty: 2 },
  { word1: 'publico', word2: 'público', category: 'accent', difficulty: 2 },
  
  // Look-alike glyphs (Level 2-3)
  { word1: 'amor', word2: 'arnor', category: 'lookAlike', difficulty: 2 },
  { word1: 'claro', word2: 'daro', category: 'lookAlike', difficulty: 2 },
  { word1: 'mundo', word2: 'rnundo', category: 'lookAlike', difficulty: 2 },
  { word1: 'tiempo', word2: 'tiernpo', category: 'lookAlike', difficulty: 2 },
  { word1: 'persona', word2: 'persorna', category: 'lookAlike', difficulty: 2 },
  { word1: 'momento', word2: 'mornento', category: 'lookAlike', difficulty: 2 },
  { word1: 'problema', word2: 'problerna', category: 'lookAlike', difficulty: 3 },
  { word1: 'gobierno', word2: 'gobiemo', category: 'lookAlike', difficulty: 3 },
  { word1: 'desarrollo', word2: 'desarroilo', category: 'lookAlike', difficulty: 3 },
  { word1: 'leer', word2: 'beer', category: 'lookAlike', difficulty: 3 },
  { word1: 'vino', word2: 'vmo', category: 'lookAlike', difficulty: 3 },
  { word1: 'luna', word2: 'luma', category: 'lookAlike', difficulty: 3 },
  
  // Minimal pairs (Level 3-4)
  { word1: 'casa', word2: 'caza', category: 'minimalPair', difficulty: 3 },
  { word1: 'peso', word2: 'piso', category: 'minimalPair', difficulty: 3 },
  { word1: 'perro', word2: 'perno', category: 'minimalPair', difficulty: 3 },
  { word1: 'carro', word2: 'corro', category: 'minimalPair', difficulty: 3 },
  { word1: 'mano', word2: 'nano', category: 'minimalPair', difficulty: 3 },
  { word1: 'cosa', word2: 'rosa', category: 'minimalPair', difficulty: 3 },
  { word1: 'besar', word2: 'pesar', category: 'minimalPair', difficulty: 4 },
  { word1: 'trabajo', word2: 'trabaja', category: 'minimalPair', difficulty: 4 },
  { word1: 'escribir', word2: 'escnbir', category: 'minimalPair', difficulty: 4 },
  { word1: 'estudiar', word2: 'estuciar', category: 'minimalPair', difficulty: 4 },
  { word1: 'general', word2: 'generai', category: 'minimalPair', difficulty: 4 },
  
  // Case differences (Level 4-5)
  { word1: 'CASA', word2: 'casa', category: 'case', difficulty: 4 },
  { word1: 'Mundo', word2: 'mundo', category: 'case', difficulty: 4 },
  { word1: 'TIEMPO', word2: 'tiempo', category: 'case', difficulty: 4 },
  { word1: 'España', word2: 'españa', category: 'case', difficulty: 4 },
  { word1: 'Madrid', word2: 'madrid', category: 'case', difficulty: 5 },
  { word1: 'Barcelona', word2: 'barcelona', category: 'case', difficulty: 5 },
  
  // Identical pairs (used for training, all levels)
  { word1: 'casa', word2: 'casa', category: 'identical', difficulty: 1 },
  { word1: 'tiempo', word2: 'tiempo', category: 'identical', difficulty: 1 },
  { word1: 'trabajo', word2: 'trabajo', category: 'identical', difficulty: 1 },
  { word1: 'persona', word2: 'persona', category: 'identical', difficulty: 1 },
  { word1: 'momento', word2: 'momento', category: 'identical', difficulty: 1 },
  { word1: 'problema', word2: 'problema', category: 'identical', difficulty: 1 },
  { word1: 'gobierno', word2: 'gobierno', category: 'identical', difficulty: 1 },
  { word1: 'desarrollo', word2: 'desarrollo', category: 'identical', difficulty: 1 },
];

/**
 * Get confusable pairs based on difficulty level
 * @param level Difficulty level (1-5)
 * @param count Number of pairs to return
 * @param identicalRatio Ratio of identical pairs (0-1)
 * @returns Array of word pairs
 */
export function getConfusablePairs(
  level: number = 1,
  count: number = 6,
  identicalRatio: number = 0.3
): Array<[string, string]> {
  // Filter pairs by difficulty level
  const availablePairs = CONFUSABLE_PAIRS.filter(pair => 
    pair.difficulty <= level
  );
  
  // Calculate counts
  const identicalCount = Math.floor(count * identicalRatio);
  const differentCount = count - identicalCount;
  
  // Get identical pairs
  const identicalPairs = availablePairs
    .filter(pair => pair.category === 'identical')
    .sort(() => Math.random() - 0.5)
    .slice(0, identicalCount);
  
  // Get different pairs
  const differentPairs = availablePairs
    .filter(pair => pair.category !== 'identical')
    .sort(() => Math.random() - 0.5)
    .slice(0, differentCount);
  
  // Combine and shuffle
  const allPairs = [...identicalPairs, ...differentPairs]
    .sort(() => Math.random() - 0.5)
    .map(pair => [pair.word1, pair.word2] as [string, string]);
  
  return allPairs;
}

/**
 * Check if two words are identical (accounting for normalization)
 * @param word1 First word
 * @param word2 Second word
 * @returns True if words are identical
 */
export function areWordsIdentical(word1: string, word2: string): boolean {
  return word1 === word2;
}

/**
 * Get difficulty level based on category
 * @param category Word pair category
 * @returns Suggested difficulty level
 */
export function getDifficultyForCategory(category: WordPair['category']): number {
  switch (category) {
    case 'identical': return 1;
    case 'accent': return 2;
    case 'lookAlike': return 3;
    case 'minimalPair': return 4;
    case 'case': return 5;
    default: return 1;
  }
}
