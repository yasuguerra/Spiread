import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fromDbFormat } from '@/lib/dbCase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const game = searchParams.get('game');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Fetch user settings with progress
    const { data, error } = await supabase
      .from('settings')
      .select('progress')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching progress:', error);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // If no settings exist, return default progress
    if (!data || !data.progress) {
      const defaultProgress = game ? { [game]: getDefaultProgress(game) } : {};
      return NextResponse.json(
        { progress: defaultProgress },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Convert response to camelCase
    const response = fromDbFormat(data);
    const progress = response.progress || {};

    // If specific game requested, return only that game's progress
    if (game) {
      const gameProgress = progress[game] || getDefaultProgress(game);
      return NextResponse.json(
        { progress: { [game]: gameProgress } },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Return all progress
    return NextResponse.json(
      { progress },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    }
  );
}

/**
 * Get default progress for a specific game
 */
function getDefaultProgress(game: string) {
  const defaults: Record<string, any> = {
    memory_digits: {
      lastLevel: 1,
      lastBestScore: 0,
      totalRounds: 0,
      averageRt: 0
    },
    schulte: {
      lastLevel: 1,
      lastBestScore: 0,
      totalTables: 0,
      bestTableTime: null
    },
    par_impar: {
      lastLevel: 1,
      lastBestScore: 0,
      totalRounds: 0,
      bestAccuracy: 0
    },
    running_words: {
      lastLevel: 1,
      lastBestScore: 0,
      totalRounds: 0,
      averageRt: 0
    },
    letters_grid: {
      lastLevel: 1,
      lastBestScore: 0,
      totalRounds: 0,
      bestAccuracy: 0
    },
    word_search: {
      lastLevel: 1,
      lastBestScore: 0,
      totalWords: 0,
      averageTimePerWord: 0
    },
    anagramas: {
      lastLevel: 1,
      lastBestScore: 0,
      totalSolved: 0,
      averageTime: 0
    },
    reading_quiz: {
      lastLevel: 1,
      lastBestScore: 0,
      totalQuestions: 0,
      averageAccuracy: 0
    }
  };

  return defaults[game] || {
    lastLevel: 1,
    lastBestScore: 0
  };
}