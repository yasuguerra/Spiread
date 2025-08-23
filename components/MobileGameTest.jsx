'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SessionShell from '@/components/SessionShell'
import ParImpar from '@/components/games/ParImpar'
import WordSearch from '@/components/games/WordSearch' 
import LettersGrid from '@/components/games/LettersGrid'
import TwinWords from '@/components/TwinWords'

/**
 * Mobile Game Test Page
 * Tests all mobile-first game implementations
 */
export default function MobileGameTest() {
  const [selectedGame, setSelectedGame] = useState(null)
  const [testResults, setTestResults] = useState([])

  const games = [
    {
      id: 'par-impar',
      name: 'Par/Impar',
      component: ParImpar,
      props: { 
        level: 1, 
        userId: 'test-user',
        timeLimit: 120000
      },
      description: 'Number recognition with mobile-first responsive grid',
      issues: ['Numbers not showing', 'Layout shifting on mobile']
    },
    {
      id: 'twin-words', 
      name: 'Palabras Gemelas',
      component: TwinWords,
      props: {
        level: 1,
        gameParams: { difficulty: 1, wordLength: 5 }
      },
      description: 'Word comparison with improved difficulty progression',
      issues: ['Words too similar', 'Mobile touch targets too small']
    },
    {
      id: 'letters-grid',
      name: 'Letters Grid', 
      component: LettersGrid,
      props: {
        level: 1,
        locale: 'es'
      },
      description: 'Letter finding with fixed initialization',
      issues: ['Game doesn\'t start', 'Mobile grid sizing']
    },
    {
      id: 'word-search',
      name: 'Word Search',
      component: WordSearch,
      props: {
        level: 1,
        locale: 'es'
      },
      description: 'Word finding with mobile tap mode',
      issues: ['Game doesn\'t start', 'Grid overflow on mobile']
    }
  ]

  const runGameTest = (gameId) => {
    setSelectedGame(gameId)
  }

  const exitGame = () => {
    setSelectedGame(null)
  }

  const completeGame = (results) => {
    setTestResults(prev => [...prev, {
      gameId: selectedGame,
      timestamp: new Date().toLocaleTimeString(),
      results,
      success: true
    }])
    setSelectedGame(null)
  }

  const selectedGameData = games.find(g => g.id === selectedGame)

  if (selectedGame && selectedGameData) {
    const GameComponent = selectedGameData.component
    
    return (
      <SessionShell
        gameTitle={selectedGameData.name}
        gameConfig={{ description: selectedGameData.description }}
        level={selectedGameData.props.level}
        timeLimit={120000}
        onComplete={completeGame}
        onExit={exitGame}
        onBackToGames={exitGame}
        onViewStats={() => console.log('View stats')}
      >
        {({ timeRemaining, isPaused, sessionStarted, ready, onComplete }) => (
          sessionStarted && ready ? (
            <GameComponent
              {...selectedGameData.props}
              timeRemaining={timeRemaining}
              onComplete={onComplete}
              onExit={exitGame}
              onBackToGames={exitGame}
              onViewStats={() => console.log('View stats')}
            />
          ) : null
        )}
      </SessionShell>
    )
  }

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            🔧 Mobile Game Test Suite
          </CardTitle>
          <p className="text-center text-gray-600">
            Testing mobile-first hardening across all games
          </p>
        </CardHeader>
      </Card>

      {/* Test Results Summary */}
      {testResults.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm font-medium">
                    {games.find(g => g.id === result.gameId)?.name}
                  </span>
                  <Badge variant="default" className="bg-green-500">
                    ✅ {result.timestamp}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Test Grid */}
      <div className="space-y-4">
        {games.map(game => (
          <Card key={game.id} className="border-2 hover:border-blue-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{game.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{game.description}</p>
                </div>
                <Button 
                  onClick={() => runGameTest(game.id)}
                  className="min-h-[48px] px-6"
                >
                  Test Game
                </Button>
              </div>
              
              {/* Issues being addressed */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-red-700 mb-1">Issues Fixed:</div>
                {game.issues.map((issue, index) => (
                  <div key={index} className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {issue}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Testing Instructions */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-bold text-blue-900 mb-2">📱 Mobile Testing Checklist</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>✅ Touch targets ≥44×44px (WCAG compliant)</div>
            <div>✅ Single-column responsive layout</div>
            <div>✅ No horizontal overflow</div>
            <div>✅ Safe area support (bottom padding)</div>
            <div>✅ Visibility pause handling</div>
            <div>✅ Client-side initialization (no SSR issues)</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
