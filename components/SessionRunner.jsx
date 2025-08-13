'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Clock, 
  Target,
  CheckCircle,
  Trophy,
  BarChart3,
  Calendar
} from 'lucide-react'

import { getSessionTemplate, adjustDifficulty } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

// Game components
import AcceleratorReader from './AcceleratorReader'
import SchulteTable from './SchulteTable'
import TwinWords from './TwinWords'

export default function SessionRunner({ template = '15min', onSessionComplete }) {
  const [sessionBlocks, setSessionBlocks] = useState([])
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [blockResults, setBlockResults] = useState([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [currentDifficulties, setCurrentDifficulties] = useState({
    accelerator: 2,
    schulte: 2,
    twin_words: 2,
    par_impar: 1,
    word_race: 2
  })

  const { sessionId } = useAppStore()

  // Initialize session blocks
  useEffect(() => {
    const blocks = getSessionTemplate(template)
    setSessionBlocks(blocks)
  }, [template])

  // Start session
  const startSession = () => {
    setShowInstructions(false)
    setSessionStartTime(Date.now())
    setCurrentBlockIndex(0)
    setBlockResults([])
    setIsCompleted(false)
  }

  // Handle game completion
  const handleGameFinish = (result) => {
    const blockEndTime = Date.now()
    const blockStartTime = blockResults.length === 0 ? sessionStartTime : 
      blockResults[blockResults.length - 1]?.endTime || sessionStartTime

    const blockResult = {
      ...result,
      startTime: blockStartTime,
      endTime: blockEndTime,
      actualDuration: blockEndTime - blockStartTime,
      difficultyBefore: currentDifficulties[result.game],
      difficultyAfter: adjustDifficulty(currentDifficulties[result.game], result.score)
    }

    setBlockResults(prev => [...prev, blockResult])

    // Update difficulty for next time
    setCurrentDifficulties(prev => ({
      ...prev,
      [result.game]: blockResult.difficultyAfter
    }))

    // Move to next block or complete session
    if (currentBlockIndex + 1 >= sessionBlocks.length) {
      completeSession([...blockResults, blockResult])
    } else {
      setCurrentBlockIndex(prev => prev + 1)
    }
  }

  // Complete session
  const completeSession = async (allResults) => {
    setIsCompleted(true)
    
    const sessionEndTime = Date.now()
    const totalDuration = sessionEndTime - sessionStartTime

    // Save session schedule
    try {
      await supabase.from('sessionSchedules').insert({
        id: `ss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: sessionId,
        startedAt: new Date(sessionStartTime).toISOString(),
        template,
        totalDurationMs: totalDuration,
        blocks: allResults.map(result => ({
          game: result.game,
          duration_ms: result.actualDuration,
          score: result.score,
          difficulty_before: result.difficultyBefore,
          difficulty_after: result.difficultyAfter
        }))
      })
    } catch (error) {
      console.error('Error saving session schedule:', error)
    }

    // Call completion callback
    if (onSessionComplete) {
      onSessionComplete({
        template,
        totalDuration,
        blocks: allResults,
        averageScore: allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length
      })
    }
  }

  const currentBlock = sessionBlocks[currentBlockIndex]
  const progress = ((currentBlockIndex + 1) / sessionBlocks.length) * 100
  const totalDuration = getSessionTemplate(template).reduce((sum, block) => sum + block.duration, 0)

  // Session instructions
  if (showInstructions) {
    const sessionInfo = {
      '15min': { name: 'Sesión Rápida', duration: '15 minutos', blocks: 4 },
      '30min': { name: 'Sesión Estándar', duration: '30 minutos', blocks: 5 },
      '60min': { name: 'Sesión Completa', duration: '60 minutos', blocks: 6 }
    }

    const info = sessionInfo[template]

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {info.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{info.name}</h3>
              <p className="text-lg text-muted-foreground">
                Entrenamiento completo de {info.duration} con {info.blocks} ejercicios
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-blue-900">Programa de Entrenamiento:</h4>
              <div className="space-y-2">
                {sessionBlocks.map((block, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-blue-800 capitalize">
                      {index + 1}. {block.game === 'par_impar' ? 'Calentamiento' : 
                         block.game === 'accelerator' ? 'Acelerador de Lectura' :
                         block.game === 'schulte' ? 'Tabla de Schulte' :
                         block.game === 'twin_words' ? 'Palabras Gemelas' :
                         block.game === 'word_race' ? 'Carrera de Palabras' :
                         'Ejercicio de Relajación'}
                    </span>
                    <Badge variant="outline" className="text-blue-600">
                      {Math.round(block.duration / 60000)} min
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{info.duration}</div>
                <div className="text-sm text-muted-foreground">Duración Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{info.blocks}</div>
                <div className="text-sm text-muted-foreground">Ejercicios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">Adaptativo</div>
                <div className="text-sm text-muted-foreground">Dificultad</div>
              </div>
            </div>

            <Button onClick={startSession} size="lg" className="mt-8">
              <Play className="w-4 h-4 mr-2" />
              Comenzar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Session completed
  if (isCompleted) {
    const averageScore = blockResults.reduce((sum, r) => sum + r.score, 0) / blockResults.length
    const totalTime = Date.now() - sessionStartTime

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            ¡Sesión Completada!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-yellow-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-yellow-800">
                Excelente Trabajo
              </h3>
              <p className="text-muted-foreground">
                Has completado tu sesión de entrenamiento
              </p>
            </div>

            {/* Session Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(averageScore)}
                </div>
                <div className="text-sm text-muted-foreground">Puntuación Media</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(totalTime / 60000)}
                </div>
                <div className="text-sm text-muted-foreground">Minutos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {blockResults.length}
                </div>
                <div className="text-sm text-muted-foreground">Ejercicios</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {Object.values(currentDifficulties).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Nivel Total</div>
              </div>
            </div>

            {/* Block Results */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900">Resultados por Ejercicio:</h4>
              {blockResults.map((result, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="capitalize">
                    {result.game === 'accelerator' ? 'Acelerador' :
                     result.game === 'schulte' ? 'Schulte' :
                     result.game === 'twin_words' ? 'Palabras Gemelas' : result.game}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.score >= 80 ? 'default' : result.score >= 60 ? 'secondary' : 'destructive'}>
                      {result.score}%
                    </Badge>
                    {result.difficultyAfter > result.difficultyBefore && (
                      <span className="text-green-600 text-xs">↗ Nivel {result.difficultyAfter}</span>
                    )}
                    {result.difficultyAfter < result.difficultyBefore && (
                      <span className="text-orange-600 text-xs">↘ Nivel {result.difficultyAfter}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Next Recommendations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Recomendaciones para tu próxima sesión:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {averageScore >= 85 && <li>• ¡Excelente! Considera aumentar a sesiones más largas</li>}
                {averageScore < 60 && <li>• Practica más sesiones cortas para consolidar</li>}
                <li>• Los ejercicios se han adaptado automáticamente a tu nivel</li>
                <li>• Mantén la constancia para mejores resultados</li>
              </ul>
            </div>

            <Button onClick={() => setShowInstructions(true)} className="mt-6">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Métricas Detalladas
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render current game
  const renderCurrentGame = () => {
    if (!currentBlock) return null

    const gameProps = {
      difficultyLevel: currentDifficulties[currentBlock.game],
      durationMs: currentBlock.duration,
      onGameFinish: handleGameFinish
    }

    switch (currentBlock.game) {
      case 'accelerator':
        return <AcceleratorReader {...gameProps} />
      case 'schulte':
        return <SchulteTable {...gameProps} />
      case 'twin_words':
        return <TwinWords {...gameProps} />
      case 'par_impar':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Calentamiento Completado</h3>
                <p className="text-muted-foreground">
                  Ejercicio de calentamiento Par/Impar (placeholder)
                </p>
                <Button onClick={() => handleGameFinish({
                  game: 'par_impar',
                  score: 75,
                  metrics: { warm_up: true },
                  durationMs: currentBlock.duration,
                  difficultyLevel: 1
                })}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      case 'word_race':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold">Carrera de Palabras</h3>
                <p className="text-muted-foreground">
                  Ejercicio de Carrera de Palabras (próximamente)
                </p>
                <Button onClick={() => handleGameFinish({
                  game: 'word_race',
                  score: 70,
                  metrics: { placeholder: true },
                  durationMs: currentBlock.duration,
                  difficultyLevel: currentDifficulties[currentBlock.game]
                })}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      default:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold">Ejercicio Completado</h3>
                <p className="text-muted-foreground">
                  Ejercicio de relajación (placeholder)
                </p>
                <Button onClick={() => handleGameFinish({
                  game: currentBlock.game,
                  score: 80,
                  metrics: { cooldown: true },
                  durationMs: currentBlock.duration,
                  difficultyLevel: 1
                })}>
                  Finalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Session Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Sesión en Progreso
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {template}
              </Badge>
              <Badge variant="secondary">
                Bloque {currentBlockIndex + 1} de {sessionBlocks.length}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Ejercicio actual: {currentBlock?.game === 'accelerator' ? 'Acelerador de Lectura' :
                                  currentBlock?.game === 'schulte' ? 'Tabla de Schulte' :
                                  currentBlock?.game === 'twin_words' ? 'Palabras Gemelas' :
                                  currentBlock?.game || 'Cargando...'}
              </span>
              <span>
                {Math.round(((Date.now() - sessionStartTime) / 1000) / 60)} min transcurridos
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Game */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBlockIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentGame()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}