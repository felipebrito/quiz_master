'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSocket } from '@/lib/socket'

export default function Jogador1Page() {
  const [isConnected, setIsConnected] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [isRunning, setIsRunning] = useState(false)
  const [players, setPlayers] = useState<any[]>([])
  const [socket, setSocket] = useState<any>(null)

  useEffect(() => {
    const socketInstance = getSocket()
    setSocket(socketInstance)

    if (socketInstance) {
      // Connection events
      socketInstance.on('connect', () => {
        console.log('🔌 Jogador 1 conectado')
        setIsConnected(true)
        
        // Register player
        socketInstance.emit('player:register', {
          playerId: 'jogador1',
          playerName: 'Jogador 1'
        })
      })

      socketInstance.on('disconnect', () => {
        console.log('🔌 Jogador 1 desconectado')
        setIsConnected(false)
      })

      // Timer events
      socketInstance.on('timer:update', (data: any) => {
        setTimeRemaining(data.timeRemaining)
        setIsRunning(data.isRunning)
      })

      socketInstance.on('timer:end', (data: any) => {
        setTimeRemaining(0)
        setIsRunning(false)
      })

      socketInstance.on('timer:reset', (data: any) => {
        setTimeRemaining(data.timeRemaining)
        setIsRunning(data.isRunning)
      })

      // Players list
      socketInstance.on('players:update', (playersList: any[]) => {
        setPlayers(playersList)
      })

      socketInstance.on('timer:state', (data: any) => {
        setTimeRemaining(data.timeRemaining)
        setIsRunning(data.isRunning)
      })
    }

    return () => {
      if (socketInstance) {
        socketInstance.off('connect')
        socketInstance.off('disconnect')
        socketInstance.off('timer:update')
        socketInstance.off('timer:end')
        socketInstance.off('timer:reset')
        socketInstance.off('players:update')
        socketInstance.off('timer:state')
      }
    }
  }, [])

  const handleStartTimer = () => {
    if (socket) {
      socket.emit('timer:start')
    }
  }

  const handleStopTimer = () => {
    if (socket) {
      socket.emit('timer:stop')
    }
  }

  const handleResetTimer = () => {
    if (socket) {
      socket.emit('timer:reset')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          🎮 Jogador 1 - Teste Socket.IO
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connection Status */}
          <Card className="bg-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                Status da Conexão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {isConnected ? '✅ Conectado ao Socket.IO' : '❌ Desconectado'}
              </p>
            </CardContent>
          </Card>

          {/* Timer */}
          <Card className="bg-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>⏰ Cronômetro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold mb-4">
                  {timeRemaining}
                </div>
                <div className="text-lg mb-4">
                  {isRunning ? '🟢 Rodando' : '🔴 Parado'}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleStartTimer} disabled={isRunning}>
                    ▶️ Iniciar
                  </Button>
                  <Button onClick={handleStopTimer} disabled={!isRunning}>
                    ⏹️ Parar
                  </Button>
                  <Button onClick={handleResetTimer} variant="outline">
                    🔄 Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="bg-white/10 backdrop-blur-sm md:col-span-2">
            <CardHeader>
              <CardTitle>👥 Jogadores Conectados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {players.map((player, index) => (
                  <div key={index} className="bg-white/20 rounded-lg p-4 text-center">
                    <div className="text-lg font-semibold">{player.playerName}</div>
                    <div className="text-sm text-gray-300">ID: {player.playerId}</div>
                  </div>
                ))}
              </div>
              {players.length === 0 && (
                <p className="text-center text-gray-400">Nenhum jogador conectado</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-300">
            Abra <a href="/jogador2" className="text-blue-400 hover:underline">Jogador 2</a> e <a href="/jogador3" className="text-blue-400 hover:underline">Jogador 3</a> em outras abas para testar a sincronização
          </p>
        </div>
      </div>
    </main>
  )
}
