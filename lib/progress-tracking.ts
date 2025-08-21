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
  ANAGRAMS: 'anagrams',
  RSVP_READER: 'rsvp_reader'
} as const;

/**
 * Utility functions for game logic
 */

// Number generation utilities
export function generateRandomNumber(digitsLen: number): string {
  const min = Math.pow(10, digitsLen - 1);
  const max = Math.pow(10, digitsLen) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

export function generateNumberGrid(k: number, digitsLen: number, hasDistractors: boolean = false): number[] {
  const numbers: number[] = [];
  const min = Math.pow(10, digitsLen - 1);
  const max = Math.pow(10, digitsLen) - 1;
  
  for (let i = 0; i < k; i++) {
    const num = Math.floor(Math.random() * (max - min + 1) + min);
    numbers.push(num);
  }
  
  return numbers;
}

export function generateSchulteNumbers(size: number): number[] {
  const numbers = Array.from({ length: size * size }, (_, i) => i + 1);
  
  // Fisher-Yates shuffle
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  
  return numbers;
}

export function calculateAccuracy(userSelections: number[], correctTargets: number[], rule: 'odd' | 'even'): number {
  if (userSelections.length === 0) return 0;
  
  const correctSelections = userSelections.filter(num => {
    const isCorrectTarget = correctTargets.includes(num);
    const meetsRule = rule === 'odd' ? num % 2 === 1 : num % 2 === 0;
    return isCorrectTarget && meetsRule;
  });
  
  return correctSelections.length / Math.max(userSelections.length, correctTargets.length);
}

/**
 * Legacy/compatibility functions
 */

// For backward compatibility with older game implementations
export async function loadGameProgress(userId: string | null, gameId: string): Promise<GameProgress> {
  // For now, ignore userId and use localStorage
  return getGameProgress(gameId);
}

export async function saveGameProgress(userId: string | null, gameId: string, sessionData: any): Promise<void> {
  // Convert old session data format to new SessionSummary format
  const sessionSummary: SessionSummary = {
    gameId,
    score: sessionData.score || 0,
    level: sessionData.level || 1,
    streak: sessionData.streak || 0,
    accuracy: sessionData.accuracy || 0,
    durationSec: sessionData.timeElapsed || sessionData.durationSec || 0,
    timestamp: Date.now(),
    extras: sessionData
  };
  
  updateGameProgress(gameId, sessionSummary);
}

export function getAllGameProgress(): Record<string, GameProgress> {
  return getAllGamesProgress();
}

export function getGameHistoricalData(gameKey: string, days: number = 7): Promise<any[]> {
  const progress = getGameProgress(gameKey);
  // Return recent sessions for historical data
  return Promise.resolve(progress.recentSessions.slice(-days));
}

export function shouldShowGameIntro(gameKey: string): boolean {
  const progress = getGameProgress(gameKey);
  // Show intro if this is the first time playing (no sessions)
  return progress.totalSessions === 0;
}

// Achievement tracking
export type UserAchievements = {
  earnedBadges: string[];
  lastCheckedAt: number;
};

export function getUserAchievements(): UserAchievements {
  const key = `${STORAGE_PREFIX}.achievements`;
  const stored = safeLocalStorageGet(key);
  
  if (!stored) {
    return {
      earnedBadges: [],
      lastCheckedAt: Date.now()
    };
  }
  
  return safeJsonParse(stored, {
    earnedBadges: [],
    lastCheckedAt: Date.now()
  });
}

export function saveUserAchievements(achievements: UserAchievements): void {
  const key = `${STORAGE_PREFIX}.achievements`;
  safeLocalStorageSet(key, JSON.stringify(achievements));
}

export function getAllGameSessions(): SessionSummary[] {
  const allSessions: SessionSummary[] = [];
  
  Object.values(GAME_IDS).forEach(gameId => {
    const progress = getGameProgress(gameId);
    allSessions.push(...progress.recentSessions);
  });
  
  // Sort by timestamp, most recent first
  return allSessions.sort((a, b) => b.timestamp - a.timestamp);
}

export function getOverallProgress() {
  const sessions = getAllGameSessions();
  const achievements = getUserAchievements();
  const gameProgress: Record<string, GameProgress> = {};
  
  Object.values(GAME_IDS).forEach(gameId => {
    gameProgress[gameId] = getGameProgress(gameId);
  });
  
  return {
    gameSessions: sessions,
    gameProgress,
    achievements: achievements.earnedBadges,
    totalSessions: sessions.length,
    totalTimePlayed: sessions.reduce((sum, s) => sum + s.durationSec, 0),
    avgAccuracy: sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length 
      : 0
  };
}

// TODO: Add hooks for Supabase sync
export async function syncToCloud(userId?: string): Promise<void> {
  // Future implementation for Supabase sync
  console.log('Cloud sync not implemented yet');
}

export async function syncFromCloud(userId?: string): Promise<void> {
  // Future implementation for Supabase sync  
  console.log('Cloud sync not implemented yet');
}
