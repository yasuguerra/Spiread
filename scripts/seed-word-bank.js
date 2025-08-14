/**
 * Word Bank Seed Script for Phase 3 Games
 * Generates word lists for Letters Grid, Word Search, and Anagrams
 * 
 * Usage:
 * node scripts/seed-word-bank.js
 */

const fs = require('fs');
const path = require('path');

// Letters Grid - Target letters and confusables
const LETTERS_GRID_DATA = {
  es: {
    targets: ['a', 'e', 'i', 'o', 'u', 'n', 's', 'r', 't', 'l', 'd', 'c', 'p', 'm', 'b'],
    confusables: {
      'n': ['m', 'ñ', 'h'],
      'm': ['n', 'rn'],
      'rn': ['m'],
      'cl': ['d'],
      'd': ['cl', 'b'],
      'i': ['l', '1', 'j'],
      'l': ['i', '1', 'I'],
      '1': ['i', 'l', 'I'],
      'o': ['0', 'q'],
      '0': ['o', 'O'],
      'b': ['d', 'p'],
      'p': ['b', 'q'],
      'q': ['p', 'g']
    }
  },
  en: {
    targets: ['a', 'e', 'i', 'o', 'u', 'n', 's', 'r', 't', 'l', 'd', 'c', 'p', 'm', 'b'],
    confusables: {
      'n': ['m', 'h'],
      'm': ['n', 'rn'],
      'rn': ['m'],
      'cl': ['d'],
      'd': ['cl', 'b'],
      'i': ['l', '1', 'j'],
      'l': ['i', '1', 'I'],
      '1': ['i', 'l', 'I'],
      'o': ['0', 'q'],
      '0': ['o', 'O'],
      'b': ['d', 'p'],
      'p': ['b', 'q'],
      'q': ['p', 'g']
    }
  }
};

// Word Search - Common words by length
const WORD_SEARCH_WORDS = {
  es: {
    4: ['casa', 'agua', 'mesa', 'gato', 'vida', 'amor', 'niño', 'mano', 'alto', 'gran'],
    5: ['mundo', 'nuevo', 'mejor', 'negro', 'grupo', 'salir', 'morir', 'tener', 'poder', 'hacer'],
    6: ['grande', 'último', 'tiempo', 'estado', 'miembro', 'nombre', 'cuando', 'camino', 'simple', 'joven'],
    7: ['trabajo', 'empresa', 'ejemplo', 'problema', 'sistema', 'momento', 'mercado', 'persona', 'programa', 'servicio'],
    8: ['historia', 'situación', 'nacional', 'proyecto', 'presente', 'producto', 'sociedad', 'términos', 'posición', 'relación'],
    9: ['importante', 'información', 'diferentes', 'desarrollo', 'presidente', 'condición', 'educación', 'principal', 'necesario', 'resultado'],
    10: ['experiencia', 'comunidad', 'tecnología', 'universidad', 'internacional', 'especial', 'particular', 'economía', 'actividad', 'población']
  },
  en: {
    4: ['time', 'life', 'work', 'home', 'hand', 'good', 'long', 'high', 'make', 'take'],
    5: ['world', 'group', 'place', 'right', 'great', 'small', 'think', 'water', 'where', 'start'],
    6: ['number', 'people', 'school', 'family', 'person', 'office', 'system', 'public', 'market', 'social'],
    7: ['company', 'service', 'problem', 'program', 'through', 'between', 'example', 'process', 'project', 'country'],
    8: ['business', 'question', 'research', 'although', 'community', 'national', 'language', 'interest', 'increase', 'continue'],
    9: ['important', 'education', 'different', 'available', 'including', 'community', 'experience', 'political', 'president', 'according'],
    10: ['government', 'management', 'technology', 'information', 'university', 'development', 'production', 'individual', 'understand', 'everything']
  }
};

// Anagrams - Common words for anagram generation
const ANAGRAM_WORDS = {
  es: {
    4: ['casa', 'mesa', 'amor', 'vida', 'agua', 'gato', 'alto', 'bajo', 'poco', 'más'],
    5: ['mundo', 'nuevo', 'mejor', 'grupo', 'tener', 'hacer', 'poder', 'decir', 'hombre', 'mujer'],
    6: ['grande', 'tiempo', 'estado', 'nombre', 'camino', 'simple', 'joven', 'blanco', 'negro', 'fuerte'],
    7: ['trabajo', 'empresa', 'ejemplo', 'problema', 'sistema', 'momento', 'mercado', 'persona', 'servicio', 'historia'],
    8: ['nacional', 'proyecto', 'presente', 'producto', 'sociedad', 'posición', 'relación', 'programa', 'términos', 'situación']
  },
  en: {
    4: ['time', 'life', 'work', 'home', 'hand', 'good', 'long', 'high', 'make', 'take'],
    5: ['world', 'group', 'place', 'right', 'great', 'small', 'think', 'water', 'where', 'start'],
    6: ['number', 'people', 'school', 'family', 'person', 'office', 'system', 'public', 'market', 'social'],
    7: ['company', 'service', 'problem', 'program', 'through', 'between', 'example', 'process', 'project', 'country'],
    8: ['business', 'question', 'research', 'although', 'language', 'interest', 'increase', 'continue', 'national', 'develop']
  }
};

// Running Words - Simple word lists for sequential display
const RUNNING_WORDS = {
  es: [
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son',
    'con', 'para', 'al', 'una', 'del', 'los', 'as', 'pero', 'muy', 'sin', 'más', 'ser', 'yo', 'todo', 'mi', 'ya',
    'casa', 'agua', 'mesa', 'gato', 'vida', 'amor', 'niño', 'mano', 'alto', 'gran', 'mundo', 'nuevo', 'mejor',
    'negro', 'grupo', 'salir', 'morir', 'tener', 'poder', 'hacer', 'grande', 'último', 'tiempo', 'estado',
    'miembro', 'nombre', 'cuando', 'camino', 'simple', 'joven', 'trabajo', 'empresa', 'ejemplo', 'problema'
  ],
  en: [
    'the', 'of', 'and', 'to', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as', 'with',
    'his', 'they', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what',
    'all', 'were', 'we', 'when', 'time', 'life', 'work', 'home', 'hand', 'good', 'long', 'high', 'make', 'take',
    'world', 'group', 'place', 'right', 'great', 'small', 'think', 'water', 'where', 'start', 'number', 'people',
    'school', 'family', 'person', 'office', 'system', 'public', 'market', 'social', 'company', 'service'
  ]
};

// Generate word bank file
function generateWordBank() {
  const wordBank = {
    lettersGrid: LETTERS_GRID_DATA,
    wordSearch: WORD_SEARCH_WORDS,
    anagrams: ANAGRAM_WORDS,
    runningWords: RUNNING_WORDS,
    meta: {
      generated: new Date().toISOString(),
      version: '1.0',
      totalWords: {
        es: Object.values(WORD_SEARCH_WORDS.es).flat().length + 
            Object.values(ANAGRAM_WORDS.es).flat().length + 
            RUNNING_WORDS.es.length,
        en: Object.values(WORD_SEARCH_WORDS.en).flat().length + 
            Object.values(ANAGRAM_WORDS.en).flat().length + 
            RUNNING_WORDS.en.length
      }
    }
  };

  return wordBank;
}

// Save word bank to lib directory
function saveWordBank() {
  const wordBank = generateWordBank();
  const outputPath = path.join(__dirname, '..', 'lib', 'word-bank.js');
  
  const fileContent = `// Auto-generated word bank for Phase 3 games
// Generated on: ${wordBank.meta.generated}
// Total words: ES=${wordBank.meta.totalWords.es}, EN=${wordBank.meta.totalWords.en}

export const WORD_BANK = ${JSON.stringify(wordBank, null, 2)};

export default WORD_BANK;
`;

  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`✅ Word bank generated: ${outputPath}`);
  console.log(`📊 Stats: ES=${wordBank.meta.totalWords.es} words, EN=${wordBank.meta.totalWords.en} words`);
  
  return outputPath;
}

// Main execution
if (require.main === module) {
  try {
    console.log('🚀 Generating word bank for Phase 3 games...');
    const outputPath = saveWordBank();
    console.log('✅ Word bank generation completed successfully!');
  } catch (error) {
    console.error('❌ Error generating word bank:', error);
    process.exit(1);
  }
}

module.exports = { generateWordBank, saveWordBank };