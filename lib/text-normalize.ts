/**
 * Spanish Text Normalization
 * Handles accent stripping, case normalization, and special characters
 * for input matching while preserving display formatting
 */

// Map of Spanish accented characters to their base forms
const ACCENT_MAP: Record<string, string> = {
  'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ā': 'a', 'ă': 'a', 'ą': 'a',
  'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'ē': 'e', 'ė': 'e', 'ę': 'e',
  'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i', 'ī': 'i', 'į': 'i',
  'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'ō': 'o', 'õ': 'o', 'ø': 'o',
  'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'ū': 'u', 'ů': 'u', 'ų': 'u',
  'ñ': 'n',
  'ç': 'c', 'ć': 'c', 'č': 'c',
  'ş': 's', 'š': 's', 'ś': 's',
  'ğ': 'g',
  'ı': 'i',
  'ł': 'l',
  'ř': 'r',
  'ž': 'z', 'ź': 'z', 'ż': 'z'
};

// Build reverse map for uppercase
const UPPERCASE_ACCENT_MAP: Record<string, string> = {};
Object.entries(ACCENT_MAP).forEach(([accented, base]) => {
  UPPERCASE_ACCENT_MAP[accented.toUpperCase()] = base.toUpperCase();
});

const FULL_ACCENT_MAP = { ...ACCENT_MAP, ...UPPERCASE_ACCENT_MAP };

/**
 * Normalize text for comparison by removing accents and special characters
 * @param text - Input text to normalize
 * @param options - Normalization options
 */
export function normalizeText(
  text: string,
  options: {
    removeAccents?: boolean;
    toLowerCase?: boolean;
    removeSpaces?: boolean;
    removePunctuation?: boolean;
  } = {}
): string {
  const {
    removeAccents = true,
    toLowerCase = true,
    removeSpaces = false,
    removePunctuation = false
  } = options;

  let normalized = text;

  // Unicode normalization (NFKD - canonical decomposition with compatibility)
  if (typeof normalized.normalize === 'function') {
    normalized = normalized.normalize('NFKD');
  }

  // Remove accents using our map
  if (removeAccents) {
    normalized = normalized
      .split('')
      .map(char => FULL_ACCENT_MAP[char] || char)
      .join('');
    
    // Also remove combining diacritical marks (fallback)
    normalized = normalized.replace(/[\u0300-\u036f]/g, '');
  }

  // Convert to lowercase
  if (toLowerCase) {
    normalized = normalized.toLowerCase();
  }

  // Remove spaces
  if (removeSpaces) {
    normalized = normalized.replace(/\s+/g, '');
  }

  // Remove punctuation
  if (removePunctuation) {
    normalized = normalized.replace(/[^\w\s]/g, '');
  }

  return normalized;
}

/**
 * Compare two texts with normalization
 * @param text1 - First text to compare
 * @param text2 - Second text to compare
 * @param options - Comparison options
 */
export function compareTexts(
  text1: string,
  text2: string,
  options: {
    ignoreAccents?: boolean;
    ignoreCase?: boolean;
    ignoreSpaces?: boolean;
    ignorePunctuation?: boolean;
    strict?: boolean; // If true, must match exactly after normalization
  } = {}
): boolean {
  const {
    ignoreAccents = true,
    ignoreCase = true,
    ignoreSpaces = false,
    ignorePunctuation = false,
    strict = true
  } = options;

  const normalizeOptions = {
    removeAccents: ignoreAccents,
    toLowerCase: ignoreCase,
    removeSpaces: ignoreSpaces,
    removePunctuation: ignorePunctuation
  };

  const normalized1 = normalizeText(text1, normalizeOptions);
  const normalized2 = normalizeText(text2, normalizeOptions);

  if (strict) {
    return normalized1 === normalized2;
  } else {
    // Fuzzy matching - check if one contains the other
    return normalized1.includes(normalized2) || normalized2.includes(normalized1);
  }
}

/**
 * Check if input matches any of the valid answers
 * @param input - User input
 * @param validAnswers - Array of valid answers
 * @param options - Matching options
 */
export function matchesAnyAnswer(
  input: string,
  validAnswers: string[],
  options: {
    ignoreAccents?: boolean;
    ignoreCase?: boolean;
    allowPartial?: boolean;
    minLength?: number;
  } = {}
): { matches: boolean; matchedAnswer?: string } {
  const {
    ignoreAccents = true,
    ignoreCase = true,
    allowPartial = false,
    minLength = 2
  } = options;

  if (input.length < minLength) {
    return { matches: false };
  }

  for (const answer of validAnswers) {
    const matches = compareTexts(input, answer, {
      ignoreAccents,
      ignoreCase,
      strict: !allowPartial
    });

    if (matches) {
      return { matches: true, matchedAnswer: answer };
    }
  }

  return { matches: false };
}

/**
 * Get suggestions for misspelled words
 * @param input - User input
 * @param dictionary - Array of valid words
 * @param maxSuggestions - Maximum number of suggestions to return
 */
export function getSuggestions(
  input: string,
  dictionary: string[],
  maxSuggestions: number = 3
): string[] {
  const normalizedInput = normalizeText(input);
  const suggestions: Array<{ word: string; score: number }> = [];

  dictionary.forEach(word => {
    const normalizedWord = normalizeText(word);
    const score = calculateSimilarity(normalizedInput, normalizedWord);
    
    if (score > 0.6) { // Threshold for similarity
      suggestions.push({ word, score });
    }
  });

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map(s => s.word);
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,     // deletion
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * Extended Spanish dictionary for common words
 */
export const SPANISH_COMMON_WORDS = [
  // Articles
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  
  // Common verbs
  'ser', 'estar', 'tener', 'hacer', 'decir', 'dar', 'ver', 'saber', 'querer', 'poder',
  'ir', 'venir', 'llegar', 'pasar', 'quedar', 'poner', 'parecer', 'seguir', 'encontrar',
  'creer', 'hablar', 'llevar', 'dejar', 'vivir', 'sentir', 'salir', 'volver', 'tomar',
  
  // Common nouns
  'casa', 'año', 'día', 'tiempo', 'vida', 'mano', 'hombre', 'mujer', 'niño', 'niña',
  'trabajo', 'agua', 'fuego', 'tierra', 'aire', 'sol', 'luna', 'estrella', 'cielo',
  'mar', 'río', 'montaña', 'árbol', 'flor', 'animal', 'perro', 'gato', 'pájaro',
  
  // Common adjectives
  'grande', 'pequeño', 'bueno', 'malo', 'nuevo', 'viejo', 'joven', 'mayor', 'mejor',
  'peor', 'alto', 'bajo', 'largo', 'corto', 'ancho', 'estrecho', 'grueso', 'delgado',
  'fuerte', 'débil', 'rápido', 'lento', 'fácil', 'difícil', 'importante', 'necesario',
  
  // Colors
  'blanco', 'negro', 'rojo', 'azul', 'verde', 'amarillo', 'naranja', 'rosa', 'morado',
  'gris', 'marrón', 'dorado', 'plateado',
  
  // Numbers
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'veinte', 'treinta', 'cuarenta',
  'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa', 'cien', 'mil', 'millón',
  
  // Common words with accents (for testing)
  'más', 'también', 'después', 'sólo', 'así', 'aquí', 'allí', 'qué', 'cómo', 'cuándo',
  'dónde', 'quién', 'cuál', 'cuánto', 'había', 'tendría', 'estaría', 'sería',
  'corazón', 'canción', 'razón', 'situación', 'atención', 'información', 'educación',
  'niñez', 'español', 'inglés', 'francés', 'alemán', 'japonés', 'chino', 'ruso'
];

/**
 * Filter words by category and difficulty
 */
export function getWordsByCategory(
  category: 'common' | 'verbs' | 'nouns' | 'adjectives' | 'colors' | 'numbers' | 'accented',
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): string[] {
  let words: string[] = [];
  
  switch (category) {
    case 'common':
      words = SPANISH_COMMON_WORDS.slice(0, 50);
      break;
    case 'verbs':
      words = SPANISH_COMMON_WORDS.slice(8, 28);
      break;
    case 'nouns':
      words = SPANISH_COMMON_WORDS.slice(28, 48);
      break;
    case 'adjectives':
      words = SPANISH_COMMON_WORDS.slice(48, 68);
      break;
    case 'colors':
      words = SPANISH_COMMON_WORDS.slice(68, 81);
      break;
    case 'numbers':
      words = SPANISH_COMMON_WORDS.slice(81, 106);
      break;
    case 'accented':
      words = SPANISH_COMMON_WORDS.filter(word => /[áéíóúñ]/i.test(word));
      break;
  }
  
  // Filter by difficulty (word length)
  switch (difficulty) {
    case 'easy':
      return words.filter(word => word.length <= 5);
    case 'medium':
      return words.filter(word => word.length >= 4 && word.length <= 8);
    case 'hard':
      return words.filter(word => word.length >= 6);
    default:
      return words;
  }
}

/**
 * Validate if a word exists in Spanish dictionary
 */
export function isValidSpanishWord(word: string): boolean {
  const normalized = normalizeText(word);
  return SPANISH_COMMON_WORDS.some(dictWord => 
    normalizeText(dictWord) === normalized
  );
}

/**
 * Clean and validate user input for Spanish text games
 */
export function cleanSpanishInput(input: string): {
  cleaned: string;
  isValid: boolean;
  suggestions: string[];
} {
  // Basic cleaning
  const cleaned = input.trim();
  
  if (cleaned.length === 0) {
    return { cleaned: '', isValid: false, suggestions: [] };
  }
  
  // Check if valid
  const isValid = isValidSpanishWord(cleaned);
  
  // Get suggestions if not valid
  const suggestions = isValid ? [] : getSuggestions(cleaned, SPANISH_COMMON_WORDS, 3);
  
  return { cleaned, isValid, suggestions };
}
