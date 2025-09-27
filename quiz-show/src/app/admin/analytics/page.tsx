'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, Trophy, Clock, TrendingUp, BarChart3, Download } from 'lucide-react'
import { DatePickerWithRange } from '@/components/admin/DatePickerWithRange'
import { AnalyticsChart } from '@/components/admin/AnalyticsChart'
import { MetricsTable } from '@/components/admin/MetricsTable'

interface DashboardMetrics {
  totalGames: number
  uniqueParticipants: number
  averageParticipationRate: number
  averageGameDuration: number
  totalRevenue: number
  completionRate: number
  averageResponseTime: number
  topParticipants: Array<{
    id: string
    name: string
    gamesPlayed: number
    averageScore: number
    photo_url: string
  }>
}

interface ChartData {
  gamesOverTime: Array<{
    date: string
    games: number
    participants: number
  }>
  participationTrend: Array<{
    date: string
    rate: number
  }>
  responseTimeDistribution: Array<{
    range: string
    count: number
  }>
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`)
      const data = await response.json()
      
      setMetrics(data.metrics)
      setChartData(data.chartData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'excel' | 'json') => {
    try {
      const response = await fetch(`/api/admin/analytics/export?format=${format}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${format}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
              <p className="text-gray-600 mt-2">Visão geral das métricas e performance do Quiz Show</p>
            </div>
            <div className="flex items-center gap-4">
              <DatePickerWithRange 
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportReport('pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportReport('excel')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportReport('json')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Partidas</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalGames || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participantes Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.uniqueParticipants || 0}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8%</span> vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Participação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.averageParticipationRate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2.1%</span> vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.averageGameDuration || 0}min</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">-5%</span> vs período anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Taxa de Conclusão</CardTitle>
              <CardDescription>Partidas iniciadas vs finalizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {metrics?.completionRate?.toFixed(1) || 0}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${metrics?.completionRate || 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tempo Médio de Resposta</CardTitle>
              <CardDescription>Por pergunta em segundos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {metrics?.averageResponseTime?.toFixed(1) || 0}s
              </div>
              <Badge variant="secondary" className="mt-2">
                <BarChart3 className="h-3 w-3 mr-1" />
                Performance
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receita Total</CardTitle>
              <CardDescription>Período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                R$ {metrics?.totalRevenue?.toLocaleString('pt-BR') || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                +15% vs período anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Partidas e Participantes</CardTitle>
              <CardDescription>Comparação temporal dos dados principais</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsChart 
                data={chartData?.gamesOverTime || []}
                type="line"
                height={300}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Tempo de Resposta</CardTitle>
              <CardDescription>Análise de performance dos participantes</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsChart 
                data={chartData?.responseTimeDistribution || []}
                type="bar"
                height={300}
              />
            </CardContent>
          </Card>
        </div>

        {/* Top Participants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Participantes</CardTitle>
            <CardDescription>Ranking dos participantes mais ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricsTable 
              data={metrics?.topParticipants || []}
              columns={[
                { key: 'name', label: 'Nome' },
                { key: 'gamesPlayed', label: 'Partidas' },
                { key: 'averageScore', label: 'Pontuação Média' }
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
