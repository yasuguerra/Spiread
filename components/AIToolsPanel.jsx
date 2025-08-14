'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Brain, MessageSquare, Loader2, Sparkles, CheckCircle, XCircle, Quote } from 'lucide-react'

export default function AIToolsPanel({ document, userId = 'anonymous', locale = 'es' }) {
  const [loading, setLoading] = useState({ summarize: false, questions: false })
  const [results, setResults] = useState({ summary: null, questions: null })
  const [usage, setUsage] = useState({ dailyCalls: 0, monthlyTokens: 0, remaining: 10 })
  const [questionCount, setQuestionCount] = useState(5)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null)
  const [userAnswers, setUserAnswers] = useState({})
  const [quizCompleted, setQuizCompleted] = useState(false)

  // Load usage information on mount
  useEffect(() => {
    loadUsageInfo()
  }, [userId])

  const loadUsageInfo = async () => {
    try {
      const response = await fetch('/api/ai/health')
      if (response.ok) {
        const healthData = await response.json()
        // Update usage based on health check
        setUsage(prev => ({
          ...prev,
          remaining: healthData.quotas?.maxCallsPerDay || 10
        }))
      }
    } catch (error) {
      console.error('Error loading usage info:', error)
    }
  }

  const handleSummarize = async () => {
    if (!document?.id) {
      alert('No hay documento seleccionado para resumir')
      return
    }

    setLoading(prev => ({ ...prev, summarize: true }))
    
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: document.id,
          locale,
          userId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResults(prev => ({ ...prev, summary: data }))
        if (data.tokenCount && !data.cached && !data.fallback) {
          setUsage(prev => ({ 
            ...prev, 
            dailyCalls: prev.dailyCalls + 1,
            monthlyTokens: prev.monthlyTokens + data.tokenCount,
            remaining: Math.max(0, prev.remaining - 1)
          }))
        }
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error summarizing:', error)
      alert('Error al generar resumen')
    } finally {
      setLoading(prev => ({ ...prev, summarize: false }))
    }
  }

  const handleGenerateQuestions = async () => {
    if (!document?.id) {
      alert('No hay documento seleccionado para generar preguntas')
      return
    }

    setLoading(prev => ({ ...prev, questions: true }))
    
    try {
      const response = await fetch('/api/ai/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: document.id,
          locale,
          n: questionCount,
          userId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResults(prev => ({ ...prev, questions: data }))
        setUserAnswers({})
        setQuizCompleted(false)
        setSelectedQuestionIndex(null)
        
        if (data.tokenCount && !data.cached && !data.fallback) {
          setUsage(prev => ({ 
            ...prev, 
            dailyCalls: prev.dailyCalls + 1,
            monthlyTokens: prev.monthlyTokens + data.tokenCount,
            remaining: Math.max(0, prev.remaining - 1)
          }))
        }
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      alert('Error al generar preguntas')
    } finally {
      setLoading(prev => ({ ...prev, questions: false }))
    }
  }

  const handleQuestionAnswer = (questionIndex, choiceIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: choiceIndex
    }))
  }

  const handleQuizComplete = async () => {
    if (!results.questions?.items) return

    const correctAnswers = results.questions.items.filter((item, index) => 
      userAnswers[index] === item.correctIndex
    ).length

    const accuracy = (correctAnswers / results.questions.items.length) * 100
    const duration = Date.now() - results.questions.startTime || 60000

    setQuizCompleted(true)

    // Save quiz results as game run
    try {
      const gameRunData = {
        userId,
        game: 'reading_quiz',
        score: correctAnswers,
        durationMs: duration,
        difficultyLevel: Math.ceil(results.questions.items.length / 2),
        metrics: {
          totalQuestions: results.questions.items.length,
          correctAnswers,
          accuracy: accuracy / 100,
          timePerQuestion: duration / results.questions.items.length,
          questions: results.questions.items.map((item, index) => ({
            qid: item.qid,
            type: item.type,
            userAnswer: userAnswers[index],
            correctAnswer: item.correctIndex,
            correct: userAnswers[index] === item.correctIndex
          }))
        }
      }

      await fetch('/api/gameRuns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameRunData)
      })
    } catch (error) {
      console.error('Error saving quiz results:', error)
    }
  }

  const getAnsweredCount = () => {
    return Object.keys(userAnswers).length
  }

  const getTotalQuestions = () => {
    return results.questions?.items?.length || 0
  }

  const canCompleteQuiz = () => {
    return getTotalQuestions() > 0 && getAnsweredCount() === getTotalQuestions()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Herramientas AI
        </CardTitle>
        <div className="flex gap-2 text-xs">
          <Badge variant="outline">
            Llamadas restantes: {usage.remaining}
          </Badge>
          <Badge variant="outline">
            Tokens: {usage.monthlyTokens}/100k
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={handleSummarize}
            disabled={loading.summarize || !document?.id || usage.remaining <= 0}
            className="w-full"
            variant="outline"
          >
            {loading.summarize ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Brain className="w-4 h-4 mr-2" />
            )}
            Resumir Texto
          </Button>

          <div className="flex gap-2">
            <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleGenerateQuestions}
              disabled={loading.questions || !document?.id || usage.remaining <= 0}
              className="flex-1"
              variant="outline"
            >
              {loading.questions ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Preguntas ({questionCount})
            </Button>
          </div>
        </div>

        {/* Results Display */}
        {results.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Resumen
                {results.summary.cached && <Badge variant="secondary">Caché</Badge>}
                {results.summary.fallback && <Badge variant="destructive">Local</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="font-medium text-sm">Resumen:</div>
                <p className="text-sm text-muted-foreground">
                  {results.summary.abstract}
                </p>
                {results.summary.bullets && results.summary.bullets.length > 0 && (
                  <div>
                    <div className="font-medium text-sm mt-3 mb-2">Puntos clave:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {results.summary.bullets.map((bullet, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {results.questions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Quiz de Comprensión
                {results.questions.cached && <Badge variant="secondary">Caché</Badge>}
                {results.questions.fallback && <Badge variant="destructive">Local</Badge>}
                <div className="ml-auto text-xs">
                  {getAnsweredCount()}/{getTotalQuestions()} respondidas
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.questions.items?.map((question, questionIndex) => (
                  <div key={question.qid || questionIndex} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-medium text-sm">
                        {questionIndex + 1}. {question.q}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {question.type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {question.choices?.map((choice, choiceIndex) => {
                        const isSelected = userAnswers[questionIndex] === choiceIndex
                        const isCorrect = choiceIndex === question.correctIndex
                        const showAnswer = quizCompleted
                        
                        return (
                          <button
                            key={choiceIndex}
                            onClick={() => !quizCompleted && handleQuestionAnswer(questionIndex, choiceIndex)}
                            disabled={quizCompleted}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              showAnswer
                                ? isCorrect
                                  ? 'bg-green-100 border-green-300 text-green-800'
                                  : isSelected && !isCorrect
                                  ? 'bg-red-100 border-red-300 text-red-800'
                                  : 'bg-gray-50 border-gray-200'
                                : isSelected
                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {showAnswer && isCorrect && <CheckCircle className="w-4 h-4" />}
                              {showAnswer && isSelected && !isCorrect && <XCircle className="w-4 h-4" />}
                              <span className="font-medium">
                                {String.fromCharCode(65 + choiceIndex)}.
                              </span>
                              <span>{choice}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    {quizCompleted && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-muted-foreground">
                          <div className="font-medium">Explicación:</div>
                          <p>{question.explain}</p>
                        </div>
                        {question.evidence && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <div className="flex items-start gap-2">
                              <Quote className="w-3 h-3 mt-0.5 text-blue-600" />
                              <div>
                                <div className="font-medium text-blue-900">Evidencia:</div>
                                <div className="text-blue-800">"{question.evidence.quote}"</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {!quizCompleted && getTotalQuestions() > 0 && (
                  <div className="text-center pt-4">
                    <Button 
                      onClick={handleQuizComplete}
                      disabled={!canCompleteQuiz()}
                      size="lg"
                    >
                      Completar Quiz ({getAnsweredCount()}/{getTotalQuestions()})
                    </Button>
                  </div>
                )}
                
                {quizCompleted && (
                  <div className="text-center pt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold">
                      Quiz Completado: {Object.values(userAnswers).filter((answer, index) => 
                        answer === results.questions.items[index]?.correctIndex
                      ).length}/{getTotalQuestions()} correctas
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Precisión: {Math.round((Object.values(userAnswers).filter((answer, index) => 
                        answer === results.questions.items[index]?.correctIndex
                      ).length / getTotalQuestions()) * 100)}%
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!document?.id && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Importa un documento para usar las herramientas AI
          </div>
        )}
        
        {usage.remaining <= 0 && (
          <div className="text-center py-4 text-red-600 text-sm">
            Límite diario de llamadas AI alcanzado. Reinicia mañana.
          </div>
        )}
      </CardContent>
    </Card>
  )
}