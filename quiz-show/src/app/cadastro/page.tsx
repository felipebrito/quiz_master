'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface FormData {
  name: string
  city: string
  state: string
}

export default function CadastroPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    city: '',
    state: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraAvailable, setCameraAvailable] = useState(true)
  const [cameraLoading, setCameraLoading] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Inicializar webcam
  useEffect(() => {
    // Verificar se estamos no navegador e se a API está disponível
    if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      startCamera()
    } else {
      setCameraAvailable(false)
    }
    
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setCameraLoading(true)
      setError('')
      
      // Verificar se a API está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de mídia não suportada. Acesse via HTTPS.')
      }

      console.log('🎥 Iniciando webcam...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' // Front camera for selfie
        } 
      })
      
      console.log('✅ Stream obtido:', stream)
      
      if (videoRef.current) {
        console.log('🎥 Elemento de vídeo encontrado:', videoRef.current)
        videoRef.current.srcObject = stream
        streamRef.current = stream
        console.log('📺 Stream atribuído ao vídeo')
        
        // Aguardar o vídeo carregar
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Vídeo carregado e pronto')
          console.log('📐 Dimensões do vídeo:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
          setCameraLoading(false)
          if (videoRef.current) {
            videoRef.current.play()
          }
        }

        // Adicionar mais eventos para debug
        videoRef.current.oncanplay = () => {
          console.log('🎬 Vídeo pode começar a tocar')
        }

        videoRef.current.onplay = () => {
          console.log('▶️ Vídeo começou a tocar')
        }

        videoRef.current.onerror = (e) => {
          console.error('❌ Erro no vídeo:', e)
        }
      }
    } catch (err) {
      console.error('❌ Erro ao acessar webcam:', err)
      setCameraAvailable(false)
      setCameraLoading(false)
      setError('Webcam não disponível. Use o upload de arquivo abaixo.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true)
      
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        // Configurar canvas com as dimensões do vídeo
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Desenhar o frame atual do vídeo no canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Converter para base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        
        // Parar a webcam após captura
        stopCamera()
      }
      
      setIsCapturing(false)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    if (cameraAvailable) {
      startCamera()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem')
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo 5MB')
        return
      }

      // Converter para base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCapturedImage(result)
        setError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório')
      return false
    }
    if (formData.name.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres')
      return false
    }
    if (!formData.city.trim()) {
      setError('Cidade é obrigatória')
      return false
    }
    if (formData.city.length < 2) {
      setError('Cidade deve ter pelo menos 2 caracteres')
      return false
    }
    if (!formData.state.trim()) {
      setError('Estado é obrigatório')
      return false
    }
    if (formData.state.length !== 2) {
      setError('Estado deve ter exatamente 2 caracteres (UF)')
      return false
    }
    if (!capturedImage) {
      setError('É necessário tirar uma foto')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // Primeiro, fazer upload da imagem
      const formDataUpload = new FormData()
      const blob = await fetch(capturedImage!).then(r => r.blob())
      formDataUpload.append('file', blob, 'selfie.jpg')
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })
      
      const uploadData = await uploadResponse.json()
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Erro no upload da imagem')
      }
      
      // Depois, cadastrar o participante
      const participantData = {
        name: formData.name.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        photo: uploadData.data.url
      }
      
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(participantData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(true)
        setFormData({ name: '', city: '', state: '' })
        setCapturedImage(null)
        startCamera() // Reiniciar webcam
      } else {
        setError(data.error || 'Erro ao cadastrar participante')
      }
    } catch (err) {
      console.error('Erro no cadastro:', err)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      {/* Navegação */}
      <nav className="mb-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Voltar ao Início
          </Link>
          <div className="flex gap-4">
            <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
              Admin
            </Link>
            <Link href="/display" className="text-gray-300 hover:text-white transition-colors">
              Display
            </Link>
            <Link href="/ranking" className="text-gray-300 hover:text-white transition-colors">
              Ranking
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎮 Cadastro de Participantes</h1>
          <p className="text-gray-400">Preencha seus dados e tire uma selfie para participar do quiz!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl">📝 Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="bg-gray-700 border-gray-600 text-white"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Digite sua cidade"
                    className="bg-gray-700 border-gray-600 text-white"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="state">Estado (UF) *</Label>
                  <Input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                    placeholder="Ex: SP, RJ, MG"
                    maxLength={2}
                    className="bg-gray-700 border-gray-600 text-white"
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-900 border border-red-700 rounded-lg">
                    <p className="text-red-200">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-900 border border-green-700 rounded-lg">
                    <p className="text-green-200">✅ Cadastro realizado com sucesso! Você está na fila.</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting || !capturedImage}
                >
                  {isSubmitting ? 'Cadastrando...' : 'Finalizar Cadastro'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Webcam e Captura */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl">📸 Selfie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!capturedImage ? (
                  <div className="space-y-4">
                    {cameraAvailable ? (
                      <>
                        <div className="relative bg-gray-700 rounded-lg overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-64 object-cover"
                          />
                          {cameraLoading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                <p className="text-white text-sm">Carregando webcam...</p>
                              </div>
                            </div>
                          )}
                          {!cameraLoading && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="text-center">
                                <div className="w-16 h-16 border-4 border-white rounded-full mx-auto mb-2"></div>
                                <p className="text-white text-sm drop-shadow-lg">Posicione seu rosto aqui</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          onClick={capturePhoto}
                          disabled={isCapturing || cameraLoading}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                        >
                          {isCapturing ? 'Capturando...' : cameraLoading ? 'Carregando...' : '📸 Tirar Selfie'}
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-700 rounded-lg p-8 text-center">
                          <div className="text-6xl mb-4">📷</div>
                          <p className="text-gray-300 mb-4">Webcam não disponível</p>
                          <p className="text-sm text-gray-400">Use o upload de arquivo abaixo</p>
                        </div>
                        
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            📁 Selecionar Foto
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={capturedImage}
                        alt="Selfie capturada"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-600">✓ Capturada</Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={retakePhoto}
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        🔄 Refazer
                      </Button>
                      <Button
                        onClick={() => setCapturedImage(null)}
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        ❌ Remover
                      </Button>
                    </div>
                    
                    {/* Fallback de upload sempre disponível */}
                    <div className="border-t border-gray-600 pt-4">
                      <p className="text-sm text-gray-400 mb-2">Ou use upload de arquivo:</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        📁 Trocar por Arquivo
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-center text-sm text-gray-400">
                  <p>📱 Certifique-se de que sua face está bem visível</p>
                  <p>💡 A foto será usada na tela pública durante o jogo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  )
}