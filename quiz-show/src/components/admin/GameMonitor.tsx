'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAdminSocket } from '@/lib/socket'

interface GameState {
  isActive: boolean
  gameId: string | null
  currentRound: number
  totalRounds: number
  question: {
    id: string
    text: string
    optionA: string
    optionB: string
    optionC: string
    correct_answer: string
    difficulty: string
  } | null
  timeRemaining: number
  isRunning: boolean
  participants: Array<{
    id: string
    name: string
    score: number
  }>
  recentAnswers: Array<{
    participantId: string
    participantName: string
    answer: string
    isCorrect: boolean
    responseTime: number
    points: number
    timestamp: number
  }>
}

interface GameMonitorProps {
  adminSocket?: any
}

export default function GameMonitor({ adminSocket }: GameMonitorProps) {
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    gameId: null,
    currentRound: 0,
    totalRounds: 8,
    question: null,
    timeRemaining: 30,
    isRunning: false,
    participants: [],
    recentAnswers: []
  })

  const [socket, setSocket] = useState<any>(null)

  useEffect(() => {
    console.log('🔌 GameMonitor: Initializing socket connection...')
    if (adminSocket) {
      console.log('🔌 GameMonitor: Using provided admin socket')
      setSocket(adminSocket)
    } else {
      console.log('🔌 GameMonitor: Creating new socket connection')
      const socketInstance = getAdminSocket()
      setSocket(socketInstance)
    }

    // Set up socket listeners after socket is set
    const setupSocketListeners = (socketInstance: any) => {
      if (socketInstance) {
        console.log('🔌 GameMonitor: Socket created, setting up listeners...')
        
        socketInstance.on('connect', () => {
          console.log('✅ GameMonitor: Admin connected to game monitor')
        })

        socketInstance.on('disconnect', () => {
          console.log('❌ GameMonitor: Admin disconnected from game monitor')
        })

        socketInstance.on('game:round:started', (data: any) => {
          console.log('🎯 GameMonitor: Round started event received:', data)
          setGameState(prev => ({
            ...prev,
            isActive: true,
            gameId: data.gameId,
            currentRound: data.roundNumber,
            question: data.question,
            timeRemaining: data.timeRemaining,
            isRunning: true,
            recentAnswers: []
          }))
        })

        socketInstance.on('game:answer:received', (data: any) => {
          console.log('📝 GameMonitor: Answer received event:', data)
          setGameState(prev => ({
            ...prev,
            recentAnswers: [
              {
                ...data,
                timestamp: Date.now()
              },
              ...prev.recentAnswers
            ].slice(0, 10) // Keep only last 10 answers
          }))
        })

        socketInstance.on('game:round:ended', (data: any) => {
          console.log('🏁 GameMonitor: Round ended event:', data)
          setGameState(prev => ({
            ...prev,
            isRunning: false,
            participants: data.currentScores,
            recentAnswers: []
          }))
        })

        socketInstance.on('game:timer:update', (data: any) => {
          setGameState(prev => ({
            ...prev,
            timeRemaining: data.timeRemaining,
            isRunning: data.isRunning
          }))
        })

        socketInstance.on('game:ended', (data: any) => {
          console.log('🏆 GameMonitor: Game ended event:', data)
          setGameState(prev => ({
            ...prev,
            isActive: false,
            isRunning: false,
            participants: data.finalScores
          }))
        })
      } else {
        console.error('❌ GameMonitor: Failed to create socket')
      }
    }

    // Set up listeners after socket is set
    if (adminSocket) {
      setupSocketListeners(adminSocket)
    } else {
      const socketInstance = getAdminSocket()
      if (socketInstance) {
        setSocket(socketInstance)
        setupSocketListeners(socketInstance)
      }
    }

    return () => {
      // Only disconnect if we created the socket ourselves
      if (!adminSocket && socket) {
        socket.disconnect()
      }
    }
  }, [adminSocket])

  const handleStopGame = () => {
    if (socket && gameState.gameId) {
      socket.emit('admin:game:stop')
    }
  }

  const handleEndRound = () => {
    if (socket && gameState.gameId) {
      socket.emit('admin:round:end')
    }
  }

  const handleNewGame = () => {
    if (socket) {
      socket.emit('admin:game:new')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil'
      case 'medium': return 'Médio'
      case 'hard': return 'Difícil'
      default: return 'N/A'
    }
  }

  const getTimeColor = () => {
    if (gameState.timeRemaining <= 5) return 'text-red-600'
    if (gameState.timeRemaining <= 10) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (!gameState.isActive) {
    return (
      <Card className="w-full bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-center">Monitor do Jogo</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-gray-400">
            <div className="text-4xl mb-4">🎮</div>
            <p className="text-lg">Nenhum jogo ativo</p>
            <p className="text-sm">Inicie um jogo para acompanhar o progresso</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Game Status Header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Monitor do Jogo</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-blue-500 text-white">
                Rodada {gameState.currentRound}/{gameState.totalRounds}
              </Badge>
              <Badge className={`${getTimeColor()} bg-gray-700`}>
                {gameState.timeRemaining}s
              </Badge>
              <Button 
                onClick={handleEndRound}
                variant="outline"
                size="sm"
                disabled={!gameState.isRunning}
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
              >
                Finalizar Rodada
              </Button>
              <Button 
                onClick={handleStopGame}
                variant="destructive"
                size="sm"
              >
                Parar Jogo
              </Button>
              <Button 
                onClick={handleNewGame}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Nova Partida
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Game Progress */}
        <div className="space-y-4">
          {/* Current Question */}
          {gameState.question && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                  <Badge className={getDifficultyColor(gameState.question.difficulty)}>
                    {getDifficultyText(gameState.question.difficulty)}
                  </Badge>
                  <Badge className="bg-purple-500 text-white">
                    Pergunta {gameState.currentRound}
                  </Badge>
                </div>
                <CardTitle className="text-white text-lg">
                  {gameState.question.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">A</span>
                    <span className="text-white">{gameState.question.optionA}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">B</span>
                    <span className="text-white">{gameState.question.optionB}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">C</span>
                    <span className="text-white">{gameState.question.optionC}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Answers */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Respostas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {gameState.recentAnswers.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Aguardando respostas...</p>
                ) : (
                  gameState.recentAnswers.map((answer, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          answer.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {answer.answer}
                        </span>
                        <span className="text-white text-sm">{answer.participantName}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${answer.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {answer.points} pts
                        </div>
                        <div className="text-xs text-gray-400">
                          {(answer.responseTime / 1000).toFixed(1)}s
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Player Scores */}
        <div className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Placar dos Jogadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gameState.participants
                  .sort((a, b) => b.score - a.score)
                  .map((participant, index) => (
                  <div key={participant.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <span className="text-white font-semibold">
                        {participant.name}
                      </span>
                    </div>
                    <span className="text-yellow-400 font-bold text-lg">
                      {participant.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Game Statistics */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Estatísticas do Jogo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {gameState.currentRound}
                  </div>
                  <div className="text-sm text-gray-400">Rodada Atual</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {gameState.participants.length}
                  </div>
                  <div className="text-sm text-gray-400">Jogadores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {gameState.recentAnswers.filter(a => a.isCorrect).length}
                  </div>
                  <div className="text-sm text-gray-400">Acertos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {gameState.recentAnswers.filter(a => !a.isCorrect).length}
                  </div>
                  <div className="text-sm text-gray-400">Erros</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
