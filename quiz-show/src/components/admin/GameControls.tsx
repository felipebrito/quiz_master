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

      {/* Player Status & Scores */}
      {gameState.participants.length > 0 && (
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white mb-2">Status dos Jogadores:</h4>
          <div className="space-y-2">
            {gameState.participants
              .sort((a, b) => b.points - a.points)
              .map((participant, index) => (
                <div key={participant.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  participant.connected 
                    ? 'bg-green-900 border-green-600' 
                    : 'bg-red-900 border-red-600'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-mono">#{index + 1}</span>
                    {participant.connected ? (
                      <Wifi className="text-green-400" size={16} />
                    ) : (
                      <WifiOff className="text-red-400" size={16} />
                    )}
                    <span className="text-white font-medium">{participant.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      participant.connected 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {participant.connected ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{participant.points} pts</div>
                    <div className="text-xs text-gray-400">
                      {participant.connected ? 'Conectado' : 'Desconectado'}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          
          {/* Connection Summary */}
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Total de Jogadores:</span>
                <span className="text-white font-semibold">{gameState.controls.totalPlayers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Conectados:</span>
                <span className={`font-semibold ${
                  gameState.controls.connectedPlayers === gameState.controls.totalPlayers 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }`}>
                  {gameState.controls.connectedPlayers}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Status da Conexão:</span>
                <span className={`font-semibold ${
                  gameState.controls.connectedPlayers === gameState.controls.totalPlayers 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {gameState.controls.connectedPlayers === gameState.controls.totalPlayers 
                    ? '✅ TODOS CONECTADOS' 
                    : '⏳ AGUARDANDO CONEXÕES'}
                </span>
              </div>
            </div>
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
