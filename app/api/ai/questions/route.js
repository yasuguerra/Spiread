import { NextResponse } from 'next/server';
import { z } from 'zod';
import openai from '@/lib/openai';
import { 
  checkAndUpdateQuota, 
  checkCache, 
  saveToCache, 
  updateTokenUsage,
  chunkText,
  generateLocalQuestions
} from '@/lib/ai-utils';

// Input validation schema
const QuestionsSchema = z.object({
  docId: z.string().min(1, 'Document ID is required'),
  locale: z.enum(['es', 'en']).default('es'),
  n: z.number().min(1).max(10).default(5),
  userId: z.string().optional().default('anonymous')
});

export async function POST(request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = QuestionsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { docId, locale, n, userId } = validationResult.data;
    
    // For MVP, we'll use a sample text. In production, you'd fetch from your documents table
    const sampleText = "La lectura rápida es una habilidad que puede transformar tu productividad y capacidad de aprendizaje. Muchas personas leen a una velocidad promedio de 200-250 palabras por minuto, pero con entrenamiento adecuado es posible alcanzar velocidades de 500-800 palabras por minuto sin sacrificar la comprensión. El método RSVP presenta las palabras de manera secuencial en el mismo lugar, eliminando los movimientos oculares innecesarios que ralentizan la lectura tradicional. Este método, combinado con las técnicas de Ramón Campayo, puede multiplicar tu velocidad de lectura de manera significativa.";
    
    // Check user quota
    const quotaCheck = await checkAndUpdateQuota(userId, 'questions');
    if (!quotaCheck.allowed) {
      // Use local fallback when quota exceeded
      const localQuestions = generateLocalQuestions(sampleText, n);
      return NextResponse.json({
        items: localQuestions,
        cached: false,
        fallback: true,
        message: 'Límite diario alcanzado. Usando preguntas locales.'
      });
    }
    
    // Check cache first
    const cacheKey = `${docId}_${locale}_${n}_questions`;
    const cachedResult = await checkCache(cacheKey, 'questions');
    if (cachedResult) {
      try {
        const parsed = JSON.parse(cachedResult);
        return NextResponse.json({
          items: parsed,
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: locale === 'es' 
            ? `Genera ${n} preguntas de comprensión sobre el siguiente texto. Cada pregunta debe tener 4 opciones de respuesta (choices), indicar el índice correcto (correctIndex: 0-3), y una breve explicación. Responde en formato JSON: {"questions": [{"q": "pregunta", "choices": ["opción1", "opción2", "opción3", "opción4"], "correctIndex": 0, "explain": "explicación"}]}`
            : `Generate ${n} comprehension questions about the following text. Each question should have 4 answer choices, indicate the correct index (correctIndex: 0-3), and a brief explanation. Respond in JSON format: {"questions": [{"q": "question", "choices": ["option1", "option2", "option3", "option4"], "correctIndex": 0, "explain": "explanation"}]}`
        },
        {
          role: "user",
          content: textToProcess
        }
      ],
      max_tokens: 800,
      temperature: 0.5,
    });
    
    const response = completion.choices[0].message.content.trim();
    const tokenCount = completion.usage?.total_tokens || 0;
    
    let questions;
    try {
      const parsed = JSON.parse(response);
      questions = parsed.questions || parsed;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback to local questions
      const localQuestions = generateLocalQuestions(sampleText, n);
      return NextResponse.json({
        items: localQuestions,
        cached: false,
        fallback: true,
        message: 'Error parsing AI response, using local questions.'
      });
    }
    
    // Ensure we have the right structure
    const formattedQuestions = questions.map(q => ({
      q: q.q || q.question || 'Pregunta no disponible',
      choices: q.choices || ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
      correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
      explain: q.explain || q.explanation || 'Explicación no disponible'
    }));
    
    // Save to cache
    await saveToCache(cacheKey, JSON.stringify(formattedQuestions), 'questions', tokenCount);
    
    // Update token usage
    await updateTokenUsage(userId, tokenCount);
    
    return NextResponse.json({
      items: formattedQuestions,
      cached: false,
      tokenCount
    });
    
  } catch (error) {
    console.error('Questions generation error:', error);
    
    // Fallback to local questions on error
    try {
      const localQuestions = generateLocalQuestions("Texto de ejemplo para preguntas locales.", 3);
      return NextResponse.json({
        items: localQuestions,
        cached: false,
        fallback: true,
        message: 'Error en AI, usando preguntas locales.'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      );
    }
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'AI Questions endpoint is working',
    usage: 'POST with { docId, locale?, n?, userId? }'
  });
}