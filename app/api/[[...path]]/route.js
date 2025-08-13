import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Helper function to handle CORS
function handleCors() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
  return corsHeaders
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: handleCors()
  })
}

export async function GET(request, { params }) {
  const { path } = params
  const corsHeaders = handleCors()

  try {
    if (!path || path.length === 0) {
      return NextResponse.json(
        { message: "Campayo Spreeder Pro API is running!" },
        { status: 200, headers: corsHeaders }
      )
    }

    const endpoint = path[0]

    switch (endpoint) {
      case 'health':
        return NextResponse.json(
          { status: 'healthy', timestamp: new Date().toISOString() },
          { headers: corsHeaders }
        )

      case 'sessions':
        const userId = request.nextUrl.searchParams.get('user_id')
        
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400, headers: corsHeaders }
          )
        }

        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError)
          return NextResponse.json(
            { error: 'Failed to fetch sessions' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(sessions || [], { headers: corsHeaders })

      case 'documents':
        const docUserId = request.nextUrl.searchParams.get('user_id')
        
        if (!docUserId) {
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400, headers: corsHeaders }
          )
        }

        const { data: documents, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', docUserId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (docsError) {
          console.error('Error fetching documents:', docsError)
          return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(documents || [], { headers: corsHeaders })

      case 'settings':
        const settingsUserId = request.nextUrl.searchParams.get('user_id')
        
        if (!settingsUserId) {
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400, headers: corsHeaders }
          )
        }

        const { data: userSettings, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', settingsUserId)
          .single()

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error fetching settings:', settingsError)
          return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(userSettings || {}, { headers: corsHeaders })

      case 'gameRuns':
        const gameUserId = request.nextUrl.searchParams.get('user_id')
        
        if (!gameUserId) {
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400, headers: corsHeaders }
          )
        }

        const { data: gameRuns, error: gameRunsError } = await supabase
          .from('gameRuns')
          .select('*')
          .eq('userId', gameUserId)
          .order('createdAt', { ascending: false })
          .limit(50)

        if (gameRunsError) {
          console.error('Error fetching game runs:', gameRunsError)
          return NextResponse.json(
            { error: 'Failed to fetch game runs' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(gameRuns || [], { headers: corsHeaders })

      case 'sessionSchedules':
        const scheduleUserId = request.nextUrl.searchParams.get('user_id')
        
        if (!scheduleUserId) {
          return NextResponse.json(
            { error: 'User ID required' },
            { status: 400, headers: corsHeaders }
          )
        }

        const { data: schedules, error: schedulesError } = await supabase
          .from('sessionSchedules')
          .select('*')
          .eq('userId', scheduleUserId)
          .order('startedAt', { ascending: false })
          .limit(20)

        if (schedulesError) {
          console.error('Error fetching session schedules:', schedulesError)
          return NextResponse.json(
            { error: 'Failed to fetch session schedules' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(schedules || [], { headers: corsHeaders })

      default:
        return NextResponse.json(
          { error: 'Endpoint not found' },
          { status: 404, headers: corsHeaders }
        )
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function POST(request, { params }) {
  const { path } = params
  const corsHeaders = handleCors()

  try {
    const body = await request.json()
    
    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: 'Endpoint not specified' },
        { status: 400, headers: corsHeaders }
      )
    }

    const endpoint = path[0]

    switch (endpoint) {
      case 'sessions':
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .insert([{
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: body.user_id,
            wpm_start: body.wpm_start,
            wpm_end: body.wpm_end || body.wpm_start,
            comprehension_score: body.comprehension_score || 0,
            exercise_type: body.exercise_type || 'rsvp',
            duration_seconds: body.duration_seconds || 0,
            text_length: body.text_length || 0,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (sessionError) {
          console.error('Error creating session:', sessionError)
          return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(sessionData, { headers: corsHeaders })

      case 'documents':
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .insert([{
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: body.user_id,
            title: body.title,
            content: body.content,
            document_type: body.document_type || 'text',
            word_count: body.word_count || 0,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (documentError) {
          console.error('Error creating document:', documentError)
          return NextResponse.json(
            { error: 'Failed to create document' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(documentData, { headers: corsHeaders })

      case 'settings':
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .upsert({
            user_id: body.user_id,
            wpm_target: body.wpm_target,
            chunk_size: body.chunk_size,
            theme: body.theme,
            language: body.language,
            font_size: body.font_size,
            sound_enabled: body.sound_enabled,
            show_instructions: body.show_instructions,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (settingsError) {
          console.error('Error updating settings:', settingsError)
          return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(settingsData, { headers: corsHeaders })

      case 'gameRuns':
        const { data: gameRunData, error: gameRunError } = await supabase
          .from('gameRuns')
          .insert([{
            id: body.id || `gr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: body.userId || body.user_id,
            game: body.game,
            difficultyLevel: body.difficultyLevel || body.difficulty_level || 1,
            durationMs: body.durationMs || body.duration_ms || 0,
            score: body.score || 0,
            metrics: body.metrics || {},
            createdAt: new Date().toISOString()
          }])
          .select()
          .single()

        if (gameRunError) {
          console.error('Error creating game run:', gameRunError)
          return NextResponse.json(
            { error: 'Failed to create game run' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(gameRunData, { headers: corsHeaders })

      case 'sessionSchedules':
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('sessionSchedules')
          .insert([{
            id: body.id || `ss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: body.userId || body.user_id,
            startedAt: body.startedAt || body.started_at || new Date().toISOString(),
            template: body.template,
            totalDurationMs: body.totalDurationMs || body.total_duration_ms || 0,
            blocks: body.blocks || []
          }])
          .select()
          .single()

        if (scheduleError) {
          console.error('Error creating session schedule:', scheduleError)
          return NextResponse.json(
            { error: 'Failed to create session schedule' },
            { status: 500, headers: corsHeaders }
          )
        }

        return NextResponse.json(scheduleData, { headers: corsHeaders })

      default:
        return NextResponse.json(
          { error: 'Endpoint not found' },
          { status: 404, headers: corsHeaders }
        )
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}