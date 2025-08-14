import { supabase } from './supabase';

// XP and Level calculations
export function calculateLevel(xp) {
  return Math.floor(xp / 1000) + 1;
}

export function getXpForLevel(level) {
  return (level - 1) * 1000;
}

export function getXpToNextLevel(xp) {
  const currentLevel = calculateLevel(xp);
  const nextLevelXp = getXpForLevel(currentLevel + 1);
  return nextLevelXp - xp;
}

export function calculateXpGain(score) {
  // Clamp score between 0 and 300 as specified
  return Math.max(0, Math.min(300, Math.floor(score)));
}

// Update user profile with XP gain
export async function updateUserProfile(userId, xpGain) {
  try {
    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return null;
    }

    const currentXp = profile?.xp || 0;
    const newXp = currentXp + xpGain;
    const newLevel = calculateLevel(newXp);

    // Upsert profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        xp: newXp,
        level: newLevel,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return {
      xp: newXp,
      level: newLevel,
      xpGain,
      levelUp: profile ? newLevel > calculateLevel(currentXp) : false
    };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
}

// Update streak
export async function updateStreak(userId, isValidRun = true) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current streak
    const { data: streak, error: fetchError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching streak:', fetchError);
      return null;
    }

    let newCurrent = 0;
    let newLongest = streak?.longest || 0;

    if (isValidRun) {
      if (streak && streak.last_activity_date === today) {
        // Same day, don't increment
        newCurrent = streak.current;
      } else if (streak && streak.last_activity_date === getPreviousDate(today)) {
        // Consecutive day
        newCurrent = streak.current + 1;
      } else {
        // First day or broken streak
        newCurrent = 1;
      }
      
      newLongest = Math.max(newLongest, newCurrent);
    } else {
      // Invalid run breaks streak
      newCurrent = 0;
    }

    // Upsert streak
    const { data, error } = await supabase
      .from('streaks')
      .upsert({
        user_id: userId,
        current: newCurrent,
        longest: newLongest,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating streak:', error);
      return null;
    }

    return {
      current: newCurrent,
      longest: newLongest,
      increased: isValidRun && newCurrent > (streak?.current || 0)
    };
  } catch (error) {
    console.error('Error in updateStreak:', error);
    return null;
  }
}

// Helper function to get previous date
function getPreviousDate(dateString) {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

// Check and unlock achievements
export async function checkAchievements(userId, gameData) {
  try {
    const achievements = [];
    
    // Get existing achievements
    const { data: existing, error: fetchError } = await supabase
      .from('achievements')
      .select('achievement_type')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching achievements:', fetchError);
      return [];
    }

    const existingTypes = existing?.map(a => a.achievement_type) || [];

    // Check first_run achievement
    if (!existingTypes.includes('first_run')) {
      achievements.push({
        user_id: userId,
        achievement_type: 'first_run',
        title: 'Primer Entrenamiento',
        description: 'Completaste tu primera sesión de entrenamiento',
        icon: '🎯',
        unlocked_at: new Date().toISOString()
      });
    }

    // Check speed achievements
    if (gameData.game === 'rsvp' && gameData.metrics?.wpm_end >= 600 && !existingTypes.includes('speed_600_wpm')) {
      achievements.push({
        user_id: userId,
        achievement_type: 'speed_600_wpm',
        title: 'Velocidad Supersónica',
        description: 'Alcanzaste 600 WPM en lectura rápida',
        icon: '⚡',
        unlocked_at: new Date().toISOString()
      });
    }

    // Check Schulte achievements
    if (gameData.game === 'shuttle' && gameData.metrics?.difficulty_level >= 7 && !existingTypes.includes('schulte_7x7')) {
      achievements.push({
        user_id: userId,
        achievement_type: 'schulte_7x7',
        title: 'Maestro Schulte',
        description: 'Completaste una tabla Schulte 7x7',
        icon: '🎯',
        unlocked_at: new Date().toISOString()
      });
    }

    // Check Memory Digits achievements
    if (gameData.game === 'memory_digits' && gameData.metrics?.max_digits >= 7 && !existingTypes.includes('digits_7')) {
      achievements.push({
        user_id: userId,
        achievement_type: 'digits_7',
        title: 'Memoria Excepcional',
        description: 'Recordaste una secuencia de 7 dígitos',
        icon: '🧠',
        unlocked_at: new Date().toISOString()
      });
    }

    // Check Twin Words achievements
    if (gameData.game === 'twin_words' && gameData.metrics?.accuracy >= 90 && !existingTypes.includes('twinwords_90acc')) {
      achievements.push({
        user_id: userId,
        achievement_type: 'twinwords_90acc',
        title: 'Ojo de Águila',
        description: 'Logaste 90% de precisión en Twin Words',
        icon: '👁️',
        unlocked_at: new Date().toISOString()
      });
    }

    // Check streak achievements
    const { data: streak } = await supabase
      .from('streaks')
      .select('current')
      .eq('user_id', userId)
      .single();

    if (streak?.current >= 7 && !existingTypes.includes('week_streak_7')) {
      achievements.push({
        user_id: userId,
        achievement_type: 'week_streak_7',
        title: 'Constancia Semanal',
        description: 'Mantuviste una racha de 7 días',
        icon: '🔥',
        unlocked_at: new Date().toISOString()
      });
    }

    // Insert new achievements
    if (achievements.length > 0) {
      const { error: insertError } = await supabase
        .from('achievements')
        .insert(achievements);

      if (insertError) {
        console.error('Error inserting achievements:', insertError);
        return [];
      }
    }

    return achievements;
  } catch (error) {
    console.error('Error in checkAchievements:', error);
    return [];
  }
}

// Get user stats
export async function getUserStats(userId) {
  try {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get streak
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get recent achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })
      .limit(10);

    return {
      profile: profile || { xp: 0, level: 1 },
      streak: streak || { current: 0, longest: 0 },
      achievements: achievements || []
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      profile: { xp: 0, level: 1 },
      streak: { current: 0, longest: 0 },
      achievements: []
    };
  }
}

// Determine if a game run is valid for streak/achievements
export function isValidGameRun(gameData) {
  if (gameData.game === 'rsvp') {
    return gameData.metrics?.total_tokens >= 1000;
  } else {
    return gameData.duration_ms >= 180000; // 3 minutes
  }
}