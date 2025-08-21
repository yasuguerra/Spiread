/**
 * Progress Tracking System for Spiread
 * Provides lightweight, login-free persistence with localStorage
 * Designed to be easily synced to Supabase later
 */

export type SessionSummary = {
  gameId: string;
  score: number;
  level?: number;     // or size / difficulty param
  streak?: number;    // if applicable
  accuracy?: number;  // 0..1
  durationSec: number;
  timestamp: number;  // Date.now()
  extras?: Record<string, any>;
};

export type GameProgress = {
  bestScore: number;
  bestLevel: number;
  bestStreak: number;
  lastPlayedAt: number;
  totalSessions: number;
  totalTimeSec: number;
  recentSessions: SessionSummary[]; // Last 10 sessions for trends
};

const STORAGE_VERSION = 'v1';
const STORAGE_PREFIX = `spiread.progress.${STORAGE_VERSION}`;

// Safe localStorage access for SSR compatibility
const isClient = typeof window !== 'undefined';

function getStorageKey(gameId: string): string {
  return `${STORAGE_PREFIX}.${gameId}`;
}

function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function safeLocalStorageGet(key: string): string | null {
  if (!isClient) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  if (!isClient) return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

function safeLocalStorageRemove(key: string): void {
  if (!isClient) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
}

const defaultGameProgress: GameProgress = {
  bestScore: 0,
  bestLevel: 1,
  bestStreak: 0,
  lastPlayedAt: 0,
  totalSessions: 0,
  totalTimeSec: 0,
  recentSessions: []
};

/**
 * Get current progress for a specific game
 */
export function getGameProgress(gameId: string): GameProgress {
  const key = getStorageKey(gameId);
  const stored = safeLocalStorageGet(key);
  
  if (!stored) {
    return { ...defaultGameProgress };
  }
  
  const parsed = safeJsonParse(stored, defaultGameProgress);
  
  // Ensure all required fields exist (migration safety)
  return {
    ...defaultGameProgress,
    ...parsed,
    recentSessions: parsed.recentSessions || []
  };
}

/**
 * Update progress after a game session
 */
export function updateGameProgress(gameId: string, sessionSummary: SessionSummary): GameProgress {
  const current = getGameProgress(gameId);
  
  // Calculate new bests
  const newBestScore = Math.max(current.bestScore, sessionSummary.score);
  const newBestLevel = Math.max(current.bestLevel, sessionSummary.level || 1);
  const newBestStreak = Math.max(current.bestStreak, sessionSummary.streak || 0);
  
  // Update recent sessions (keep last 10)
  const newRecentSessions = [...current.recentSessions, sessionSummary].slice(-10);
  
  const updated: GameProgress = {
    bestScore: newBestScore,
    bestLevel: newBestLevel,
    bestStreak: newBestStreak,
    lastPlayedAt: sessionSummary.timestamp,
    totalSessions: current.totalSessions + 1,
    totalTimeSec: current.totalTimeSec + sessionSummary.durationSec,
    recentSessions: newRecentSessions
  };
  
  // Save to localStorage
  const key = getStorageKey(gameId);
  safeLocalStorageSet(key, JSON.stringify(updated));
  
  return updated;
}

/**
 * Reset progress for a specific game
 */
export function resetGameProgress(gameId: string): void {
  const key = getStorageKey(gameId);
  safeLocalStorageRemove(key);
}

/**
 * Reset all game progress
 */
export function resetAllProgress(): void {
  if (!isClient) return;
  
  try {
    const keys = Object.keys(localStorage);
    const progressKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
    
    progressKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to reset all progress:', error);
  }
}

/**
 * Get progress for all games
 */
export function getAllGamesProgress(): Record<string, GameProgress> {
  if (!isClient) return {};
  
  const progress: Record<string, GameProgress> = {};
  
  try {
    const keys = Object.keys(localStorage);
    const progressKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
    
    progressKeys.forEach(key => {
      const gameId = key.replace(`${STORAGE_PREFIX}.`, '');
      progress[gameId] = getGameProgress(gameId);
    });
  } catch (error) {
    console.warn('Failed to get all progress:', error);
  }
  
  return progress;
}

/**
 * Get simple level tracking (backward compatibility)
 */
export function getLastLevel(gameKey: string): number {
  return getGameProgress(gameKey).bestLevel;
}

/**
 * Set level (backward compatibility)
 */
export function setLastLevel(gameKey: string, level: number): void {
  const current = getGameProgress(gameKey);
  const updated = {
    ...current,
    bestLevel: Math.max(current.bestLevel, level)
  };
  
  const key = getStorageKey(gameKey);
  safeLocalStorageSet(key, JSON.stringify(updated));
}

/**
 * Get best score (backward compatibility)
 */
export function getLastBestScore(gameKey: string): number {
  return getGameProgress(gameKey).bestScore;
}

/**
 * Update best score (backward compatibility)
 */
export function updateBestScore(gameKey: string, score: number): void {
  const current = getGameProgress(gameKey);
  const updated = {
    ...current,
    bestScore: Math.max(current.bestScore, score)
  };
  
  const key = getStorageKey(gameKey);
  safeLocalStorageSet(key, JSON.stringify(updated));
}

// Game ID constants for consistency
export const GAME_IDS = {
  SCHULTE: 'schulte',
  TWIN_WORDS: 'twin_words',
  PAR_IMPAR: 'par_impar',
  MEMORY_DIGITS: 'memory_digits',
  RUNNING_WORDS: 'running_words',
  LETTERS_GRID: 'letters_grid',
  WORD_SEARCH: 'word_search',
  ANAGRAMS: 'anagrams'
} as const;

// TODO: Add hooks for Supabase sync
export async function syncToCloud(userId?: string): Promise<void> {
  // Future implementation for Supabase sync
  console.log('Cloud sync not implemented yet');
}

export async function syncFromCloud(userId?: string): Promise<void> {
  // Future implementation for Supabase sync  
  console.log('Cloud sync not implemented yet');
}
