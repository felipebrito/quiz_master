'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star,
  RefreshCw,
  Home,
  Users,
  Award
} from 'lucide-react'

interface RankingEntry {
  id: string
  name: string
  city: string
  state: string
  score: number
  photo_url: string | null
  updated_at: string
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRanking = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/ranking')
      const data = await response.json()
      
      if (data.success) {
        setRanking(data.data)
        setError('')
      } else {
        setError('Erro ao carregar ranking')
      }
    } catch (err) {
      setError('Erro de conexão')
      console.error('Erro ao buscar ranking:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRanking()
  }, [])

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Crown className="h-8 w-8 text-yellow-400" />
      case 1:
        return <Trophy className="h-8 w-8 text-gray-400" />
      case 2:
        return <Trophy className="h-8 w-8 text-orange-400" />
      default:
        return <Medal className="h-8 w-8 text-blue-400" />
    }
  }

  const getRankColor = (position: number) => {
    switch (position) {
      case 0:
        return 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/30'
      case 1:
        return 'from-gray-600/20 to-gray-800/20 border-gray-500/30'
      case 2:
        return 'from-orange-600/20 to-orange-800/20 border-orange-500/30'
      default:
        return 'from-blue-600/20 to-blue-800/20 border-blue-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full blur-3xl opacity-75"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-8">
                <Trophy className="h-24 w-24 text-yellow-400" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
            🏆 RANKING
          </h1>
          
          <p className="text-2xl md:text-3xl text-slate-300 mb-8">
            Top 10 Melhores Jogadores
          </p>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mb-8">
            <Link href="/">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            
            <Button 
              onClick={fetchRanking}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-white text-xl">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            Carregando ranking...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-400 text-xl mb-8">
            {error}
          </div>
        )}

        {/* Ranking List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {ranking.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    Nenhum jogador ainda
                  </h3>
                  <p className="text-slate-400">
                    O ranking aparecerá aqui após as primeiras partidas!
                  </p>
                </CardContent>
              </Card>
            ) : (
              ranking.map((participant, index) => (
                <Card 
                  key={participant.id} 
                  className={`bg-gradient-to-r ${getRankColor(index)} backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 ${
                    index === 0 ? 'ring-4 ring-yellow-400/50' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        {/* Position */}
                        <div className="flex items-center gap-3">
                          {getRankIcon(index)}
                          <div className="text-3xl font-bold text-white">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Photo */}
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                          {participant.photo_url ? (
                            <img 
                              src={participant.photo_url} 
                              alt={participant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="h-8 w-8 text-slate-400" />
                          )}
                        </div>

                        {/* Info */}
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-1">
                            {participant.name}
                          </h3>
                          <p className="text-slate-300 text-lg">
                            {participant.city}, {participant.state}
                          </p>
                          <p className="text-slate-400 text-sm">
                            Última partida: {new Date(participant.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-6 w-6 text-yellow-400" />
                          <span className="text-4xl font-bold text-yellow-400">
                            {participant.score}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                          pontos
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-4">
              <Award className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Quiz Show Interativo</h3>
          <p className="text-slate-400 mb-6">
            Sistema de ranking em tempo real
          </p>
        </div>
      </div>
    </div>
  )
}
