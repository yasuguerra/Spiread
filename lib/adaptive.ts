/**
 * Adaptive Difficulty System
 * Implements 3-down/1-up staircase procedure targeting ~79% success rate
 */

export interface StaircaseState {
  currentLevel: number;
  correctCount: number;
  incorrectCount: number;
  reversals: number;
  lastDirection: 'up' | 'down' | null;
  stepSize: number;
  minLevel: number;
  maxLevel: number;
}

export function createStaircase(
  initialLevel: number = 1,
  minLevel: number = 1,
  maxLevel: number = 20,
  initialStepSize: number = 1
): StaircaseState {
  return {
    currentLevel: initialLevel,
    correctCount: 0,
    incorrectCount: 0,
    reversals: 0,
    lastDirection: null,
    stepSize: initialStepSize,
    minLevel,
    maxLevel
  };
}

export function updateStaircase(
  state: StaircaseState,
  isCorrect: boolean
): StaircaseState {
  const newState = { ...state };

  if (isCorrect) {
    newState.correctCount++;
    newState.incorrectCount = 0; // Reset incorrect count on success
    
    // 3-down rule: increase difficulty after 3 consecutive correct
    if (newState.correctCount >= 3) {
      const oldDirection = newState.lastDirection;
      newState.lastDirection = 'up';
      
      if (oldDirection === 'down') {
        newState.reversals++;
        // Reduce step size after reversals for convergence
        if (newState.reversals >= 4) {
          newState.stepSize = Math.max(0.5, newState.stepSize * 0.8);
        }
      }
      
      newState.currentLevel = Math.min(
        newState.maxLevel,
        newState.currentLevel + newState.stepSize
      );
      newState.correctCount = 0;
    }
  } else {
    newState.incorrectCount++;
    newState.correctCount = 0; // Reset correct count on failure
    
    // 1-up rule: decrease difficulty immediately on incorrect
    const oldDirection = newState.lastDirection;
    newState.lastDirection = 'down';
    
    if (oldDirection === 'up') {
      newState.reversals++;
      // Reduce step size after reversals for convergence
      if (newState.reversals >= 4) {
        newState.stepSize = Math.max(0.5, newState.stepSize * 0.8);
      }
    }
    
    newState.currentLevel = Math.max(
      newState.minLevel,
      newState.currentLevel - newState.stepSize
    );
  }

  return newState;
}

export function getThresholdEstimate(state: StaircaseState): number {
  // Return current level as threshold estimate
  // In practice, you'd average the last N reversals
  return state.currentLevel;
}

// Game-specific adaptation parameters
export interface AdaptationConfig {
  gameId: string;
  parameterName: string;
  initialValue: number;
  minValue: number;
  maxValue: number;
  stepSize: number;
  targetAccuracy: number; // 0.79 for 3-down/1-up
}

export const ADAPTATION_CONFIGS: Record<string, AdaptationConfig> = {
  twin_words: {
    gameId: 'twin_words',
    parameterName: 'confusability',
    initialValue: 1,
    minValue: 1,
    maxValue: 5,
    stepSize: 0.5,
    targetAccuracy: 0.79
  },
  schulte: {
    gameId: 'schulte',
    parameterName: 'gridSize',
    initialValue: 3,
    minValue: 3,
    maxValue: 8,
    stepSize: 0.5,
    targetAccuracy: 0.79
  },
  par_impar: {
    gameId: 'par_impar',
    parameterName: 'exposureMs',
    initialValue: 1500,
    minValue: 200,
    maxValue: 3000,
    stepSize: 100,
    targetAccuracy: 0.79
  },
  memory_digits: {
    gameId: 'memory_digits',
    parameterName: 'sequenceLength',
    initialValue: 4,
    minValue: 3,
    maxValue: 12,
    stepSize: 0.5,
    targetAccuracy: 0.79
  },
  word_search: {
    gameId: 'word_search',
    parameterName: 'complexity',
    initialValue: 1,
    minValue: 1,
    maxValue: 5,
    stepSize: 0.5,
    targetAccuracy: 0.79
  }
};

// Utility function for games to get adapted parameter
export function getAdaptedParameter(
  gameId: string,
  recentSessions: any[],
  defaultValue?: number
): number {
  const config = ADAPTATION_CONFIGS[gameId];
  if (!config) {
    return defaultValue || 1;
  }

  // Use default if not enough data
  if (recentSessions.length < 3) {
    return defaultValue || config.initialValue;
  }

  // Create staircase from config
  let staircase = createStaircase(
    defaultValue || config.initialValue,
    config.minValue,
    config.maxValue,
    config.stepSize
  );

  // Apply recent sessions to staircase
  recentSessions.slice(-10).forEach(session => {
    const isCorrect = (session.accuracy || 0) >= config.targetAccuracy;
    staircase = updateStaircase(staircase, isCorrect);
  });

  return Math.round(staircase.currentLevel * 10) / 10; // Round to 1 decimal
}

// Helper function to calculate moving average accuracy
export function getMovingAccuracy(sessions: any[], windowSize: number = 5): number {
  if (sessions.length === 0) return 0;
  
  const recentSessions = sessions.slice(-windowSize);
  const totalAccuracy = recentSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0);
  return totalAccuracy / recentSessions.length;
}

// Helper function to determine if difficulty should change
export function shouldAdjustDifficulty(sessions: any[], windowSize: number = 5): {
  shouldIncrease: boolean;
  shouldDecrease: boolean;
  currentAccuracy: number;
} {
  const accuracy = getMovingAccuracy(sessions, windowSize);
  
  return {
    shouldIncrease: accuracy > 0.85, // Too easy
    shouldDecrease: accuracy < 0.70, // Too hard
    currentAccuracy: accuracy
  };
}

// Game-specific parameter calculators
export function adaptTwinWordsComplexity(recentSessions: any[]): {
  useConfusableFonts: boolean;
  useAccents: boolean;
  timePressure: number;
} {
  const adapted = getAdaptedParameter('twin_words', recentSessions, 1);
  
  return {
    useConfusableFonts: adapted >= 2,
    useAccents: adapted >= 3,
    timePressure: Math.max(0.5, 2 - (adapted * 0.3)) // Shorter time at higher levels
  };
}

export function adaptSchulteComplexity(recentSessions: any[]): {
  gridSize: number;
  exposureTime: number;
} {
  const adapted = getAdaptedParameter('schulte', recentSessions, 3);
  
  return {
    gridSize: Math.max(3, Math.min(8, Math.round(adapted))),
    exposureTime: Math.max(500, 2000 - (adapted * 200)) // Shorter exposure at higher levels
  };
}

export function adaptParImparComplexity(recentSessions: any[]): {
  exposureMs: number;
  gridComplexity: number;
} {
  const adapted = getAdaptedParameter('par_impar', recentSessions, 1500);
  
  return {
    exposureMs: Math.max(200, Math.min(3000, adapted)),
    gridComplexity: adapted < 800 ? 2 : adapted < 500 ? 3 : 1 // More complex grids at faster speeds
  };
}

export function adaptMemoryDigitsComplexity(recentSessions: any[]): {
  sequenceLength: number;
  presentationSpeed: number;
} {
  const adapted = getAdaptedParameter('memory_digits', recentSessions, 4);
  
  return {
    sequenceLength: Math.max(3, Math.min(12, Math.round(adapted))),
    presentationSpeed: Math.max(400, 1000 - (adapted * 50)) // Faster presentation at higher levels
  };
}

export function adaptWordSearchComplexity(recentSessions: any[]): {
  allowDiagonals: boolean;
  allowReverse: boolean;
  gridSize: number;
  wordCount: number;
} {
  const adapted = getAdaptedParameter('word_search', recentSessions, 1);
  
  return {
    allowDiagonals: adapted >= 2,
    allowReverse: adapted >= 3,
    gridSize: Math.max(8, Math.min(15, 8 + Math.floor(adapted))),
    wordCount: Math.max(3, Math.min(10, 3 + Math.floor(adapted / 1.5)))
  };
}
