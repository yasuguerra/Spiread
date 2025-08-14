'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, MessageSquare, Loader2, Sparkles } from 'lucide-react'

export default function AIToolsPanel({ document, userId = 'anonymous' }) {
  const [loading, setLoading] = useState({ summarize: false, questions: false })
  const [results, setResults] = useState({ summary: null, questions: null })
  const [usage, setUsage] = useState({ dailyCalls: 0, monthlyTokens: 0 })

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
          locale: 'es',
          userId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResults(prev => ({ ...prev, summary: data }))
        if (data.tokenCount) {
          setUsage(prev => ({ 
            ...prev, 
            dailyCalls: prev.dailyCalls + 1,
            monthlyTokens: prev.monthlyTokens + data.tokenCount 
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
          locale: 'es',
          n: 5,
          userId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResults(prev => ({ ...prev, questions: data }))
        if (data.tokenCount) {
          setUsage(prev => ({ 
            ...prev, 
            dailyCalls: prev.dailyCalls + 1,
            monthlyTokens: prev.monthlyTokens + data.tokenCount 
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Herramientas AI
        </CardTitle>
        <div className="flex gap-2 text-xs">
          <Badge variant="outline">
            Llamadas hoy: {usage.dailyCalls}/10
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
            disabled={loading.summarize || !document?.id}
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

          <Button 
            onClick={handleGenerateQuestions}
            disabled={loading.questions || !document?.id}
            className="w-full"
            variant="outline"
          >
            {loading.questions ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4 mr-2" />
            )}
            Generar Preguntas
          </Button>
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
                Preguntas de Comprensión
                {results.questions.cached && <Badge variant="secondary">Caché</Badge>}
                {results.questions.fallback && <Badge variant="destructive">Local</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.questions.items?.map((question, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="font-medium text-sm mb-2">
                      {index + 1}. {question.q}
                    </div>
                    <div className="space-y-1">
                      {question.choices?.map((choice, choiceIndex) => (
                        <div 
                          key={choiceIndex}
                          className={`text-sm p-2 rounded ${
                            choiceIndex === question.correctIndex 
                              ? 'bg-green-100 text-green-800 font-medium' 
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {String.fromCharCode(65 + choiceIndex)}. {choice}
                        </div>
                      ))}
                    </div>
                    {question.explain && (
                      <div className="text-xs text-muted-foreground mt-2 italic">
                        {question.explain}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!document?.id && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Importa un documento para usar las herramientas AI
          </div>
        )}
      </CardContent>
    </Card>
  )
}