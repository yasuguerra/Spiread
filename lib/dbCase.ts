/**
 * Database Case Conversion Utilities
 * Converts between camelCase (UI/TS) and snake_case (DB) naming conventions
 */

/**
 * Convert a camelCase string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert a snake_case string to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Deep convert object keys from camelCase to snake_case
 */
export function toSnake(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnake(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = toSnakeCase(key);
      result[snakeKey] = toSnake(value);
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Deep convert object keys from snake_case to camelCase
 */
export function toCamel(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamel(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      result[camelKey] = toCamel(value);
    }
    
    return result;
  }
  
  return obj;
}

/**
 * Convert database response to camelCase format
 */
export function fromDbFormat<T = any>(data: any): T {
  return toCamel(data) as T;
}

/**
 * Convert UI data to database format (snake_case)
 */
export function toDbFormat<T = any>(data: any): T {
  return toSnake(data) as T;
}

/**
 * Utility for converting common field mappings
 */
export const COMMON_FIELD_MAPPINGS = {
  // User fields
  userId: 'user_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  // Game fields  
  gameRuns: 'game_runs',
  difficultyLevel: 'difficulty_level',
  durationMs: 'duration_ms',
  
  // Settings fields
  wpmTarget: 'wpm_target',
  chunkSize: 'chunk_size',
  fontSize: 'font_size',
  soundEnabled: 'sound_enabled',
  showInstructions: 'show_instructions',
  
  // Session fields
  wpmStart: 'wpm_start',
  wpmEnd: 'wpm_end',
  comprehensionScore: 'comprehension_score',
  exerciseType: 'exercise_type',
  durationSeconds: 'duration_seconds',
  textLength: 'text_length',
  
  // AI fields
  cacheKey: 'cache_key',
  inputHash: 'input_hash',
  outputText: 'output_text',
  requestType: 'request_type',
  tokenCount: 'token_count',
  lastAccessedAt: 'last_accessed_at',
  accessCount: 'access_count',
  
  // Achievement fields  
  achievementType: 'achievement_type',
  unlockedAt: 'unlocked_at',
  
  // Streak fields
  lastActivityDate: 'last_activity_date',
  
  // Session schedule fields
  sessionSchedules: 'session_schedules',
  startedAt: 'started_at',
  completedAt: 'completed_at',
  totalScore: 'total_score',
  
  // Word bank fields
  wordBank: 'word_bank',
  frequencyRank: 'frequency_rank'
} as const;

/**
 * Type-safe field mapping utility
 */
export function mapFieldName(camelCaseField: keyof typeof COMMON_FIELD_MAPPINGS): string {
  return COMMON_FIELD_MAPPINGS[camelCaseField] || toSnakeCase(camelCaseField);
}

/**
 * Validate that an object has been properly converted
 */
export function validateDbFormat(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return true;
  
  const keys = Object.keys(obj);
  return keys.every(key => !key.includes('_') || key === key.toLowerCase());
}

/**
 * Validate that an object is in camelCase format
 */
export function validateCamelFormat(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return true;
  
  const keys = Object.keys(obj);
  return keys.every(key => !key.includes('_'));
}