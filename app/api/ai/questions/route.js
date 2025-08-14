import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import openai from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { toDbFormat, fromDbFormat } from '@/lib/dbCase';

export const runtime = 'nodejs';

// Structured output schema for questions
const QuestionSchema = z.object({
  qid: z.string(),
  type: z.enum(['main_idea', 'detail', 'inference', 'vocab']),
  q: z.string(),
  choices: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explain: z.string(),
  evidence: z.object({
    quote: z.string(),
    charStart: z.number().int().min(0),
    charEnd: z.number().int().min(0)
  })
});

const QuestionsResponseSchema = z.object({
  items: z.array(QuestionSchema).min(1).max(10),
  meta: z.object({
    docId: z.string(),
    locale: z.string(),
    chunkIds: z.array(z.string()),
    model: z.string()
  })
});

// Input validation schema
const RequestSchema = z.object({
  docId: z.string().min(1, 'Document ID is required'),
  locale: z.enum(['es', 'en']).default('es'),
  n: z.number().int().min(3).max(5).default(5),
  userId: z.string().optional().default('anonymous')
});

export async function POST(request) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validationResult = RequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { docId, locale, n, userId } = validationResult.data;
    
    // Check if AI is enabled
    const aiEnabled = process.env.AI_ENABLED === 'true';
    if (!aiEnabled) {
      const fallbackQuestions = generateLocalQuestions(docId, locale, n);
      return NextResponse.json({
        items: fallbackQuestions,
        meta: {
          docId,
          locale,
          chunkIds: ['fallback'],
          model: 'local'
        },
        cached: false,
        fallback: true,
        message: 'AI disabled, using local fallback'
      });
    }
    
    // Check user quota
    const quotaCheck = await checkAndUpdateQuota(userId, 'questions');
    if (!quotaCheck.allowed) {
      const fallbackQuestions = generateLocalQuestions(docId, locale, n);
      return NextResponse.json({
        items: fallbackQuestions,
        meta: {
          docId,
          locale,
          chunkIds: ['fallback'],
          model: 'local'
        },
        cached: false,
        fallback: true,
        message: 'Quota exceeded, using local fallback'
      });
    }
    
    // For MVP, use sample text - in production, fetch from documents table
    const sampleText = getSampleText(locale);
    
    // Chunk text (1-2k tokens per chunk)
    const chunks = chunkText(sampleText, 1500);
    const selectedChunks = selectRelevantChunks(chunks, n);
    const chunkIds = selectedChunks.map((_, i) => `chunk_${i}`);
    
    // Generate cache key
    const promptVersion = 'v2'; // Increment when prompts change
    const cacheInput = `${docId}_questions_${locale}_${n}_${promptVersion}_${chunkIds.join('_')}`;
    const cacheHash = generateHash(cacheInput);
    
    // Check cache
    const cachedResult = await checkCache(cacheHash, 'questions');
    if (cachedResult) {
      try {
        const parsed = JSON.parse(cachedResult);
        return NextResponse.json({
          ...parsed,
          cached: true
        });
      } catch (e) {
        console.error('Error parsing cached result:', e);
      }
    }
    
    // Determine AI provider
    const openAiKey = process.env.OPENAI_API_KEY;
    const emergentKey = process.env.EMERGENT_LLM_KEY;
    const provider = openAiKey ? 'openai' : 'emergent';
    
    if (!openAiKey && !emergentKey) {
      const fallbackQuestions = generateLocalQuestions(docId, locale, n);
      return NextResponse.json({
        items: fallbackQuestions,
        meta: {
          docId,
          locale,
          chunkIds: ['fallback'],
          model: 'local'
        },
        cached: false,
        fallback: true,
        message: 'No AI provider available'
      });
    }
    
    // Prepare text for processing
    const textToProcess = selectedChunks.join('\n\n');
    
    // Generate questions using OpenAI with structured outputs
    const systemPrompt = locale === 'es' 
      ? `Eres un experto en comprensión lectora. Genera exactamente ${n} preguntas de comprensión sobre el texto proporcionado. 

Tipos de preguntas:
- main_idea: Pregunta sobre la idea principal del texto
- detail: Pregunta sobre detalles específicos mencionados
- inference: Pregunta que requiere inferencia o deducción
- vocab: Pregunta sobre vocabulario o significado de palabras

Para cada pregunta:
1. Proporciona exactamente 4 opciones de respuesta plausibles
2. Solo una opción debe ser correcta
3. Las opciones incorrectas deben ser distractores creíbles
4. Incluye una cita textual como evidencia
5. Proporciona una explicación clara

Responde SOLO con el JSON solicitado, sin texto adicional.`
      : `You are a reading comprehension expert. Generate exactly ${n} comprehension questions about the provided text.

Question types:
- main_idea: Question about the main idea of the text
- detail: Question about specific details mentioned
- inference: Question requiring inference or deduction
- vocab: Question about vocabulary or word meaning

For each question:
1. Provide exactly 4 plausible answer choices
2. Only one option should be correct
3. Incorrect options should be believable distractors
4. Include a textual quote as evidence
5. Provide a clear explanation

Respond ONLY with the requested JSON, no additional text.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: textToProcess }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      const aiResponse = completion.choices[0].message.content.trim();
      const tokenCount = completion.usage?.total_tokens || 0;
      
      // Parse and validate AI response
      let questionsData;
      try {
        questionsData = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        throw new Error('Invalid JSON response from AI');
      }
      
      // Validate response structure
      const validatedResponse = validateAndFixQuestions(questionsData, n, docId, locale, chunkIds);
      
      // Save to cache
      const cacheData = {
        items: validatedResponse.items,
        meta: validatedResponse.meta
      };
      await saveToCache(cacheHash, JSON.stringify(cacheData), 'questions', tokenCount);
      
      // Update token usage
      await updateTokenUsage(userId, tokenCount);
      
      return NextResponse.json({
        ...cacheData,
        cached: false,
        tokenCount,
        provider
      });
      
    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Fallback to local questions
      const fallbackQuestions = generateLocalQuestions(docId, locale, n);
      return NextResponse.json({
        items: fallbackQuestions,
        meta: {
          docId,
          locale,
          chunkIds: ['fallback'],
          model: 'local'
        },
        cached: false,
        fallback: true,
        message: 'AI service error, using local fallback'
      });
    }
    
  } catch (error) {
    console.error('Questions generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'AI Questions endpoint is working',
    usage: 'POST with { docId, locale?, n?, userId? }',
    schema: {
      request: {
        docId: 'string',
        locale: 'es|en',
        n: 'number (1-10)',
        userId: 'string (optional)'
      },
      response: {
        items: 'Array<Question>',
        meta: 'ResponseMeta'
      }
    }
  });
}

// Helper functions

function generateHash(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function checkAndUpdateQuota(userId, requestType) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const maxCalls = parseInt(process.env.AI_MAX_CALLS_PER_DAY || '10');
    const maxTokens = parseInt(process.env.AI_MAX_TOKENS_PER_MONTH || '100000');
    
    // Get current usage for today
    const { data: dailyUsage, error: dailyError } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', today)
      .single();
    
    if (dailyError && dailyError.code !== 'PGRST116') {
      console.error('Error checking daily quota:', dailyError);
    }
    
    // Check daily quota
    if (dailyUsage && dailyUsage.calls_used >= maxCalls) {
      return { allowed: false, remaining: 0, reason: 'Daily calls limit exceeded' };
    }
    
    // Get monthly token usage
    const { data: monthlyUsages, error: monthlyError } = await supabase
      .from('ai_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .gte('period_start', `${currentMonth}-01`)
      .lt('period_start', `${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0]}`);
    
    if (monthlyError) {
      console.error('Error checking monthly quota:', monthlyError);
    }
    
    const monthlyTokens = monthlyUsages?.reduce((sum, usage) => sum + (usage.tokens_used || 0), 0) || 0;
    
    if (monthlyTokens >= maxTokens) {
      return { allowed: false, remaining: 0, reason: 'Monthly tokens limit exceeded' };
    }
    
    // If no daily usage record, create one
    if (!dailyUsage) {
      const { error: insertError } = await supabase
        .from('ai_usage')
        .insert({
          user_id: userId,
          period_start: today,
          calls_used: 1,
          tokens_used: 0
        });
      
      if (insertError) {
        console.error('Error creating usage record:', insertError);
      }
      
      return { allowed: true, remaining: maxCalls - 1 };
    }
    
    // Update daily usage
    const { error: updateError } = await supabase
      .from('ai_usage')
      .update({
        calls_used: dailyUsage.calls_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('period_start', today);
    
    if (updateError) {
      console.error('Error updating daily quota:', updateError);
    }
    
    return { allowed: true, remaining: maxCalls - (dailyUsage.calls_used + 1) };
    
  } catch (error) {
    console.error('Quota check error:', error);
    return { allowed: true, remaining: 5 }; // Default fallback
  }
}

async function checkCache(cacheHash, requestType) {
  try {
    const { data, error } = await supabase
      .from('ai_cache')
      .select('output_text')
      .eq('input_hash', cacheHash)
      .eq('request_type', requestType)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking cache:', error);
      return null;
    }
    
    if (data) {
      // Update access count
      await supabase
        .from('ai_cache')
        .update({
          access_count: supabase.sql`access_count + 1`,
          last_accessed_at: new Date().toISOString()
        })
        .eq('input_hash', cacheHash)
        .eq('request_type', requestType);
      
      return data.output_text;
    }
    
    return null;
  } catch (error) {
    console.error('Cache check error:', error);
    return null;
  }
}

async function saveToCache(cacheHash, outputText, requestType, tokenCount) {
  try {
    const { error } = await supabase
      .from('ai_cache')
      .insert({
        cache_key: `questions_${Date.now()}`,
        input_hash: cacheHash,
        output_text: outputText,
        request_type: requestType,
        token_count: tokenCount,
        ver: 'v2'
      });
    
    if (error) {
      console.error('Error saving to cache:', error);
    }
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

async function updateTokenUsage(userId, tokens) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('ai_usage')
      .update({
        tokens_used: supabase.sql`tokens_used + ${tokens}`,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('period_start', today);
    
    if (error) {
      console.error('Error updating token usage:', error);
    }
  } catch (error) {
    console.error('Token usage update error:', error);
  }
}

function chunkText(text, maxChunkSize = 1500) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

function selectRelevantChunks(chunks, n) {
  // For MVP, select first 1-3 chunks based on question count
  const numChunks = Math.min(3, Math.max(1, Math.ceil(n / 3)));
  return chunks.slice(0, numChunks);
}

function getSampleText(locale) {
  const texts = {
    es: `La lectura rápida es una habilidad fundamental que puede transformar completamente tu productividad y capacidad de aprendizaje. Muchas personas leen a una velocidad promedio de 200-250 palabras por minuto, pero con técnicas de entrenamiento adecuadas es posible alcanzar velocidades de 500-800 palabras por minuto sin sacrificar la comprensión.

El método RSVP (Rapid Serial Visual Presentation) presenta las palabras de manera secuencial en el mismo lugar de la pantalla, eliminando los movimientos oculares innecesarios que ralentizan la lectura tradicional. Este método, combinado con las técnicas desarrolladas por Ramón Campayo, puede multiplicar tu velocidad de lectura de manera significativa.

Los ejercicios de atención visual como las tablas de Schulte ayudan a expandir el campo visual periférico, permitiendo procesar más información simultáneamente. La práctica regular de estos ejercicios mejora no solo la velocidad de lectura, sino también la concentración y el procesamiento cognitivo general.`,

    en: `Speed reading is a fundamental skill that can completely transform your productivity and learning capacity. Most people read at an average speed of 200-250 words per minute, but with proper training techniques it's possible to reach speeds of 500-800 words per minute without sacrificing comprehension.

The RSVP (Rapid Serial Visual Presentation) method presents words sequentially in the same place on the screen, eliminating unnecessary eye movements that slow down traditional reading. This method, combined with techniques developed by experts like Ramón Campayo, can significantly multiply your reading speed.

Visual attention exercises like Schulte tables help expand peripheral visual field, allowing simultaneous processing of more information. Regular practice of these exercises improves not only reading speed, but also concentration and general cognitive processing.`
  };
  
  return texts[locale] || texts.es;
}

function validateAndFixQuestions(questionsData, n, docId, locale, chunkIds) {
  try {
    const items = questionsData.items || questionsData.questions || [];
    const validatedItems = [];
    
    for (let i = 0; i < Math.min(n, items.length); i++) {
      const item = items[i];
      
      const validatedItem = {
        qid: item.qid || `q_${i + 1}`,
        type: ['main_idea', 'detail', 'inference', 'vocab'].includes(item.type) ? item.type : 'detail',
        q: item.q || item.question || `Pregunta ${i + 1}`,
        choices: Array.isArray(item.choices) && item.choices.length >= 4 
          ? item.choices.slice(0, 4) 
          : ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        correctIndex: typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex <= 3 
          ? item.correctIndex 
          : 0,
        explain: item.explain || item.explanation || 'Explicación basada en el texto',
        evidence: {
          quote: item.evidence?.quote || item.quote || 'Cita del texto',
          charStart: item.evidence?.charStart || item.charStart || 0,
          charEnd: item.evidence?.charEnd || item.charEnd || 50
        }
      };
      
      validatedItems.push(validatedItem);
    }
    
    return {
      items: validatedItems,
      meta: {
        docId,
        locale,
        chunkIds,
        model: 'gpt-4o-mini'
      }
    };
    
  } catch (error) {
    console.error('Validation error:', error);
    throw new Error('Failed to validate questions');
  }
}

function generateLocalQuestions(docId, locale, n) {
  const templates = {
    es: [
      {
        qid: 'local_1',
        type: 'main_idea',
        q: '¿Cuál es la idea principal del texto?',
        choices: [
          'La lectura rápida puede mejorar la productividad',
          'Las personas leen muy lentamente',
          'Los libros son importantes',
          'La tecnología es útil'
        ],
        correctIndex: 0,
        explain: 'El texto se centra en cómo la lectura rápida mejora la productividad',
        evidence: { quote: 'La lectura rápida es una habilidad fundamental', charStart: 0, charEnd: 45 }
      },
      {
        qid: 'local_2',
        type: 'detail',
        q: '¿Qué velocidad promedio de lectura se menciona?',
        choices: [
          '200-250 palabras por minuto',
          '100-150 palabras por minuto',
          '300-400 palabras por minuto',
          '500-600 palabras por minuto'
        ],
        correctIndex: 0,
        explain: 'El texto especifica que la velocidad promedio es 200-250 WPM',
        evidence: { quote: 'velocidad promedio de 200-250 palabras por minuto', charStart: 150, charEnd: 200 }
      }
    ],
    en: [
      {
        qid: 'local_1',
        type: 'main_idea',
        q: 'What is the main idea of the text?',
        choices: [
          'Speed reading can improve productivity',
          'People read very slowly',
          'Books are important',
          'Technology is useful'
        ],
        correctIndex: 0,
        explain: 'The text focuses on how speed reading improves productivity',
        evidence: { quote: 'Speed reading is a fundamental skill', charStart: 0, charEnd: 35 }
      },
      {
        qid: 'local_2',
        type: 'detail',
        q: 'What average reading speed is mentioned?',
        choices: [
          '200-250 words per minute',
          '100-150 words per minute',
          '300-400 words per minute',
          '500-600 words per minute'
        ],
        correctIndex: 0,
        explain: 'The text specifies that average speed is 200-250 WPM',
        evidence: { quote: 'average speed of 200-250 words per minute', charStart: 100, charEnd: 150 }
      }
    ]
  };
  
  const localeTemplates = templates[locale] || templates.es;
  return localeTemplates.slice(0, n);
}