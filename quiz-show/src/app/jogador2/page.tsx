'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSocket } from '@/lib/socket'

interface Question {
  id: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  difficulty: string
}

interface GameState {
  gameId: string | null
  isActive: boolean
  currentRound: number
  totalRounds: number
  question: Question | null
  timeRemaining: number
  isRunning: boolean
  participants: any[]
  score: number
  lastAnswer: {
    isCorrect: boolean
    points: number
    correctAnswer: string
  } | null
}

export default function Jogador2Page() {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [gameState, setGameState] = useState<GameState>({
    gameId: null,
    isActive: false,
    currentRound: 0,
    totalRounds: 8,
    question: null,
    timeRemaining: 30,
    isRunning: false,
    participants: [],
    score: 0,
    lastAnswer: null
  })
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  useEffect(() => {
    const socketInstance = getSocket()
    setSocket(socketInstance)

    if (socketInstance) {
      // Connection events
      socketInstance.on('connect', () => {
        console.log('🔌 Jogador 2 conectado')
        setIsConnected(true)
        
        // Register player
        socketInstance.emit('player:register', {
          playerId: 'jogador2',
          playerName: 'Jogador 2'
        })
      })

      socketInstance.on('disconnect', () => {
        console.log('🔌 Jogador 2 desconectado')
        setIsConnected(false)
      })

      // Game events
      socketInstance.on('game:started', (data: any) => {
        console.log('🎮 Jogo iniciado:', data)
        setGameState(prev => ({
          ...prev,
          gameId: data.gameId,
          isActive: true,
          currentRound: data.currentRound,
          totalRounds: data.totalRounds,
          question: data.question,
          participants: data.participants,
          timeRemaining: 30,
          isRunning: true,
          score: 0,
          lastAnswer: null
        }))
        setSelectedAnswer(null)
        setHasAnswered(false)
      })

      socketInstance.on('round:started', (data: any) => {
        console.log('🎯 Rodada iniciada:', data)
        setGameState(prev => ({
          ...prev,
          currentRound: data.roundNumber,
          question: data.question,
          timeRemaining: data.timeRemaining,
          isRunning: true
        }))
        setSelectedAnswer(null)
        setHasAnswered(false)
      })

      socketInstance.on('round:ended', (data: any) => {
        console.log('🏁 Rodada finalizada:', data)
        setGameState(prev => ({
          ...prev,
          isRunning: false,
          timeRemaining: 0
        }))
      })

      socketInstance.on('game:ended', (data: any) => {
        console.log('🏆 Jogo finalizado:', data)
        setGameState(prev => ({
          ...prev,
          isActive: false,
          gameId: null,
          currentRound: 0,
          question: null,
          isRunning: false,
          timeRemaining: 30
        }))
        setSelectedAnswer(null)
        setHasAnswered(false)
      })

      // Timer events
      socketInstance.on('timer:update', (data: any) => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: data.timeRemaining,
          isRunning: data.isRunning
        }))
      })

      // Answer result
      socketInstance.on('answer:result', (data: any) => {
        console.log('📝 Resultado da resposta:', data)
        setGameState(prev => ({
          ...prev,
          lastAnswer: data,
          score: prev.score + data.points
        }))
      })
    }

    return () => {
      if (socketInstance) {
        socketInstance.off('connect')
        socketInstance.off('disconnect')
        socketInstance.off('game:started')
        socketInstance.off('round:started')
        socketInstance.off('round:ended')
        socketInstance.off('game:ended')
        socketInstance.off('timer:update')
        socketInstance.off('answer:result')
      }
    }
  }, [])

  const handleAnswer = (answer: string) => {
    if (!gameState.isActive || hasAnswered || !gameState.question || !socket) {
      return
    }

    setSelectedAnswer(answer)
    setHasAnswered(true)

    // Send answer to server
    socket.emit('player:answer', {
      gameId: gameState.gameId,
      questionId: gameState.question.id,
      answer: answer,
      participantId: 'jogador2' // This should be the actual participant ID
    })

    console.log('📝 Resposta enviada:', answer)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil'
      case 'medium': return 'Médio'
      case 'hard': return 'Difícil'
      default: return 'Desconhecido'
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎮 Jogador 2</h1>
          <div className="flex items-center justify-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-lg">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            {gameState.isActive && (
              <Badge className="bg-green-600">Jogo Ativo</Badge>
            )}
          </div>
        </div>

        {/* Game Status */}
        {gameState.isActive && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/10 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{gameState.currentRound}</div>
                <div className="text-sm">Rodada Atual</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{gameState.score}</div>
                <div className="text-sm">Pontuação</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{gameState.timeRemaining}</div>
                <div className="text-sm">Tempo Restante</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{gameState.totalRounds}</div>
                <div className="text-sm">Total de Rodadas</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Question Card */}
        {gameState.isActive && gameState.question && (
          <Card className="bg-white/10 backdrop-blur-sm mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Pergunta {gameState.currentRound}</CardTitle>
                <Badge className={getDifficultyColor(gameState.question.difficulty)}>
                  {getDifficultyText(gameState.question.difficulty)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-8">
                <p className="text-2xl font-semibold mb-6">{gameState.question.text}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleAnswer('A')}
                    disabled={hasAnswered || !gameState.isRunning}
                    className={`h-16 text-lg ${
                      selectedAnswer === 'A' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    A) {gameState.question.optionA}
                  </Button>
                  <Button
                    onClick={() => handleAnswer('B')}
                    disabled={hasAnswered || !gameState.isRunning}
                    className={`h-16 text-lg ${
                      selectedAnswer === 'B' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    B) {gameState.question.optionB}
                  </Button>
                  <Button
                    onClick={() => handleAnswer('C')}
                    disabled={hasAnswered || !gameState.isRunning}
                    className={`h-16 text-lg ${
                      selectedAnswer === 'C' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    C) {gameState.question.optionC}
                  </Button>
                </div>

                {hasAnswered && (
                  <div className="mt-6 p-4 bg-white/20 rounded-lg">
                    <p className="text-lg font-semibold mb-2">
                      {gameState.lastAnswer?.isCorrect ? '✅ Correto!' : '❌ Incorreto!'}
                    </p>
                    <p className="text-sm">
                      Resposta correta: {gameState.lastAnswer?.correctAnswer}
                    </p>
                    <p className="text-sm">
                      Pontos ganhos: +{gameState.lastAnswer?.points || 0}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waiting State */}
        {!gameState.isActive && (
          <Card className="bg-white/10 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold mb-4">Aguardando Início do Jogo</h2>
              <p className="text-gray-300">
                O administrador iniciará uma partida em breve...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Participants List */}
        {gameState.participants.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>👥 Participantes do Jogo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gameState.participants.map((participant, index) => (
                  <div key={index} className="bg-white/20 rounded-lg p-4 text-center">
                    <div className="text-lg font-semibold">{participant.name}</div>
                    <div className="text-sm text-gray-300">{participant.city}, {participant.state}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-300">
            Abra <a href="/jogador1" className="text-blue-400 hover:underline">Jogador 1</a> e <a href="/jogador3" className="text-blue-400 hover:underline">Jogador 3</a> em outras abas para testar o jogo
          </p>
        </div>
      </div>
    </main>
  )
}