'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSocket, useAdminSocket } from "@/hooks/useSocket"

export default function Home() {
  const { isConnected: mainConnected, ping: mainPing } = useSocket()
  const { isConnected: adminConnected, ping: adminPing } = useAdminSocket()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-6xl font-bold text-center mb-8 font-display">
          Quiz Show Interativo
        </h1>
        
        <div className="mb-8 space-y-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Teste shadcn/ui</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Este é um card do shadcn/ui funcionando!</p>
              <div className="flex gap-2">
                <Button>Botão Primário</Button>
                <Button variant="secondary">Botão Secundário</Button>
                <Button variant="outline">Botão Outline</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>🔌 Teste Socket.IO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Main Socket</h3>
                  <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${mainConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm text-muted-foreground">
                    {mainConnected ? 'Conectado' : 'Desconectado'}
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2" 
                    onClick={mainPing}
                    disabled={!mainConnected}
                  >
                    Ping
                  </Button>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Admin Socket</h3>
                  <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${adminConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm text-muted-foreground">
                    {adminConnected ? 'Conectado' : 'Desconectado'}
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2" 
                    onClick={adminPing}
                    disabled={!adminConnected}
                  >
                    Ping
                  </Button>
                </div>
              </div>
              
              <div className="text-center text-sm text-muted-foreground mb-4">
                Verifique o console do navegador para ver os logs de conexão
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold mb-4">🎮 Páginas do Sistema</h3>
                <div className="flex gap-4 justify-center flex-wrap">
                  <a href="/cadastro" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
                    📝 Cadastro
                  </a>
                  <a href="/jogador1" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Jogador 1
                  </a>
                  <a href="/jogador2" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Jogador 2
                  </a>
                  <a href="/jogador3" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Jogador 3
                  </a>
                  <a href="/admin" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Admin
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-8 space-y-6">
          <div className="test-visible">
            <h2>Teste de Visibilidade - Se você vê isso, o CSS está funcionando!</h2>
          </div>
          
          <div className="brutal-card max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Teste de Configuração - Tema Brutalist</h2>
            <div className="space-y-4">
              <div className="brutal-input w-full">Input de teste</div>
              <button className="brutal-button w-full">Alternar Tema 🌙</button>
              <div className="grid grid-cols-3 gap-2">
                <button className="game-button game-button-a">A</button>
                <button className="game-button game-button-b">B</button>
                <button className="game-button game-button-c">C</button>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tema atual: Dark</p>
              </div>
            </div>
          </div>

          <div className="brutal-card max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4">Paleta de Cores Retro Arcade</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 retro-primary rounded text-center font-bold">Primary</div>
              <div className="p-4 retro-secondary rounded text-center font-bold">Secondary</div>
              <div className="p-4 retro-accent rounded text-center font-bold">Accent</div>
              <div className="p-4 retro-destructive rounded text-center font-bold">Destructive</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}