'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSocket } from '@/hooks/useSocket'
import { Users, UserPlus, Trash2, Edit, ArrowLeft } from 'lucide-react'
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

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  const { socket, isConnected } = useSocket()

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

  useEffect(() => {
    fetchParticipants()

    if (socket) {
      socket.on('participant_added', (newParticipant: Participant) => {
        setParticipants(prev => [...prev, newParticipant])
      })
    }

    return () => {
      if (socket) {
        socket.off('participant_added')
      }
    }
  }, [socket])

  const removeParticipant = async (participantId: string) => {
    if (!confirm('Tem certeza que deseja remover este participante?')) return
    
    try {
      const response = await fetch(`/api/participants/${participantId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        setParticipants(prev => prev.filter(p => p.id !== participantId))
      } else {
        setError(data.error || 'Erro ao remover participante')
      }
    } catch (err) {
      setError('Erro de conexão ao remover participante')
      console.error('Erro ao remover participante:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando participantes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar participantes</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button onClick={fetchParticipants} className="bg-blue-600 hover:bg-blue-700">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Admin</span>
            </Link>
            <div className="h-6 w-px bg-gray-600"></div>
            <h1 className="text-xl font-semibold">👥 Gerenciar Participantes</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-300">Socket.IO</span>
          </div>
        </div>
      </header>

      {/* Navegação */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex space-x-6">
          <Link href="/cadastro" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Novo Cadastro</span>
          </Link>
          <Link href="/admin" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="container mx-auto p-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{participants.length}</div>
              <p className="text-xs text-gray-400">Participantes cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Aguardando</CardTitle>
              <Users className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {participants.filter(p => p.status === 'waiting').length}
              </div>
              <p className="text-xs text-gray-400">Prontos para jogar</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Jogando</CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {participants.filter(p => p.status === 'playing').length}
              </div>
              <p className="text-xs text-gray-400">Em partida ativa</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Participantes */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Lista de Participantes</CardTitle>
            <p className="text-gray-400">Gerencie todos os participantes cadastrados</p>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum participante cadastrado ainda.</p>
                <Link href="/cadastro" className="inline-block mt-4 text-blue-400 hover:text-blue-300">
                  Ir para Cadastro →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map(participant => (
                  <div
                    key={participant.id}
                    className="bg-gray-700 border border-gray-600 p-4 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
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
                        <h3 className="font-semibold text-lg text-white">{participant.name}</h3>
                        <p className="text-gray-400">
                          {participant.city}, {participant.state}
                        </p>
                        <p className="text-sm text-gray-500">
                          Cadastrado em: {new Date(participant.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={participant.status === 'waiting' ? 'default' : 'secondary'}
                        className={participant.status === 'waiting' ? 'bg-green-600' : 'bg-gray-600'}
                      >
                        {participant.status === 'waiting' ? 'Aguardando' : participant.status}
                      </Badge>
                      
                      <Button
                        onClick={() => removeParticipant(participant.id)}
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
