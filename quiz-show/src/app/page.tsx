'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getSocket } from '@/lib/socket'
import Link from 'next/link'
import { 
  Zap, 
  Users, 
  Gamepad2, 
  Settings, 
  Trophy, 
  Play, 
  Clock, 
  Star,
  Target,
  Award,
  Sparkles,
  ChevronRight
} from 'lucide-react'

export default function Home() {
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    const socketInstance = getSocket()
    setSocket(socketInstance)

    if (socketInstance) {
      socketInstance.on('connect', () => {
        console.log('🔌 Conectado ao servidor')
        setIsConnected(true)
      })

      socketInstance.on('disconnect', () => {
        console.log('🔌 Desconectado do servidor')
        setIsConnected(false)
      })

      // Escutar atualizações de participantes
      socketInstance.on('participants:updated', (data: any) => {
        setParticipantCount(data.count || 0)
      })
    }

    // Buscar contagem inicial de participantes
    fetchParticipantCount()

    return () => {
      if (socketInstance) {
        socketInstance.off('connect')
        socketInstance.off('disconnect')
        socketInstance.off('participants:updated')
      }
    }
  }, [])

  const fetchParticipantCount = async () => {
    try {
      const response = await fetch('/api/participants')
      const data = await response.json()
      setParticipantCount(data.length || 0)
    } catch (error) {
      console.error('Erro ao buscar participantes:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
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
            
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Sistema de quiz em tempo real com tecnologia Socket.IO. 
              Cadastre participantes, inicie partidas e acompanhe a pontuação ao vivo!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/cadastro">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-4">
                  <Users className="mr-2 h-6 w-6" />
                  Cadastrar Participantes
                </Button>
              </Link>
              <Link href="/admin">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4">
                  <Settings className="mr-2 h-6 w-6" />
                  Painel Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Status do Servidor</h3>
              <p className="text-slate-300">
                {isConnected ? 'Conectado e Funcionando' : 'Desconectado'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Participantes</h3>
              <p className="text-3xl font-bold text-blue-400">{participantCount}</p>
              <p className="text-slate-300 text-sm">Cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <Target className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Perguntas</h3>
              <p className="text-3xl font-bold text-green-400">24</p>
              <p className="text-slate-300 text-sm">Disponíveis</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Funcionalidades</h2>
          <p className="text-xl text-slate-300">Tudo que você precisa para um quiz show profissional</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-600/20 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Cadastro de Participantes</h3>
              </div>
              <p className="text-slate-300">
                Cadastre participantes com fotos via webcam ou upload. Sistema simples e intuitivo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600/20 p-3 rounded-lg">
                  <Zap className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Tempo Real</h3>
              </div>
              <p className="text-slate-300">
                Comunicação instantânea com Socket.IO. Cronômetro sincronizado e pontuação ao vivo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-600/20 p-3 rounded-lg">
                  <Trophy className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Sistema de Pontuação</h3>
              </div>
              <p className="text-slate-300">
                Pontuação automática, ranking em tempo real e resultado final com classificação.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-orange-600/20 p-3 rounded-lg">
                  <Gamepad2 className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Interface de Jogadores</h3>
              </div>
              <p className="text-slate-300">
                Interface dedicada para cada jogador com visualização clara das perguntas e respostas.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-600/20 p-3 rounded-lg">
                  <Settings className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Painel Administrativo</h3>
              </div>
              <p className="text-slate-300">
                Controle total do jogo: iniciar partidas, gerenciar participantes e acompanhar progresso.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-600/20 p-3 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Perguntas Aleatórias</h3>
              </div>
              <p className="text-slate-300">
                Banco de 24 perguntas com seleção aleatória. Cada partida é única e desafiadora.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-600/20 p-3 rounded-lg">
                  <Trophy className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Tela Pública</h3>
              </div>
              <p className="text-slate-300">
                Exibição em tempo real do jogo para a plateia. Ranking e celebração do vencedor.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Acesso Rápido</h2>
          <p className="text-xl text-slate-300">Comece a usar o sistema agora mesmo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/cadastro">
            <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30 hover:from-orange-600/30 hover:to-red-600/30 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-orange-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Cadastro</h3>
                <p className="text-slate-300 text-sm">Registrar participantes</p>
                <ChevronRight className="h-4 w-4 text-orange-400 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin">
            <Card className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-500/30 hover:from-red-600/30 hover:to-pink-600/30 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-red-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Admin</h3>
                <p className="text-slate-300 text-sm">Painel de controle</p>
                <ChevronRight className="h-4 w-4 text-red-400 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/jogador1">
            <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 hover:from-blue-600/30 hover:to-cyan-600/30 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Gamepad2 className="h-12 w-12 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Jogador 1</h3>
                <p className="text-slate-300 text-sm">Interface do jogador</p>
                <ChevronRight className="h-4 w-4 text-blue-400 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/jogador2">
            <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 hover:from-green-600/30 hover:to-emerald-600/30 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Gamepad2 className="h-12 w-12 text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Jogador 2</h3>
                <p className="text-slate-300 text-sm">Interface do jogador</p>
                <ChevronRight className="h-4 w-4 text-green-400 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/display">
            <Card className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border-purple-500/30 hover:from-purple-600/30 hover:to-violet-600/30 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Tela Pública</h3>
                <p className="text-slate-300 text-sm">Exibição do jogo</p>
                <ChevronRight className="h-4 w-4 text-purple-400 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/ranking">
            <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30 hover:from-yellow-600/30 hover:to-orange-600/30 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Ranking</h3>
                <p className="text-slate-300 text-sm">Top 10 jogadores</p>
                <ChevronRight className="h-4 w-4 text-yellow-400 mx-auto mt-2 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Quiz Show Interativo</h3>
            <p className="text-slate-400 mb-6">
              Sistema profissional de quiz em tempo real
            </p>
            <div className="flex justify-center space-x-6 text-sm text-slate-500">
              <span>Socket.IO</span>
              <span>•</span>
              <span>Next.js 14</span>
              <span>•</span>
              <span>TypeScript</span>
              <span>•</span>
              <span>Prisma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}