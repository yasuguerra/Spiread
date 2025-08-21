/**
 * RSVP Comprehension Quiz System
 * Provides reading comprehension assessment after RSVP sessions
 */

export interface QuizQuestion {
  id: string;
  type: 'main_idea' | 'factual' | 'inference' | 'vocabulary';
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
  explanation?: string;
}

export interface QuizText {
  id: string;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
  questions: QuizQuestion[];
  categories: string[];
}

export interface QuizResult {
  textId: string;
  score: number; // 0-1
  questionsAnswered: number;
  questionsCorrect: number;
  timeSpent: number;
  readingSpeed: number; // WPM
  comprehensionScore: number; // 0-1
  timestamp: number;
}

// Sample quiz texts with questions
export const QUIZ_TEXTS: QuizText[] = [
  {
    id: 'tech_innovation',
    title: 'Innovación Tecnológica',
    difficulty: 'medium',
    wordCount: 180,
    categories: ['technology', 'science'],
    content: `La inteligencia artificial está transformando nuestra sociedad de maneras que apenas comenzamos a comprender. Desde asistentes virtuales hasta sistemas de diagnóstico médico, la IA se integra cada vez más en nuestra vida cotidiana. Sin embargo, esta revolución tecnológica también plantea importantes desafíos éticos y sociales. Los algoritmos pueden perpetuar sesgos existentes, y la automatización amenaza con desplazar empleos tradicionales. Es crucial que desarrollemos marcos regulatorios adecuados para aprovechar los beneficios de la IA mientras mitigamos sus riesgos potenciales. La educación y la adaptación serán clave para navegar este nuevo panorama tecnológico.`,
    questions: [
      {
        id: 'tech_main_idea',
        type: 'main_idea',
        question: '¿Cuál es la idea principal del texto?',
        options: [
          'La IA solo tiene beneficios para la sociedad',
          'La IA está transformando la sociedad pero presenta desafíos',
          'Los algoritmos siempre son objetivos y justos',
          'La automatización no afecta el empleo'
        ],
        correctAnswer: 1,
        explanation: 'El texto presenta tanto los beneficios como los desafíos de la IA.'
      },
      {
        id: 'tech_factual',
        type: 'factual',
        question: '¿Qué ejemplos de IA menciona el texto?',
        options: [
          'Robots y coches autónomos',
          'Asistentes virtuales y diagnóstico médico',
          'Redes sociales y videojuegos',
          'Computadoras y smartphones'
        ],
        correctAnswer: 1
      },
      {
        id: 'tech_inference',
        type: 'inference',
        question: '¿Qué se puede inferir sobre el futuro de la IA?',
        options: [
          'Será completamente beneficiosa',
          'Reemplazará a todos los humanos',
          'Requiere regulación y adaptación cuidadosas',
          'No tendrá impacto significativo'
        ],
        correctAnswer: 2
      },
      {
        id: 'tech_vocabulary',
        type: 'vocabulary',
        question: '¿Qué significa "mitigar" en el contexto del texto?',
        options: [
          'Aumentar o intensificar',
          'Ignorar completamente',
          'Reducir o minimizar',
          'Acelerar el proceso'
        ],
        correctAnswer: 2
      }
    ]
  },
  {
    id: 'ocean_conservation',
    title: 'Conservación Marina',
    difficulty: 'easy',
    wordCount: 150,
    categories: ['environment', 'science'],
    content: `Los océanos cubren más del 70% de la superficie terrestre y albergan una increíble biodiversidad. Sin embargo, enfrentan amenazas graves como la contaminación por plásticos, la sobrepesca y el cambio climático. Las especies marinas están perdiendo sus hábitats naturales a un ritmo alarmante. La acidificación de los océanos, causada por la absorción de dióxido de carbono, afecta especialmente a los corales y moluscos. Para proteger estos ecosistemas vitales, necesitamos acciones coordenadas a nivel global. Esto incluye reducir el uso de plásticos, establecer áreas marinas protegidas y promover prácticas pesqueras sostenibles. Cada persona puede contribuir tomando decisiones conscientes en su vida diaria.`,
    questions: [
      {
        id: 'ocean_main_idea',
        type: 'main_idea',
        question: '¿De qué trata principalmente el texto?',
        options: [
          'La belleza de los océanos',
          'Las amenazas a los océanos y su conservación',
          'Los animales marinos más raros',
          'La historia de la navegación'
        ],
        correctAnswer: 1
      },
      {
        id: 'ocean_factual',
        type: 'factual',
        question: '¿Qué porcentaje de la superficie terrestre cubren los océanos?',
        options: [
          'Más del 50%',
          'Exactamente 60%',
          'Más del 70%',
          'Menos del 80%'
        ],
        correctAnswer: 2
      },
      {
        id: 'ocean_inference',
        type: 'inference',
        question: '¿Qué se puede concluir sobre la conservación marina?',
        options: [
          'Es responsabilidad solo de los gobiernos',
          'Requiere esfuerzo individual y colectivo',
          'Es imposible de lograr',
          'No es urgente'
        ],
        correctAnswer: 1
      },
      {
        id: 'ocean_vocabulary',
        type: 'vocabulary',
        question: '¿Qué significa "biodiversidad"?',
        options: [
          'Cantidad de agua en el océano',
          'Variedad de formas de vida',
          'Profundidad del mar',
          'Temperatura del agua'
        ],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'sustainable_cities',
    title: 'Ciudades Sostenibles',
    difficulty: 'hard',
    wordCount: 220,
    categories: ['urban_planning', 'environment'],
    content: `El concepto de ciudades sostenibles ha emergido como una respuesta crucial a los desafíos urbanos del siglo XXI. Con más del 50% de la población mundial viviendo en áreas urbanas, y proyecciones que indican un crecimiento hasta el 68% para 2050, la planificación urbana sostenible se vuelve imperativa. Las ciudades inteligentes integran tecnologías de información y comunicación para optimizar servicios públicos, reducir el consumo energético y mejorar la calidad de vida. Los sistemas de transporte multimodal, que combinan transporte público eficiente, carriles para bicicletas y zonas peatonales, reducen significativamente las emisiones de carbono. La implementación de techos verdes y jardines verticales no solo mitiga el efecto de isla de calor urbano, sino que también mejora la calidad del aire y proporciona espacios de recreación. La gestión inteligente de residuos, utilizando sensores IoT y algoritmos de optimización, puede reducir los costos operativos hasta en un 30% mientras mejora la eficiencia de recolección.`,
    questions: [
      {
        id: 'cities_main_idea',
        type: 'main_idea',
        question: '¿Cuál es el tema central del texto?',
        options: [
          'El crecimiento de la población urbana',
          'Las tecnologías de comunicación',
          'Las estrategias para ciudades sostenibles',
          'Los problemas de contaminación'
        ],
        correctAnswer: 2
      },
      {
        id: 'cities_factual',
        type: 'factual',
        question: '¿Qué porcentaje de la población mundial vivirá en ciudades para 2050?',
        options: [
          '50%',
          '60%',
          '68%',
          '75%'
        ],
        correctAnswer: 2
      },
      {
        id: 'cities_inference',
        type: 'inference',
        question: '¿Por qué son importantes los techos verdes según el texto?',
        options: [
          'Solo para decoración urbana',
          'Únicamente para ahorrar energía',
          'Tienen múltiples beneficios ambientales y sociales',
          'Son obligatorios por ley'
        ],
        correctAnswer: 2
      },
      {
        id: 'cities_vocabulary',
        type: 'vocabulary',
        question: '¿Qué significa "multimodal" en el contexto del transporte?',
        options: [
          'Que usa un solo tipo de vehículo',
          'Que combina diferentes medios de transporte',
          'Que es muy costoso',
          'Que funciona solo de noche'
        ],
        correctAnswer: 1
      }
    ]
  }
];

export function getRandomQuizText(difficulty?: 'easy' | 'medium' | 'hard'): QuizText {
  const filtered = difficulty 
    ? QUIZ_TEXTS.filter(text => text.difficulty === difficulty)
    : QUIZ_TEXTS;
  
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function calculateQuizScore(
  answers: number[],
  questions: QuizQuestion[]
): {
  score: number;
  correct: number;
  total: number;
  breakdown: { [key in QuizQuestion['type']]: { correct: number; total: number } };
} {
  let correct = 0;
  const breakdown: { [key in QuizQuestion['type']]: { correct: number; total: number } } = {
    main_idea: { correct: 0, total: 0 },
    factual: { correct: 0, total: 0 },
    inference: { correct: 0, total: 0 },
    vocabulary: { correct: 0, total: 0 }
  };

  questions.forEach((question, index) => {
    breakdown[question.type].total++;
    
    if (answers[index] === question.correctAnswer) {
      correct++;
      breakdown[question.type].correct++;
    }
  });

  return {
    score: correct / questions.length,
    correct,
    total: questions.length,
    breakdown
  };
}

export function getComprehensionLevel(score: number): {
  level: string;
  description: string;
  color: string;
} {
  if (score >= 0.9) {
    return {
      level: 'Excelente',
      description: 'Comprensión excepcional del texto',
      color: 'text-green-600'
    };
  } else if (score >= 0.75) {
    return {
      level: 'Bueno',
      description: 'Comprensión sólida con detalles menores perdidos',
      color: 'text-blue-600'
    };
  } else if (score >= 0.6) {
    return {
      level: 'Aceptable',
      description: 'Comprensión básica de las ideas principales',
      color: 'text-yellow-600'
    };
  } else if (score >= 0.4) {
    return {
      level: 'Necesita mejorar',
      description: 'Comprensión limitada del contenido',
      color: 'text-orange-600'
    };
  } else {
    return {
      level: 'Deficiente',
      description: 'Comprensión muy limitada, considera reducir la velocidad',
      color: 'text-red-600'
    };
  }
}

export function generatePersonalizedFeedback(
  quizResult: QuizResult,
  readingSpeed: number
): string[] {
  const feedback: string[] = [];
  const { score } = quizResult;
  
  // Speed vs Comprehension balance
  if (readingSpeed > 400 && score < 0.6) {
    feedback.push('Considera reducir la velocidad de lectura para mejorar la comprensión.');
  } else if (readingSpeed < 200 && score > 0.8) {
    feedback.push('¡Excelente comprensión! Puedes intentar aumentar gradualmente la velocidad.');
  }
  
  // Question type analysis
  const breakdown = calculateQuizScore([], []).breakdown; // This needs the actual answers
  
  if (score >= 0.8) {
    feedback.push('¡Felicitaciones! Tienes una excelente comprensión lectora.');
  } else if (score >= 0.6) {
    feedback.push('Buen trabajo. Sigue practicando para mejorar aún más.');
  } else {
    feedback.push('Practica más la lectura comprensiva. Considera tomar notas mentales mientras lees.');
  }
  
  return feedback;
}
