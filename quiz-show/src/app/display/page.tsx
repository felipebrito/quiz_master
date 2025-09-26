'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSocket } from '@/lib/socket'
import { 
  Trophy, 
  Clock, 
  Users, 
  Target,
  Star,
  Crown,
  Zap
} from 'lucide-react'

interface GameState {
  isActive: boolean
  gameId: string | null
  currentRound: number
  totalRounds: number
  question: {
    id: string
    text: string
    options: string[]
    correct_answer: string
  } | null
  participants: Array<{
    id: string
    name: string
    score: number
  }>
  timeRemaining: number
  isRunning: boolean
  winner: {
    id: string
    name: string
    score: number
  } | null
}

interface LeaderboardEntry {
  id: string
  name: string
  score: number
  city: string
  state: string
}

export default function DisplayPage() {
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    gameId: null,
    currentRound: 0,
    totalRounds: 8,
    question: null,
    participants: [],
    timeRemaining: 30,
    isRunning: false,
    winner: null
  })
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isIdle, setIsIdle] = useState(true)

  useEffect(() => {
    const socketInstance = getSocket()
    setSocket(socketInstance)

    if (socketInstance) {
      // Connection events
      socketInstance.on('connect', () => {
        console.log('🔌 Display conectado')
        setIsConnected(true)
      })

      socketInstance.on('disconnect', () => {
        console.log('🔌 Display desconectado')
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
          winner: null
        }))
        setIsIdle(false)
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
          timeRemaining: 30,
          winner: data.winner
        }))
        
        // Show winner for 5 seconds, then return to idle
        setTimeout(() => {
          setIsIdle(true)
          loadLeaderboard()
        }, 5000)
      })

      // Timer events
      socketInstance.on('timer:update', (data: any) => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: data.timeRemaining,
          isRunning: data.isRunning
        }))
      })

      // Answer result events
      socketInstance.on('answer:result', (data: any) => {
        console.log('📝 Resultado da resposta:', data)
        // Update participant scores if needed
      })
    }

    // Load initial leaderboard
    loadLeaderboard()

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

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/ranking')
      const data = await response.json()
      
      if (data.success) {
        setLeaderboard(data.data)
      } else {
        console.error('Erro ao carregar ranking:', data.error)
        setLeaderboard([])
      }
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error)
      setLeaderboard([])
    }
  }

  if (isIdle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-3xl opacity-75"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-8">
                  <Trophy className="h-24 w-24 text-yellow-400" />
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
              Quiz Show
              <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Interativo
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-slate-300 mb-8">
              Aguardando próxima partida...
            </p>
          </div>

          {/* Leaderboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaderboard.map((participant, index) => (
              <Card key={participant.id} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {index === 0 && <Crown className="h-6 w-6 text-yellow-400" />}
                      {index === 1 && <Trophy className="h-6 w-6 text-gray-400" />}
                      {index === 2 && <Trophy className="h-6 w-6 text-orange-400" />}
                      {index > 2 && <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>}
                      <h3 className="text-xl font-semibold text-white">{participant.name}</h3>
                    </div>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      {participant.score} pts
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {participant.city}, {participant.state}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center text-slate-400 text-xl">
              Nenhuma partida realizada ainda
            </div>
          )}
        </div>
      </div>
    )
  }

  if (gameState.winner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-8">
            <Crown className="h-32 w-32 text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
              🎉 PARABÉNS! 🎉
            </h1>
            <h2 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-6">
              {gameState.winner.name}
            </h2>
            <p className="text-2xl md:text-3xl text-white mb-8">
              Vencedor com {gameState.winner.score} pontos!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {gameState.participants.map((participant, index) => (
              <Card key={participant.id} className={`bg-white/10 backdrop-blur-sm border-white/20 ${
                participant.id === gameState.winner?.id ? 'ring-4 ring-yellow-400' : ''
              }`}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-2">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{participant.name}</h3>
                  <p className="text-2xl font-bold text-yellow-400">{participant.score} pts</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Quiz Show Interativo
          </h1>
          <div className="flex justify-center items-center gap-8 text-2xl text-slate-300">
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-400" />
              Rodada {gameState.currentRound}/{gameState.totalRounds}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-green-400" />
              {gameState.timeRemaining}s
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-purple-400" />
              {gameState.participants.length} jogadores
            </div>
          </div>
        </div>

        {/* Question */}
        {gameState.question && (
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-white">
                {gameState.question.text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gameState.question.options.map((option, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-6 text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <p className="text-xl text-white">{option}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participants Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gameState.participants.map((participant, index) => (
            <Card key={participant.id} className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">{participant.name}</h3>
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-6 w-6 text-yellow-400" />
                  <span className="text-3xl font-bold text-yellow-400">{participant.score}</span>
                  <span className="text-slate-400">pts</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Timer Bar */}
        <div className="mt-8">
          <div className="bg-slate-700 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-500 to-red-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(gameState.timeRemaining / 30) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
