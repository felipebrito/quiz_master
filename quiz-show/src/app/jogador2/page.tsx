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
    responseTime: number
    isFirst: boolean
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
  const [isAnswering, setIsAnswering] = useState(false)
  const [showAnswerResult, setShowAnswerResult] = useState(false)
  const [pulseAnimation, setPulseAnimation] = useState(false)
  const [shakeAnimation, setShakeAnimation] = useState(false)
  const [glowAnimation, setGlowAnimation] = useState(false)

  // Animation effects
  useEffect(() => {
    if (gameState.isRunning && gameState.timeRemaining <= 10) {
      setPulseAnimation(true)
    } else {
      setPulseAnimation(false)
    }
  }, [gameState.timeRemaining, gameState.isRunning])

  useEffect(() => {
    if (showAnswerResult) {
      const timer = setTimeout(() => {
        setShowAnswerResult(false)
        setSelectedAnswer(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showAnswerResult])

  useEffect(() => {
    const socketInstance = getSocket()
    setSocket(socketInstance)

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ Connected to server')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server')
      setIsConnected(false)
    })

    // Game events
    socketInstance.on('game:started', (data: any) => {
      console.log('🎮 Game started:', data)
      setGameState(prev => ({
        ...prev,
        gameId: data.gameId,
        isActive: true,
        currentRound: data.currentRound,
        totalRounds: data.totalRounds,
        question: data.question,
        participants: data.participants,
        score: 0
      }))
    })

    socketInstance.on('round:started', (data: any) => {
      console.log('🎯 Round started:', data)
      setGameState(prev => ({
        ...prev,
        currentRound: data.roundNumber,
        question: data.question,
        timeRemaining: 30,
        isRunning: true
      }))
      setSelectedAnswer(null)
      setIsAnswering(false)
      setShowAnswerResult(false)
    })

    socketInstance.on('round:ended', (data: any) => {
      console.log('🏁 Round ended:', data)
      setGameState(prev => ({
        ...prev,
        isRunning: false,
        participants: data.currentScores,
        score: data.currentScores.find((p: any) => p.id === 'player2')?.score || prev.score
      }))
    })

    socketInstance.on('timer:update', (data: any) => {
      setGameState(prev => ({
        ...prev,
        timeRemaining: data.timeRemaining,
        isRunning: data.isRunning
      }))
    })

    socketInstance.on('answer:result', (data: any) => {
      console.log('📝 Answer result:', data)
      setGameState(prev => ({
        ...prev,
        lastAnswer: {
          isCorrect: data.isCorrect,
          points: data.points,
          correctAnswer: data.correctAnswer,
          responseTime: data.responseTime,
          isFirst: data.isFirst
        }
      }))
      setShowAnswerResult(true)
      setIsAnswering(false)
      
      // Trigger animations based on result
      if (data.isCorrect) {
        setGlowAnimation(true)
        setTimeout(() => setGlowAnimation(false), 2000)
      } else {
        setShakeAnimation(true)
        setTimeout(() => setShakeAnimation(false), 1000)
      }
    })

    socketInstance.on('answer:received', (data: any) => {
      console.log('📝 Answer received from:', data.participantName)
    })

    socketInstance.on('game:ended', (data: any) => {
      console.log('🏆 Game ended:', data)
      setGameState(prev => ({
        ...prev,
        isActive: false,
        isRunning: false,
        participants: data.finalScores,
        score: data.finalScores.find((p: any) => p.id === 'player2')?.score || prev.score
      }))
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const handleAnswer = (answer: string) => {
    if (!gameState.isActive || !gameState.isRunning || isAnswering) return

    setSelectedAnswer(answer)
    setIsAnswering(true)

    // Send answer to server
    socket.emit('player:answer', {
      gameId: gameState.gameId,
      questionId: gameState.question?.id,
      answer: answer,
      participantId: 'player2',
      participantName: 'Jogador 2'
    })
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

  const getOptionButtonClass = (option: string) => {
    let baseClass = "w-full h-20 text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
    
    if (selectedAnswer === option) {
      if (showAnswerResult && gameState.lastAnswer) {
        if (gameState.lastAnswer.isCorrect && option === gameState.lastAnswer.correctAnswer) {
          return `${baseClass} bg-green-500 text-white shadow-lg shadow-green-500/50 ${glowAnimation ? 'animate-pulse' : ''}`
        } else if (!gameState.lastAnswer.isCorrect && option === selectedAnswer) {
          return `${baseClass} bg-red-500 text-white shadow-lg shadow-red-500/50 ${shakeAnimation ? 'animate-bounce' : ''}`
        } else if (option === gameState.lastAnswer.correctAnswer) {
          return `${baseClass} bg-green-500 text-white shadow-lg shadow-green-500/50`
        }
      }
      return `${baseClass} bg-blue-500 text-white shadow-lg shadow-blue-500/50`
    }
    
    return `${baseClass} bg-white text-gray-800 border-2 border-gray-300 hover:border-blue-500 hover:shadow-lg`
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Conectando ao servidor...</h2>
          <p className="text-green-200">Aguarde enquanto estabelecemos a conexão</p>
        </div>
      </div>
    )
  }

  if (!gameState.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-emerald-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Jogador 2</CardTitle>
            <p className="text-green-200">Aguardando início do jogo...</p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4"></div>
              <p className="text-white">O administrador iniciará o jogo em breve</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-emerald-900 p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Jogador 2</h1>
        <div className="flex justify-center items-center gap-4">
          <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
            Rodada {gameState.currentRound} de {gameState.totalRounds}
          </Badge>
          <Badge className="bg-yellow-500 text-white px-4 py-2 text-lg">
            Pontos: {gameState.score}
          </Badge>
        </div>
      </div>

      {/* Timer */}
      <div className="text-center mb-8">
        <div className={`text-6xl font-bold ${getTimeColor()} ${pulseAnimation ? 'animate-pulse' : ''}`}>
          {gameState.timeRemaining}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 mt-4">
          <div 
            className={`h-4 rounded-full transition-all duration-1000 ${
              gameState.timeRemaining <= 5 ? 'bg-red-500' : 
              gameState.timeRemaining <= 10 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${(gameState.timeRemaining / 30) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      {gameState.question && (
        <Card className="w-full max-w-4xl mx-auto mb-8 bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-between items-center mb-4">
              <Badge className={getDifficultyColor(gameState.question.difficulty)}>
                {getDifficultyText(gameState.question.difficulty)}
              </Badge>
              <Badge className="bg-purple-500 text-white">
                Pergunta {gameState.currentRound}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold text-white leading-relaxed">
              {gameState.question.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleAnswer('A')}
              disabled={!gameState.isRunning || isAnswering}
              className={getOptionButtonClass('A')}
            >
              <span className="font-bold mr-3">A)</span>
              {gameState.question.optionA}
            </Button>
            <Button
              onClick={() => handleAnswer('B')}
              disabled={!gameState.isRunning || isAnswering}
              className={getOptionButtonClass('B')}
            >
              <span className="font-bold mr-3">B)</span>
              {gameState.question.optionB}
            </Button>
            <Button
              onClick={() => handleAnswer('C')}
              disabled={!gameState.isRunning || isAnswering}
              className={getOptionButtonClass('C')}
            >
              <span className="font-bold mr-3">C)</span>
              {gameState.question.optionC}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Answer Result */}
      {showAnswerResult && gameState.lastAnswer && (
        <Card className="w-full max-w-2xl mx-auto mb-8 bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="text-center py-8">
            <div className={`text-6xl mb-4 ${gameState.lastAnswer.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {gameState.lastAnswer.isCorrect ? '✅' : '❌'}
            </div>
            <h3 className={`text-3xl font-bold mb-4 ${gameState.lastAnswer.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {gameState.lastAnswer.isCorrect ? 'Correto!' : 'Incorreto!'}
            </h3>
            <div className="space-y-2">
              <p className="text-white text-lg">
                Resposta correta: <span className="font-bold">{gameState.lastAnswer.correctAnswer}</span>
              </p>
              <p className="text-white text-lg">
                Pontos ganhos: <span className="font-bold text-yellow-400">+{gameState.lastAnswer.points}</span>
              </p>
              <p className="text-white text-lg">
                Tempo de resposta: <span className="font-bold">{(gameState.lastAnswer.responseTime / 1000).toFixed(1)}s</span>
              </p>
              {gameState.lastAnswer.isFirst && (
                <p className="text-yellow-400 text-lg font-bold">🏆 Primeira resposta correta!</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants Scores */}
      {gameState.participants.length > 0 && (
        <Card className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Placar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gameState.participants
                .sort((a, b) => b.score - a.score)
                .map((participant, index) => (
                <div key={participant.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
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
      )}

      {/* Status Indicator */}
      <div className="fixed top-4 right-4">
        <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
      </div>
    </div>
  )
}