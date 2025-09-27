'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSocket, useAdminSocket } from '@/hooks/useSocket'
import { BarChart3, Users, Clock, Trophy } from 'lucide-react'
import Link from 'next/link'

interface Participant {
  id: string
  name: string
  city: string
  state: string
  photo_url: string | null
  status: string
  created_at: string
  updated_at: string
}

export default function AdminDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  const { socket, isConnected: mainConnected } = useSocket()
  const { socket: adminSocket, isConnected: adminConnected } = useAdminSocket()

  // Buscar participantes da API
  const fetchParticipants = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/participants')
      const data = await response.json()
      
      if (data.success) {
        setParticipants(data.data)
      } else {
        setError('Erro ao carregar participantes')
      }
    } catch (err) {
      setError('Erro de conexão')
      console.error('Erro ao buscar participantes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar participantes ao montar o componente
  useEffect(() => {
    fetchParticipants()
  }, [])

  // Atualizar participantes via Socket.IO
  useEffect(() => {
    if (socket) {
      socket.on('participant_added', () => {
        console.log('Novo participante adicionado, atualizando lista...')
        fetchParticipants()
      })
    }

    if (adminSocket) {
      adminSocket.on('participant_updated', () => {
        console.log('Participante atualizado, atualizando lista...')
        fetchParticipants()
      })

      // Listen for game events
      adminSocket.on('admin:message', (data) => {
        console.log('📢 Admin message:', data)
        if (data.type === 'success') {
          alert(`✅ ${data.message}`)
        } else if (data.type === 'error') {
          alert(`❌ ${data.message}`)
        }
      })

      adminSocket.on('game:started', (data) => {
        console.log('🎮 Game started:', data)
        alert(`🎮 Jogo iniciado! ID: ${data.gameId}`)
      })

      adminSocket.on('game:ended', (data) => {
        console.log('🏆 Game ended:', data)
        alert(`🏆 Jogo finalizado! Vencedor: ${data.winner?.name || 'Nenhum'}`)
      })
    }

    return () => {
      if (socket) {
        socket.off('participant_added')
      }
      if (adminSocket) {
        adminSocket.off('participant_updated')
        adminSocket.off('admin:message')
        adminSocket.off('game:started')
        adminSocket.off('game:ended')
      }
    }
  }, [socket, adminSocket])

  // Selecionar/deselecionar participante
  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(participantId)) {
        return prev.filter(id => id !== participantId)
      } else if (prev.length < 3) {
        return [...prev, participantId]
      }
      return prev
    })
  }

  // Remover participante
  const removeParticipant = async (participantId: string) => {
    if (!confirm('Tem certeza que deseja remover este participante?')) {
      return
    }

    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        setParticipants(prev => prev.filter(p => p.id !== participantId))
        setSelectedParticipants(prev => prev.filter(id => id !== participantId))
      } else {
        alert('Erro ao remover participante: ' + data.error)
      }
    } catch (err) {
      alert('Erro de conexão')
      console.error('Erro ao remover participante:', err)
    }
  }

  // Controles do Timer
  const startTimer = () => {
    if (adminSocket?.connected) {
      adminSocket.emit('admin:timer:start')
      console.log('Admin: Enviado comando para iniciar cronômetro')
    }
  }

  const stopTimer = () => {
    if (adminSocket?.connected) {
      adminSocket.emit('admin:timer:stop')
      console.log('Admin: Enviado comando para parar cronômetro')
    }
  }

  const resetTimer = () => {
    if (adminSocket?.connected) {
      adminSocket.emit('admin:timer:reset')
      console.log('Admin: Enviado comando para resetar cronômetro')
    }
  }

  // Iniciar partida
  const startGame = () => {
    if (selectedParticipants.length !== 3) {
      alert('Selecione exatamente 3 participantes para iniciar a partida')
      return
    }

    const selectedNames = participants
      .filter(p => selectedParticipants.includes(p.id))
      .map(p => p.name)
      .join(', ')

    if (confirm(`Iniciar partida com: ${selectedNames}?`)) {
      if (adminSocket?.connected) {
        adminSocket.emit('admin:game:start', { 
          participantIds: selectedParticipants 
        })
        console.log('🎮 Enviado comando para iniciar jogo com participantes:', selectedParticipants)
      } else {
        alert('Conexão com servidor não disponível')
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎮 Dashboard Administrativo</h1>
              <p className="text-gray-400">Gerencie a fila de participantes e inicie partidas</p>
            </div>
            <Link href="/admin/analytics">
              <Button variant="outline" className="flex items-center gap-2 bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
          </div>
          
          {/* Status de Conexão */}
          <div className="flex gap-4 mt-4">
            <Badge variant={mainConnected ? "default" : "destructive"}>
              Socket.IO: {mainConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
            <Badge variant={adminConnected ? "default" : "destructive"}>
              Admin: {adminConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-400">{participants.length}</div>
              <p className="text-gray-400">Total de Participantes</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-400">{selectedParticipants.length}</div>
              <p className="text-gray-400">Selecionados para Jogo</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-400">
                {participants.filter(p => p.status === 'waiting').length}
              </div>
              <p className="text-gray-400">Aguardando na Fila</p>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={fetchParticipants}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            🔄 Atualizar Lista
          </Button>
          
          <Button 
            onClick={startGame}
            disabled={selectedParticipants.length !== 3}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
          >
            🚀 Iniciar Partida ({selectedParticipants.length}/3)
          </Button>
        </div>

        {/* Controles do Timer */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-xl">⏰ Controles do Cronômetro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={startTimer}
                disabled={!adminConnected}
              >
                ▶️ Iniciar Cronômetro
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={stopTimer}
                disabled={!adminConnected}
              >
                ⏹️ Parar Cronômetro
              </Button>
              <Button
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={resetTimer}
                disabled={!adminConnected}
              >
                🔄 Resetar Cronômetro
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Use estes controles para testar o cronômetro sincronizado nos jogadores
            </p>
          </CardContent>
        </Card>

        {/* Lista de Participantes */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>👥 Lista de Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                <p className="mt-2 text-gray-400">Carregando participantes...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">
                <p>{error}</p>
                <Button onClick={fetchParticipants} className="mt-4">
                  Tentar Novamente
                </Button>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Nenhum participante na fila</p>
                <p className="text-sm mt-2">Os participantes aparecerão aqui quando se cadastrarem</p>
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedParticipants.includes(participant.id)
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-600 bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedParticipants.includes(participant.id)}
                          onChange={() => toggleParticipant(participant.id)}
                          disabled={!selectedParticipants.includes(participant.id) && selectedParticipants.length >= 3}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                          {participant.photo_url ? (
                            <img 
                              src={participant.photo_url} 
                              alt={participant.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">👤</span>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg">{participant.name}</h3>
                          <p className="text-gray-400">
                            {participant.city}, {participant.state}
                          </p>
                          <p className="text-sm text-gray-500">
                            Cadastrado em: {new Date(participant.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant={participant.status === 'waiting' ? 'default' : 'secondary'}>
                          {participant.status === 'waiting' ? 'Aguardando' : participant.status}
                        </Badge>
                        
                        <Button
                          onClick={() => removeParticipant(participant.id)}
                          variant="destructive"
                          size="sm"
                        >
                          🗑️ Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}