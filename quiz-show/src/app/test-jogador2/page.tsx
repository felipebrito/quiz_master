'use client'

import { useState, useEffect } from 'react'
import { getSocket } from '@/lib/socket'

export default function TestJogador2() {
  const [socket, setSocket] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const playerSocket = getSocket()
    setSocket(playerSocket)

    // Connection events
    playerSocket?.on('connect', () => {
      console.log('✅ Jogador 2 connected to socket server')
      setConnected(true)
      addMessage('✅ Conectado ao servidor')
      
      // Register as player
      playerSocket.emit('player:register', {
        playerId: 'cmg34k9wo0003yiujpva13w5t', // Bruno Costa ID
        playerName: 'Bruno Costa'
      })
      addMessage('👤 Registrando como Bruno Costa...')
    })

    playerSocket?.on('disconnect', (reason) => {
      console.log('❌ Jogador 2 disconnected:', reason)
      setConnected(false)
      setRegistered(false)
      addMessage('❌ Desconectado: ' + reason)
    })

    // Registration confirmation
    playerSocket?.on('player:registered', (data) => {
      console.log('✅ Player registration confirmed:', data)
      setRegistered(true)
      addMessage('✅ Registro confirmado!')
    })

    // Game state events
    playerSocket?.on('game:state', (state) => {
      console.log('🎮 Game state received:', state)
      addMessage(`🎮 Estado do jogo: ${state.status}`)
    })

    return () => {
      playerSocket?.off('connect')
      playerSocket?.off('disconnect')
      playerSocket?.off('player:registered')
      playerSocket?.off('game:state')
    }
  }, [])

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🎮 Teste Jogador 2 - Bruno Costa</h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className={`p-4 rounded-lg ${connected ? 'bg-green-600' : 'bg-red-600'}`}>
            <h3 className="font-bold">Conexão Socket</h3>
            <p>{connected ? '✅ Conectado' : '❌ Desconectado'}</p>
          </div>
          
          <div className={`p-4 rounded-lg ${registered ? 'bg-green-600' : 'bg-yellow-600'}`}>
            <h3 className="font-bold">Registro</h3>
            <p>{registered ? '✅ Registrado' : '⏳ Aguardando'}</p>
          </div>
        </div>

        {/* Messages Log */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Log de Conexão</h2>
          <div className="h-64 overflow-y-auto space-y-1">
            {messages.map((message, index) => (
              <div key={index} className="text-sm text-gray-300 font-mono">
                {message}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center text-gray-400 text-sm">
          Esta página simula o Jogador 2 conectando ao jogo.<br/>
          Feche esta aba para simular desconexão.
        </div>
      </div>
    </div>
  )
}
