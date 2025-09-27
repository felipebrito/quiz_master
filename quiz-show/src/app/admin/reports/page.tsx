'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSocket } from '@/hooks/useSocket'
import { FileText, Download, ArrowLeft, BarChart3, Users, Trophy, Calendar } from 'lucide-react'
import Link from 'next/link'

interface ReportData {
  totalGames: number
  totalParticipants: number
  averageScore: number
  topParticipant: string
  gamesToday: number
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    totalGames: 0,
    totalParticipants: 0,
    averageScore: 0,
    topParticipant: 'N/A',
    gamesToday: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  const { socket, isConnected } = useSocket()

  const fetchReportData = async () => {
    try {
      setIsLoading(true)
      // Simular dados de relatório por enquanto
      setReportData({
        totalGames: 12,
        totalParticipants: 45,
        averageScore: 7.8,
        topParticipant: 'João Silva',
        gamesToday: 3
      })
    } catch (err) {
      setError('Erro ao carregar dados do relatório')
      console.error('Erro ao buscar dados:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [])

  const exportReport = () => {
    // Simular exportação de relatório
    const data = {
      ...reportData,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Admin'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-quiz-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar relatórios</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button onClick={fetchReportData} className="bg-blue-600 hover:bg-blue-700">
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
            <h1 className="text-xl font-semibold">📊 Relatórios</h1>
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
          <Link href="/admin" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/participants" className="text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Participantes</span>
          </Link>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="container mx-auto p-6">
        {/* Ações */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Relatórios do Sistema</h2>
            <p className="text-gray-400">Análise de performance e estatísticas</p>
          </div>
          <Button onClick={exportReport} className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exportar Relatório</span>
          </Button>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total de Jogos</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{reportData.totalGames}</div>
              <p className="text-xs text-gray-400">Partidas realizadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Participantes</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{reportData.totalParticipants}</div>
              <p className="text-xs text-gray-400">Cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Pontuação Média</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{reportData.averageScore}</div>
              <p className="text-xs text-gray-400">Por participante</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Campeão</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white truncate">{reportData.topParticipant}</div>
              <p className="text-xs text-gray-400">Maior pontuação</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{reportData.gamesToday}</div>
              <p className="text-xs text-gray-400">Jogos realizados</p>
            </CardContent>
          </Card>
        </div>

        {/* Relatórios Detalhados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Relatório de Performance</CardTitle>
              <p className="text-gray-400">Análise de desempenho dos participantes</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Taxa de Acerto</span>
                  <Badge className="bg-green-600">78%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Tempo Médio por Jogo</span>
                  <Badge className="bg-blue-600">12 min</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Participação Ativa</span>
                  <Badge className="bg-purple-600">85%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Relatório de Uso</CardTitle>
              <p className="text-gray-400">Estatísticas de utilização do sistema</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Picos de Uso</span>
                  <Badge className="bg-yellow-600">19h-21h</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Dias Mais Ativos</span>
                  <Badge className="bg-orange-600">Sáb/Dom</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Retenção</span>
                  <Badge className="bg-green-600">92%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
