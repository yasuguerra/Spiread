/**
 * Spanish word pairs for Twin Words game
 * Provides confusable/similar word pairs for discrimination training
 */

export type TwinPair = {
  a: string;
  b: string;
  kind: 'accent' | 'glyph' | 'minimal';
  difficulty: number;
};

export const TWIN_PAIRS: TwinPair[] = [
  // ACCENT PAIRS - Difficulty 1-3
  { a: 'esta', b: 'está', kind: 'accent', difficulty: 1 },
  { a: 'tu', b: 'tú', kind: 'accent', difficulty: 1 },
  { a: 'el', b: 'él', kind: 'accent', difficulty: 1 },
  { a: 'si', b: 'sí', kind: 'accent', difficulty: 1 },
  { a: 'mas', b: 'más', kind: 'accent', difficulty: 1 },
  { a: 'que', b: 'qué', kind: 'accent', difficulty: 1 },
  { a: 'como', b: 'cómo', kind: 'accent', difficulty: 1 },
  { a: 'cuando', b: 'cuándo', kind: 'accent', difficulty: 1 },
  { a: 'donde', b: 'dónde', kind: 'accent', difficulty: 1 },
  { a: 'quien', b: 'quién', kind: 'accent', difficulty: 1 },
  
  { a: 'medico', b: 'médico', kind: 'accent', difficulty: 2 },
  { a: 'practico', b: 'práctico', kind: 'accent', difficulty: 2 },
  { a: 'musica', b: 'música', kind: 'accent', difficulty: 2 },
  { a: 'telefono', b: 'teléfono', kind: 'accent', difficulty: 2 },
  { a: 'numero', b: 'número', kind: 'accent', difficulty: 2 },
  { a: 'rapido', b: 'rápido', kind: 'accent', difficulty: 2 },
  { a: 'ultimo', b: 'último', kind: 'accent', difficulty: 2 },
  { a: 'facil', b: 'fácil', kind: 'accent', difficulty: 2 },
  { a: 'dificil', b: 'difícil', kind: 'accent', difficulty: 2 },
  { a: 'util', b: 'útil', kind: 'accent', difficulty: 2 },
  
  { a: 'corazon', b: 'corazón', kind: 'accent', difficulty: 3 },
  { a: 'cancion', b: 'canción', kind: 'accent', difficulty: 3 },
  { a: 'informacion', b: 'información', kind: 'accent', difficulty: 3 },
  { a: 'comunicacion', b: 'comunicación', kind: 'accent', difficulty: 3 },
  { a: 'television', b: 'televisión', kind: 'accent', difficulty: 3 },
  { a: 'educacion', b: 'educación', kind: 'accent', difficulty: 3 },
  { a: 'solucion', b: 'solución', kind: 'accent', difficulty: 3 },
  { a: 'atencion', b: 'atención', kind: 'accent', difficulty: 3 },
  { a: 'administracion', b: 'administración', kind: 'accent', difficulty: 3 },
  
  // GLYPH LOOK-ALIKES - Difficulty 2-4
  { a: 'rn', b: 'm', kind: 'glyph', difficulty: 2 },
  { a: 'cl', b: 'd', kind: 'glyph', difficulty: 2 },
  { a: 'vv', b: 'w', kind: 'glyph', difficulty: 2 },
  { a: 'nn', b: 'ñ', kind: 'glyph', difficulty: 2 },
  { a: '0', b: 'O', kind: 'glyph', difficulty: 2 },
  { a: '1', b: 'l', kind: 'glyph', difficulty: 2 },
  { a: '1', b: 'I', kind: 'glyph', difficulty: 2 },
  { a: 'u', b: 'v', kind: 'glyph', difficulty: 2 },
  { a: 'o', b: '0', kind: 'glyph', difficulty: 2 },
  
  { a: 'tiempo', b: 'tiernpo', kind: 'glyph', difficulty: 3 },
  { a: 'momento', b: 'mornento', kind: 'glyph', difficulty: 3 },
  { a: 'problema', b: 'problerna', kind: 'glyph', difficulty: 3 },
  { a: 'gobierno', b: 'gobiemo', kind: 'glyph', difficulty: 3 },
  { a: 'persona', b: 'persorna', kind: 'glyph', difficulty: 3 },
  { a: 'forma', b: 'forna', kind: 'glyph', difficulty: 3 },
  { a: 'norma', b: 'norrna', kind: 'glyph', difficulty: 3 },
  { a: 'animal', b: 'anirnal', kind: 'glyph', difficulty: 3 },
  { a: 'normal', b: 'norrnal', kind: 'glyph', difficulty: 3 },
  { a: 'formar', b: 'forrnar', kind: 'glyph', difficulty: 3 },
  
  { a: 'economia', b: 'econornia', kind: 'glyph', difficulty: 4 },
  { a: 'comunidad', b: 'cornunidad', kind: 'glyph', difficulty: 4 },
  { a: 'administrar', b: 'adrninistrar', kind: 'glyph', difficulty: 4 },
  { a: 'determinar', b: 'deterrninar', kind: 'glyph', difficulty: 4 },
  { a: 'informar', b: 'inforrnar', kind: 'glyph', difficulty: 4 },
  { a: 'confirmar', b: 'confirrnar', kind: 'glyph', difficulty: 4 },
  { a: 'transformar', b: 'transforrnart', kind: 'glyph', difficulty: 4 },
  { a: 'permanecer', b: 'perrnanencer', kind: 'glyph', difficulty: 4 },
  
  // MINIMAL PAIRS - Difficulty 1-3
  { a: 'casa', b: 'caza', kind: 'minimal', difficulty: 1 },
  { a: 'masa', b: 'maza', kind: 'minimal', difficulty: 1 },
  { a: 'peso', b: 'piso', kind: 'minimal', difficulty: 1 },
  { a: 'cosa', b: 'causa', kind: 'minimal', difficulty: 1 },
  { a: 'pasa', b: 'pesa', kind: 'minimal', difficulty: 1 },
  { a: 'mesa', b: 'misa', kind: 'minimal', difficulty: 1 },
  { a: 'tubo', b: 'tuvo', kind: 'minimal', difficulty: 1 },
  { a: 'lobo', b: 'lovo', kind: 'minimal', difficulty: 1 },
  { a: 'gato', b: 'gasto', kind: 'minimal', difficulty: 1 },
  { a: 'paso', b: 'pasto', kind: 'minimal', difficulty: 1 },
  
  { a: 'carro', b: 'corro', kind: 'minimal', difficulty: 2 },
  { a: 'mano', b: 'nano', kind: 'minimal', difficulty: 2 },
  { a: 'bueno', b: 'nuevo', kind: 'minimal', difficulty: 2 },
  { a: 'pero', b: 'perro', kind: 'minimal', difficulty: 2 },
  { a: 'coro', b: 'corso', kind: 'minimal', difficulty: 2 },
  { a: 'misa', b: 'masa', kind: 'minimal', difficulty: 2 },
  { a: 'curso', b: 'curvo', kind: 'minimal', difficulty: 2 },
  { a: 'verso', b: 'versa', kind: 'minimal', difficulty: 2 },
  { a: 'turno', b: 'torno', kind: 'minimal', difficulty: 2 },
  { a: 'corte', b: 'norte', kind: 'minimal', difficulty: 2 },
  
  { a: 'trabajo', b: 'trabaja', kind: 'minimal', difficulty: 3 },
  { a: 'programa', b: 'prolema', kind: 'minimal', difficulty: 3 },
  { a: 'servicio', b: 'servicia', kind: 'minimal', difficulty: 3 },
  { a: 'proceso', b: 'procesa', kind: 'minimal', difficulty: 3 },
  { a: 'ejemplo', b: 'ejempla', kind: 'minimal', difficulty: 3 },
  { a: 'sistema', b: 'sisteme', kind: 'minimal', difficulty: 3 },
  { a: 'proyecto', b: 'projecta', kind: 'minimal', difficulty: 3 },
  { a: 'historia', b: 'historio', kind: 'minimal', difficulty: 3 },
  { a: 'memoria', b: 'memorio', kind: 'minimal', difficulty: 3 },
  { a: 'materia', b: 'materio', kind: 'minimal', difficulty: 3 },
  
  // CASE SENSITIVITY PAIRS - Difficulty 2-3
  { a: 'Casa', b: 'casa', kind: 'minimal', difficulty: 2 },
  { a: 'MUNDO', b: 'mundo', kind: 'minimal', difficulty: 2 },
  { a: 'Tiempo', b: 'tiempo', kind: 'minimal', difficulty: 2 },
  { a: 'PERSONA', b: 'persona', kind: 'minimal', difficulty: 2 },
  { a: 'Trabajo', b: 'trabajo', kind: 'minimal', difficulty: 2 },
  { a: 'PROBLEMA', b: 'problema', kind: 'minimal', difficulty: 3 },
  { a: 'Gobierno', b: 'gobierno', kind: 'minimal', difficulty: 3 },
  { a: 'SISTEMA', b: 'sistema', kind: 'minimal', difficulty: 3 },
];
