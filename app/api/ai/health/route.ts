import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Determine AI provider based on environment variables
    const openAiKey = process.env.OPENAI_API_KEY;
    const emergentKey = process.env.EMERGENT_LLM_KEY;
    const aiEnabled = process.env.AI_ENABLED === 'true';

    let provider = 'none';
    let model = 'none';
    
    if (aiEnabled) {
      if (openAiKey) {
        provider = 'openai';
        model = 'gpt-4o-mini';
      } else if (emergentKey) {
        provider = 'emergent';
        model = 'gpt-4o-mini';
      }
    }

    // Basic health metrics
    const health = {
      ok: true,
      provider,
      model,
      aiEnabled,
      timestamp: new Date().toISOString(),
      quotas: {
        maxCallsPerDay: parseInt(process.env.AI_MAX_CALLS_PER_DAY || '10'),
        maxTokensPerMonth: parseInt(process.env.AI_MAX_TOKENS_PER_MONTH || '100000')
      },
      features: {
        summarization: aiEnabled && !!(openAiKey || emergentKey),
        questionGeneration: aiEnabled && !!(openAiKey || emergentKey),
        caching: true,
        fallbackMode: true
      }
    };

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('AI health check error:', error);
    
    return NextResponse.json(
      {
        ok: false,
        provider: 'error',
        model: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
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