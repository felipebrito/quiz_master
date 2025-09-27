'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useSocket } from '@/hooks/useSocket'
import { Settings, ArrowLeft, Save, RotateCcw, Trash2, Bell, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    gameDuration: 30,
    questionTime: 15,
    maxParticipants: 3,
    enableNotifications: true,
    autoStart: false,
    soundEnabled: true
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  
  const { socket, isConnected } = useSocket()

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // Simular salvamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('Configurações salvas com sucesso!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Erro ao salvar configurações')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const resetSettings = () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
      setSettings({
        gameDuration: 30,
        questionTime: 15,
        maxParticipants: 3,
        enableNotifications: true,
        autoStart: false,
        soundEnabled: true
      })
      setMessage('Configurações resetadas!')
      setTimeout(() => setMessage(''), 3000)
    }
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
            <h1 className="text-xl font-semibold">⚙️ Configurações</h1>
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
            <Settings className="h-4 w-4" />
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
            <h2 className="text-2xl font-bold text-white">Configurações do Sistema</h2>
            <p className="text-gray-400">Personalize o comportamento do quiz show</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={resetSettings} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
            <Button onClick={saveSettings} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('sucesso') ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
            <p className={message.includes('sucesso') ? 'text-green-200' : 'text-red-200'}>{message}</p>
          </div>
        )}

        {/* Configurações do Jogo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Configurações de Tempo</span>
              </CardTitle>
              <p className="text-gray-400">Defina os tempos do jogo</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="gameDuration" className="text-gray-300">Duração do Jogo (minutos)</Label>
                <Input
                  id="gameDuration"
                  type="number"
                  value={settings.gameDuration}
                  onChange={(e) => handleSettingChange('gameDuration', parseInt(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  min="5"
                  max="120"
                />
              </div>
              <div>
                <Label htmlFor="questionTime" className="text-gray-300">Tempo por Pergunta (segundos)</Label>
                <Input
                  id="questionTime"
                  type="number"
                  value={settings.questionTime}
                  onChange={(e) => handleSettingChange('questionTime', parseInt(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  min="5"
                  max="60"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Configurações de Participantes</span>
              </CardTitle>
              <p className="text-gray-400">Defina limites e comportamentos</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="maxParticipants" className="text-gray-300">Máximo de Participantes</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={settings.maxParticipants}
                  onChange={(e) => handleSettingChange('maxParticipants', parseInt(e.target.value))}
                  className="bg-gray-700 border-gray-600 text-white"
                  min="2"
                  max="6"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Início Automático</Label>
                  <p className="text-sm text-gray-400">Iniciar jogo automaticamente quando houver participantes suficientes</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoStart}
                  onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configurações de Notificações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notificações</span>
              </CardTitle>
              <p className="text-gray-400">Configure alertas e notificações</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Notificações Ativadas</Label>
                  <p className="text-sm text-gray-400">Receber alertas sobre eventos do jogo</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Sons Ativados</Label>
                  <p className="text-sm text-gray-400">Reproduzir sons durante o jogo</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Trash2 className="h-5 w-5" />
                <span>Manutenção</span>
              </CardTitle>
              <p className="text-gray-400">Ferramentas de manutenção do sistema</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Dados Antigos
              </Button>
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar Sistema
              </Button>
              <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                <Settings className="h-4 w-4 mr-2" />
                Verificar Integridade
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status do Sistema */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Status do Sistema</CardTitle>
            <p className="text-gray-400">Informações sobre o estado atual do sistema</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Socket.IO</span>
                <Badge className={isConnected ? 'bg-green-600' : 'bg-red-600'}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Banco de Dados</span>
                <Badge className="bg-green-600">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Sistema</span>
                <Badge className="bg-green-600">Funcionando</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
