'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Timer, 
  CheckCircle, 
  ArrowRight, 
  BookOpen, 
  Target,
  Zap
} from 'lucide-react'

export default function OnboardingTest({ onComplete }) {
  const [step, setStep] = useState(0)
  const [isReading, setIsReading] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [answers, setAnswers] = useState({})
  
  // Test text and questions
  const testText = `La lectura rápida es una habilidad que puede transformar tu productividad y capacidad de aprendizaje. Muchas personas leen a una velocidad promedio de 200-250 palabras por minuto, pero con entrenamiento adecuado es posible alcanzar velocidades de 500-800 palabras por minuto sin sacrificar la comprensión.

El método RSVP presenta las palabras de manera secuencial en el mismo lugar, eliminando los movimientos oculares innecesarios que ralentizan la lectura tradicional. Este método, combinado con las técnicas de Ramón Campayo, puede multiplicar tu velocidad de lectura de manera significativa.

Los beneficios incluyen mayor absorción de información, mejor concentración, y la capacidad de procesar grandes volúmenes de texto en menos tiempo. Con práctica regular de 10-15 minutos diarios, notarás mejoras sustanciales en pocas semanas.`

  const questions = [
    {
      question: "¿Cuál es la velocidad de lectura promedio mencionada en el texto?",
      options: [
        "150-200 palabras por minuto",
        "200-250 palabras por minuto",
        "300-350 palabras por minuto",
        "400-450 palabras por minuto"
      ],
      correct: 1
    },
    {
      question: "¿Cuánto tiempo de práctica diaria se recomienda?",
      options: [
        "5-10 minutos",
        "10-15 minutos",
        "20-25 minutos",
        "30-45 minutos"
      ],
      correct: 1
    }
  ]

  const wordCount = testText.split(/\s+/).length

  const steps = [
    { title: "¡Bienvenido a Campayo Spreeder Pro!", content: "welcome" },
    { title: "Test de Velocidad Inicial", content: "reading-test" },
    { title: "Test de Comprensión", content: "comprehension-test" },
    { title: "Resultados de tu Baseline", content: "results" }
  ]

  const currentStep = steps[step]

  const startReadingTest = () => {
    setIsReading(true)
    setStartTime(Date.now())
  }

  const finishReadingTest = () => {
    setIsReading(false)
    setEndTime(Date.now())
    setStep(2)
  }

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: answerIndex
    })
  }

  const calculateResults = () => {
    const readingTimeMs = endTime - startTime
    const readingTimeMin = readingTimeMs / 60000
    const wpm = Math.round(wordCount / readingTimeMin)
    
    const correctAnswers = questions.filter((q, index) => 
      answers[index] === q.correct
    ).length
    const comprehensionScore = Math.round((correctAnswers / questions.length) * 100)
    
    return { wpm, comprehensionScore, correctAnswers }
  }

  const handleComplete = () => {
    const results = calculateResults()
    onComplete(results)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <Progress value={(step / (steps.length - 1)) * 100} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Paso {step + 1} de {steps.length}</span>
            <span>{Math.round((step / (steps.length - 1)) * 100)}% completado</span>
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="min-h-[500px]">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {currentStep.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep.content === 'welcome' && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-lg text-muted-foreground">
                      Antes de comenzar tu entrenamiento, vamos a medir tu velocidad de lectura actual.
                    </p>
                    <p className="text-muted-foreground">
                      Este test nos ayudará a personalizar tu programa de entrenamiento.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="text-center p-4 border rounded-lg">
                      <Timer className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium">Test de Velocidad</h3>
                      <p className="text-sm text-muted-foreground">2-3 minutos</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-medium">Test de Comprensión</h3>
                      <p className="text-sm text-muted-foreground">2 preguntas</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <h3 className="font-medium">Plan Personalizado</h3>
                      <p className="text-sm text-muted-foreground">Basado en resultados</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setStep(1)} 
                    className="mt-8"
                    size="lg"
                  >
                    Comenzar Test
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {currentStep.content === 'reading-test' && (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <p className="text-lg">
                      Lee el siguiente texto a tu velocidad normal de lectura.
                    </p>
                    <p className="text-muted-foreground">
                      Presiona "Comenzar" cuando estés listo y "Terminé" cuando hayas acabado.
                    </p>
                  </div>

                  {!isReading && !endTime && (
                    <div className="text-center">
                      <Button 
                        onClick={startReadingTest}
                        size="lg"
                        className="mb-6"
                      >
                        <Timer className="w-4 h-4 mr-2" />
                        Comenzar Lectura
                      </Button>
                    </div>
                  )}

                  <div className={`p-6 bg-muted/50 rounded-lg border-2 ${isReading ? 'border-blue-500' : 'border-dashed'}`}>
                    {isReading && (
                      <div className="text-center mb-4">
                        <Badge className="bg-red-500 text-white animate-pulse">
                          <Timer className="w-3 h-3 mr-1" />
                          Leyendo...
                        </Badge>
                      </div>
                    )}
                    
                    <div className="prose max-w-none text-justify leading-relaxed">
                      {testText.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">
                          {paragraph.trim()}
                        </p>
                      ))}
                    </div>
                  </div>

                  {isReading && (
                    <div className="text-center">
                      <Button 
                        onClick={finishReadingTest}
                        size="lg"
                        variant="destructive"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Terminé de Leer
                      </Button>
                    </div>
                  )}

                  {endTime && (
                    <div className="text-center">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-green-800">
                          ¡Perfecto! Tiempo: {Math.round((endTime - startTime) / 1000)} segundos
                        </p>
                      </div>
                      <Button onClick={() => setStep(2)} size="lg">
                        Continuar
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {currentStep.content === 'comprehension-test' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-lg mb-2">
                      Responde las preguntas sobre el texto.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {questions.map((question, questionIndex) => (
                      <Card key={questionIndex} className="p-4">
                        <div className="space-y-4">
                          <h3 className="font-medium">
                            {questionIndex + 1}. {question.question}
                          </h3>
                          <RadioGroup
                            value={answers[questionIndex]?.toString()}
                            onValueChange={(value) => handleAnswerSelect(questionIndex, parseInt(value))}
                          >
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <RadioGroupItem 
                                  value={optionIndex.toString()} 
                                  id={`q${questionIndex}-${optionIndex}`}
                                />
                                <Label 
                                  htmlFor={`q${questionIndex}-${optionIndex}`}
                                  className="cursor-pointer"
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="text-center">
                    <Button 
                      onClick={() => setStep(3)}
                      disabled={Object.keys(answers).length < questions.length}
                      size="lg"
                    >
                      Ver Resultados
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep.content === 'results' && endTime && (
                <div className="space-y-6">
                  {(() => {
                    const results = calculateResults()
                    return (
                      <>
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <h2 className="text-2xl font-bold mb-2">¡Test Completado!</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="text-center p-6">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {results.wpm}
                            </div>
                            <div className="text-sm text-muted-foreground mb-4">
                              Palabras por Minuto
                            </div>
                          </Card>

                          <Card className="text-center p-6">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {results.comprehensionScore}%
                            </div>
                            <div className="text-sm text-muted-foreground mb-4">
                              Comprensión
                            </div>
                          </Card>
                        </div>

                        <div className="text-center">
                          <Button 
                            onClick={handleComplete}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-purple-600"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            ¡Comenzar Entrenamiento!
                          </Button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}