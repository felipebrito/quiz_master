export interface GameState {
  id: string
  status: 'waiting' | 'starting' | 'active' | 'paused' | 'finished' | 'stopped'
  currentRound: number
  totalRounds: number
  participants: Array<{
    id: string
    name: string
    connected: boolean
    points: number
  }>
  currentQuestion?: {
    id: string
    text: string
    options: string[]
    correctAnswer: string
    timeLeft: number
  }
  startTime?: Date
  endTime?: Date
}

export interface GameControls {
  canStart: boolean
  canPause: boolean
  canResume: boolean
  canStop: boolean
  canNextRound: boolean
  connectedPlayers: number
  totalPlayers: number
}

export class GameManager {
  private gameState: GameState | null = null
  private listeners: Map<string, (state: GameState) => void> = new Map()
  private controls: GameControls = {
    canStart: false,
    canPause: false,
    canResume: false,
    canStop: false,
    canNextRound: false,
    connectedPlayers: 0,
    totalPlayers: 0
  }

  // Estado do jogo
  getState(): GameState | null {
    return this.gameState
  }

  getControls(): GameControls {
    return this.controls
  }

  // Inicializar novo jogo
  initializeGame(participants: Array<{ id: string; name: string }>): GameState {
    this.gameState = {
      id: `game_${Date.now()}`,
      status: 'waiting',
      currentRound: 0,
      totalRounds: 8,
      participants: participants.map(p => ({
        ...p,
        connected: false,
        points: 0
      })),
      startTime: new Date()
    }
    
    this.updateControls()
    this.notifyListeners()
    return this.gameState
  }

  // Atualizar conexão de jogador
  updatePlayerConnection(participantId: string, connected: boolean): void {
    if (!this.gameState) return

    const participant = this.gameState.participants.find(p => p.id === participantId)
    if (participant) {
      participant.connected = connected
      this.updateControls()
      this.notifyListeners()
    }
  }

  // Iniciar jogo
  startGame(): boolean {
    if (!this.gameState) return false
    
    const allConnected = this.gameState.participants.every(p => p.connected)
    if (!allConnected) {
      console.warn('❌ Cannot start game: not all players are connected')
      return false
    }

    this.gameState.status = 'active'
    this.gameState.currentRound = 1
    this.updateControls()
    this.notifyListeners()
    return true
  }

  // Pausar jogo
  pauseGame(): boolean {
    if (!this.gameState || this.gameState.status !== 'active') return false
    
    this.gameState.status = 'paused'
    this.updateControls()
    this.notifyListeners()
    return true
  }

  // Retomar jogo
  resumeGame(): boolean {
    if (!this.gameState || this.gameState.status !== 'paused') return false
    
    this.gameState.status = 'active'
    this.updateControls()
    this.notifyListeners()
    return true
  }

  // Parar jogo
  stopGame(): boolean {
    if (!this.gameState) return false
    
    this.gameState.status = 'stopped'
    this.gameState.endTime = new Date()
    this.updateControls()
    this.notifyListeners()
    return true
  }

  // Próxima rodada
  nextRound(): boolean {
    if (!this.gameState || this.gameState.status !== 'active') return false
    
    if (this.gameState.currentRound >= this.gameState.totalRounds) {
      this.gameState.status = 'finished'
      this.gameState.endTime = new Date()
    } else {
      this.gameState.currentRound++
    }
    
    this.updateControls()
    this.notifyListeners()
    return true
  }

  // Atualizar pontos de jogador
  updatePlayerPoints(participantId: string, points: number): void {
    if (!this.gameState) return

    const participant = this.gameState.participants.find(p => p.id === participantId)
    if (participant) {
      participant.points += points
      this.notifyListeners()
    }
  }

  // Definir pergunta atual
  setCurrentQuestion(question: GameState['currentQuestion']): void {
    if (!this.gameState) return
    
    this.gameState.currentQuestion = question
    this.notifyListeners()
  }

  // Atualizar controles baseado no estado atual
  private updateControls(): void {
    if (!this.gameState) {
      this.controls = {
        canStart: false,
        canPause: false,
        canResume: false,
        canStop: false,
        canNextRound: false,
        connectedPlayers: 0,
        totalPlayers: 0
      }
      return
    }

    const allConnected = this.gameState.participants.every(p => p.connected)
    const connectedCount = this.gameState.participants.filter(p => p.connected).length

    this.controls = {
      canStart: this.gameState.status === 'waiting' && allConnected,
      canPause: this.gameState.status === 'active',
      canResume: this.gameState.status === 'paused',
      canStop: ['active', 'paused'].includes(this.gameState.status),
      canNextRound: this.gameState.status === 'active' && this.gameState.currentRound < this.gameState.totalRounds,
      connectedPlayers: connectedCount,
      totalPlayers: this.gameState.participants.length
    }
  }

  // Sistema de listeners
  subscribe(listenerId: string, callback: (state: GameState) => void): void {
    this.listeners.set(listenerId, callback)
  }

  unsubscribe(listenerId: string): void {
    this.listeners.delete(listenerId)
  }

  private notifyListeners(): void {
    if (!this.gameState) return
    
    this.listeners.forEach(callback => {
      try {
        callback(this.gameState!)
      } catch (error) {
        console.error('Error in game state listener:', error)
      }
    })
  }

  // Reset do jogo
  reset(): void {
    this.gameState = null
    this.updateControls()
    this.notifyListeners()
  }
}

// Instância global do gerenciador
export const gameManager = new GameManager()
