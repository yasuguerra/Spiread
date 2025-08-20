import { NextResponse } from 'next/server';
import { z } from 'zod';
import getOpenAI from '@/lib/openai';
import { 
  checkAndUpdateQuota, 
  checkCache, 
  saveToCache, 
  updateTokenUsage,
  chunkText,
  generateLocalSummary
} from '@/lib/ai-utils';

// Input validation schema
const SummarizeSchema = z.object({
  docId: z.string().min(1, 'Document ID is required'),
  locale: z.enum(['es', 'en']).default('es'),
  userId: z.string().optional().default('anonymous')
});

export async function POST(request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = SummarizeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { docId, locale, userId } = validationResult.data;
    
    // For MVP, we'll use a simple text extraction. In production, you'd fetch from your documents table
    const sampleText = "La lectura rápida es una habilidad que puede transformar tu productividad y capacidad de aprendizaje. Muchas personas leen a una velocidad promedio de 200-250 palabras por minuto, pero con entrenamiento adecuado es posible alcanzar velocidades de 500-800 palabras por minuto sin sacrificar la comprensión. El método RSVP presenta las palabras de manera secuencial en el mismo lugar, eliminando los movimientos oculares innecesarios que ralentizan la lectura tradicional.";
    
    // Check user quota
    const quotaCheck = await checkAndUpdateQuota(userId, 'summarize');
    if (!quotaCheck.allowed) {
      // Use local fallback when quota exceeded
      const localSummary = generateLocalSummary(sampleText);
      return NextResponse.json({
        bullets: localSummary.bullets,
        abstract: localSummary.abstract,
        cached: false,
        fallback: true,
        message: 'Límite diario alcanzado. Usando resumen local.'
      });
    }
    
    // Check cache first
    const cacheKey = `${docId}_${locale}_summarize`;
    const cachedResult = await checkCache(cacheKey, 'summarize');
    if (cachedResult) {
      try {
        const parsed = JSON.parse(cachedResult);
        return NextResponse.json({
          bullets: parsed.bullets,
          abstract: parsed.abstract,
          cached: true
        });
      } catch (e) {
        console.error('Error parsing cached result:', e);
      }
    }
    
    // Chunk text if needed
    const chunks = chunkText(sampleText, 1500);
    const textToProcess = chunks[0]; // For MVP, process first chunk
    
    // Call OpenAI API
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: locale === 'es' 
            ? "Eres un experto en resumir textos. Crea un resumen conciso con 3 puntos clave en formato de viñetas y un abstract breve. Responde en español."
            : "You are an expert text summarizer. Create a concise summary with 3 key bullet points and a brief abstract. Respond in English."
        },
        {
          role: "user",
          content: textToProcess
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    
    const summary = completion.choices[0].message.content.trim();
    const tokenCount = completion.usage?.total_tokens || 0;
    
    // Parse the response to extract bullets and abstract
    const lines = summary.split('\n').filter(line => line.trim());
    const bullets = lines.filter(line => line.includes('•') || line.includes('-')).slice(0, 3);
    const abstract = bullets.join(' ').replace(/[•\-]/g, '').trim();
    
    const result = {
      bullets: bullets.length > 0 ? bullets : [summary],
      abstract: abstract || summary
    };
    
    // Save to cache
    await saveToCache(cacheKey, JSON.stringify(result), 'summarize', tokenCount);
    
    // Update token usage
    await updateTokenUsage(userId, tokenCount);
    
    return NextResponse.json({
      bullets: result.bullets,
      abstract: result.abstract,
      cached: false,
      tokenCount
    });
    
  } catch (error) {
    console.error('Summarization error:', error);
    
    // Fallback to local summary on error
    try {
      const localSummary = generateLocalSummary("Texto de ejemplo para resumen local.");
      return NextResponse.json({
        bullets: localSummary.bullets,
        abstract: localSummary.abstract,
        cached: false,
        fallback: true,
        message: 'Error en AI, usando resumen local.'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'AI Summarize endpoint is working',
    usage: 'POST with { docId, locale?, userId? }'
  });
}