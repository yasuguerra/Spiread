import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { toDbFormat, fromDbFormat } from '@/lib/dbCase';

export const runtime = 'nodejs';

interface SaveProgressRequest {
  userId: string;
  game: string;
  progress: {
    lastLevel: number;
    lastBestScore: number;
    [key: string]: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SaveProgressRequest;
    const { userId, game, progress } = body;

    // Validate required fields
    if (!userId || !game || !progress) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, game, progress' },
        { status: 400 }
      );
    }

    // Validate progress structure
    if (typeof progress.lastLevel !== 'number' || typeof progress.lastBestScore !== 'number') {
      return NextResponse.json(
        { error: 'Invalid progress structure. Must include lastLevel and lastBestScore as numbers' },
        { status: 400 }
      );
    }

    // Get current settings to preserve existing progress
    const { data: existingSettings, error: fetchError } = await supabase
      .from('settings')
      .select('progress')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch current settings' },
        { status: 500 }
      );
    }

    // Merge with existing progress
    const currentProgress = existingSettings?.progress || {};
    const updatedProgress = {
      ...currentProgress,
      [game]: {
        ...currentProgress[game],
        ...progress,
        updatedAt: new Date().toISOString()
      }
    };

    // Convert to database format
    const dbData = toDbFormat({
      userId,
      progress: updatedProgress,
      updatedAt: new Date().toISOString()
    });

    // Upsert settings record
    const { data, error } = await supabase
      .from('settings')
      .upsert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error saving progress:', error);
      return NextResponse.json(
        { error: 'Failed to save progress' },
        { status: 500 }
      );
    }

    // Convert response back to camelCase
    const response = fromDbFormat(data);

    return NextResponse.json(
      { 
        success: true, 
        progress: response.progress[game],
        message: `Progress saved for ${game}`
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('Save progress error:', error);
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    }
  );
}