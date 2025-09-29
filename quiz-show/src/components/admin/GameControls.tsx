'use client'

import { useState, useEffect } from 'react'
import { getAdminSocket } from '@/lib/socket'

interface GameState {
  id: string | null
  status: 'waiting' | 'starting' | 'active' | 'paused' | 'finished' | 'stopped'
  currentRound: number
  totalRounds: number
  participants: Array<{
    id: string
    name: string
    connected: boolean
    points: number
  }>
  currentQuestion?: {
    id: string
    text: string
    options: string[]
    correctAnswer: string
    timeLeft: number
  }
  startTime?: Date
  endTime?: Date
}

interface GameControls {
  canStart: boolean
  canPause: boolean
  canResume: boolean
  canStop: boolean
  canNextRound: boolean
  connectedPlayers: number
  totalPlayers: number
}

interface GameControlsProps {
  onGameStateChange?: (state: GameState) => void
}

export default function GameControls({ onGameStateChange }: GameControlsProps) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [controls, setControls] = useState<GameControls>({
    canStart: false,
    canPause: false,
    canResume: false,
    canStop: false,
    canNextRound: false,
    connectedPlayers: 0,
    totalPlayers: 0
  })
  const [socket, setSocket] = useState<any>(null)

  useEffect(() => {
    const adminSocket = getAdminSocket()
    setSocket(adminSocket)

    // Listen for game state updates
    adminSocket?.on('game:state', (data: any) => {
      console.log('🎮 Game state received:', data)
      setGameState(data)
      setControls(data.controls || {})
      onGameStateChange?.(data)
    })

    // Listen for admin messages
    adminSocket?.on('admin:message', (data: any) => {
      console.log('📨 Admin message received:', data)
      if (data.type === 'success') {
        // Success message handled by parent
      } else if (data.type === 'warning') {
        alert('⚠️ ' + data.message)
      } else if (data.type === 'error') {
        alert('❌ ' + data.message)
      }
    })

    return () => {
      adminSocket?.off('game:state')
      adminSocket?.off('admin:message')
    }
  }, [onGameStateChange])

  const handlePause = () => {
    if (socket && controls.canPause) {
      socket.emit('admin:game:pause')
    }
  }

  const handleResume = () => {
    if (socket && controls.canResume) {
      socket.emit('admin:game:resume')
    }
  }

  const handleStop = () => {
    if (socket && controls.canStop) {
      if (confirm('Tem certeza que deseja parar o jogo?')) {
        socket.emit('admin:game:stop')
      }
    }
  }

  const handleNextRound = () => {
    if (socket && controls.canNextRound) {
      socket.emit('admin:game:next-round')
    }
  }

  if (!gameState) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Controles do Jogo</h3>
        <p className="text-gray-400">Aguardando inicialização do jogo...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">Controles do Jogo</h3>
      
      {/* Game Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            gameState.status === 'active' ? 'bg-green-600 text-white' :
            gameState.status === 'paused' ? 'bg-yellow-600 text-white' :
            gameState.status === 'waiting' ? 'bg-blue-600 text-white' :
            gameState.status === 'finished' ? 'bg-purple-600 text-white' :
            'bg-gray-600 text-white'
          }`}>
            {gameState.status === 'active' ? 'Ativo' :
             gameState.status === 'paused' ? 'Pausado' :
             gameState.status === 'waiting' ? 'Aguardando' :
             gameState.status === 'finished' ? 'Finalizado' :
             'Parado'}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-300">Rodada:</span>
          <span className="text-white font-medium">
            {gameState.currentRound} de {gameState.totalRounds}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Jogadores Conectados:</span>
          <span className={`font-medium ${
            controls.connectedPlayers === controls.totalPlayers ? 'text-green-400' : 'text-yellow-400'
          }`}>
            {controls.connectedPlayers}/{controls.totalPlayers}
          </span>
        </div>
      </div>

      {/* Current Question */}
      {gameState.currentQuestion && (
        <div className="mb-4 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-lg font-semibold text-white mb-2">Pergunta Atual:</h4>
          <p className="text-gray-300 mb-2">{gameState.currentQuestion.text}</p>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Tempo restante:</span>
            <span className="text-white font-mono">{gameState.currentQuestion.timeLeft}s</span>
          </div>
        </div>
      )}

      {/* Player Scores */}
      {gameState.participants.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white mb-2">Pontuação:</h4>
          <div className="space-y-2">
            {gameState.participants
              .sort((a, b) => b.points - a.points)
              .map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">#{index + 1}</span>
                    <span className="text-white">{participant.name}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      participant.connected ? 'bg-green-400' : 'bg-red-400'
                    }`}></span>
                  </div>
                  <span className="text-white font-medium">{participant.points} pts</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2">
        {controls.canPause && (
          <button
            onClick={handlePause}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
          >
            ⏸️ Pausar
          </button>
        )}
        
        {controls.canResume && (
          <button
            onClick={handleResume}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            ▶️ Retomar
          </button>
        )}
        
        {controls.canStop && (
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            ⏹️ Parar
          </button>
        )}
        
        {controls.canNextRound && (
          <button
            onClick={handleNextRound}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            ⏭️ Próxima Rodada
          </button>
        )}
      </div>

      {/* Connection Status */}
      {controls.connectedPlayers < controls.totalPlayers && (
        <div className="mt-4 p-3 bg-yellow-900 border border-yellow-600 rounded-lg">
          <p className="text-yellow-200 text-sm">
            ⚠️ Aguardando {controls.totalPlayers - controls.connectedPlayers} jogador(es) se conectar(em)
          </p>
        </div>
      )}
    </div>
  )
}
