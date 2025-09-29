'use client'

import { useState, useEffect } from 'react'
import { getSocket } from '@/lib/socket'

export default function TestJogador1() {
  const [socket, setSocket] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [gameState, setGameState] = useState<any>(null)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const playerSocket = getSocket()
    setSocket(playerSocket)

    // Connection events
    playerSocket?.on('connect', () => {
      console.log('✅ Jogador 1 connected to socket server')
      setConnected(true)
      addMessage('✅ Conectado ao servidor')
      
      // Register as player
      playerSocket.emit('player:register', {
        playerId: 'cmg34k9wp0005yiuj6qpcg8hm', // Eduardo Lima ID
        playerName: 'Eduardo Lima'
      })
      addMessage('👤 Registrando como Eduardo Lima...')
    })

    playerSocket?.on('disconnect', (reason) => {
      console.log('❌ Jogador 1 disconnected:', reason)
      setConnected(false)
      setRegistered(false)
      addMessage('❌ Desconectado: ' + reason)
    })

    // Game state events
    playerSocket?.on('game:state', (state) => {
      console.log('🎮 Game state received:', state)
      setGameState(state)
      addMessage(`🎮 Estado do jogo: ${state.status}`)
    })

    // Registration confirmation
    playerSocket?.on('player:registered', (data) => {
      console.log('✅ Player registration confirmed:', data)
      setRegistered(true)
      addMessage('✅ Registro confirmado!')
    })

    // Answer result events
    playerSocket?.on('answer:result', (result) => {
      console.log('📝 Answer result:', result)
      addMessage(`📝 Resposta: ${result.correct ? 'Correta' : 'Incorreta'} (+${result.points} pontos)`)
    })

    return () => {
      playerSocket?.off('connect')
      playerSocket?.off('disconnect')
      playerSocket?.off('game:state')
      playerSocket?.off('player:registered')
      playerSocket?.off('answer:result')
    }
  }, [])

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const sendAnswer = (answer: string) => {
    if (socket && gameState?.currentQuestion) {
      socket.emit('player:answer', {
        gameId: gameState.id,
        questionId: gameState.currentQuestion.id,
        answer: answer,
        participantId: 'cmg34k9wp0005yiuj6qpcg8hm',
        participantName: 'Eduardo Lima',
        responseTime: Date.now()
      })
      addMessage(`📤 Enviando resposta: ${answer}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🎮 Teste Jogador 1 - Eduardo Lima</h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-lg ${connected ? 'bg-green-600' : 'bg-red-600'}`}>
            <h3 className="font-bold">Conexão Socket</h3>
            <p>{connected ? '✅ Conectado' : '❌ Desconectado'}</p>
          </div>
          
          <div className={`p-4 rounded-lg ${registered ? 'bg-green-600' : 'bg-yellow-600'}`}>
            <h3 className="font-bold">Registro</h3>
            <p>{registered ? '✅ Registrado' : '⏳ Aguardando'}</p>
          </div>
          
          <div className={`p-4 rounded-lg ${gameState?.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}`}>
            <h3 className="font-bold">Jogo</h3>
            <p>{gameState?.status || 'Aguardando'}</p>
          </div>
        </div>

        {/* Game State */}
        {gameState && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Estado do Jogo</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Status:</strong> {gameState.status}</p>
                <p><strong>Rodada:</strong> {gameState.currentRound}/{gameState.totalRounds}</p>
                <p><strong>Jogadores Conectados:</strong> {gameState.controls?.connectedPlayers}/{gameState.controls?.totalPlayers}</p>
              </div>
              <div>
                <p><strong>ID do Jogo:</strong> {gameState.id || 'N/A'}</p>
                <p><strong>Iniciado em:</strong> {gameState.startTime ? new Date(gameState.startTime).toLocaleTimeString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Question */}
        {gameState?.currentQuestion && (
          <div className="bg-blue-900 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Pergunta Atual</h2>
            <p className="text-lg mb-4">{gameState.currentQuestion.text}</p>
            <div className="grid grid-cols-2 gap-2">
              {gameState.currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => sendAnswer(String.fromCharCode(65 + index))}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left"
                >
                  {String.fromCharCode(65 + index)}) {option}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Tempo restante: {gameState.currentQuestion.timeLeft}s
            </p>
          </div>
        )}

        {/* Player Scores */}
        {gameState?.participants && gameState.participants.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Pontuação dos Jogadores</h2>
            <div className="space-y-2">
              {gameState.participants
                .sort((a, b) => b.points - a.points)
                .map((participant, index) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400">#{index + 1}</span>
                      <span className="font-medium">{participant.name}</span>
                      <span className={`w-2 h-2 rounded-full ${participant.connected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    </div>
                    <span className="font-bold">{participant.points} pts</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Messages Log */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Log de Mensagens</h2>
          <div className="h-64 overflow-y-auto space-y-1">
            {messages.map((message, index) => (
              <div key={index} className="text-sm text-gray-300 font-mono">
                {message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
