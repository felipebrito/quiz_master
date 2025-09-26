import { GameState, GameStatus, RoundStatus, GameEvent } from '@/types/game'

export class GameStateMachine {
  private state: GameState
  private listeners: ((state: GameState, event: GameEvent) => void)[] = []

  constructor(initialState: GameState) {
    this.state = { ...initialState }
  }

  // Adicionar listener para mudanças de estado
  addListener(listener: (state: GameState, event: GameEvent) => void) {
    this.listeners.push(listener)
  }

  // Remover listener
  removeListener(listener: (state: GameState, event: GameEvent) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  // Notificar listeners
  private notifyListeners(event: GameEvent) {
    this.listeners.forEach(listener => listener(this.state, event))
  }

  // Obter estado atual
  getState(): GameState {
    return { ...this.state }
  }

  // Verificar se uma transição é válida
  canTransition(from: GameStatus, to: GameStatus): boolean {
    const validTransitions: Record<GameStatus, GameStatus[]> = {
      'waiting': ['active'],
      'active': ['finished'],
      'finished': [] // Estado final
    }

    return validTransitions[from].includes(to)
  }

  // Iniciar jogo
  startGame(participants: any[], questions: any[]): boolean {
    if (!this.canTransition(this.state.status, 'active')) {
      console.error('❌ Transição inválida: não é possível iniciar o jogo no estado atual')
      return false
    }

    this.state = {
      ...this.state,
      status: 'active',
      participants: participants.map(p => ({
        id: p.id,
        participantId: p.participantId,
        name: p.name,
        score: 0,
        joinedAt: new Date(),
        leftAt: null
      })),
      questions,
      startedAt: new Date(),
      currentRound: 0,
      totalRounds: questions.length,
      roundStatus: 'waiting',
      currentQuestion: null,
      roundStartTime: null,
      roundEndTime: null
    }

    const event: GameEvent = {
      type: 'GAME_START',
      data: { game: this.state },
      timestamp: new Date()
    }

    this.notifyListeners(event)
    console.log('🎮 Jogo iniciado:', this.state.id)
    return true
  }

  // Iniciar rodada
  startRound(roundNumber: number): boolean {
    if (this.state.status !== 'active') {
      console.error('❌ Não é possível iniciar rodada: jogo não está ativo')
      return false
    }

    if (roundNumber >= this.state.totalRounds) {
      console.error('❌ Número de rodada inválido')
      return false
    }

    const question = this.state.questions[roundNumber]
    if (!question) {
      console.error('❌ Pergunta não encontrada para a rodada', roundNumber)
      return false
    }

    this.state = {
      ...this.state,
      currentRound: roundNumber,
      roundStatus: 'active',
      currentQuestion: question,
      roundStartTime: new Date(),
      roundEndTime: null
    }

    const event: GameEvent = {
      type: 'ROUND_START',
      data: { 
        game: this.state, 
        question, 
        roundNumber,
        timeRemaining: 30 // 30 segundos por pergunta
      },
      timestamp: new Date()
    }

    this.notifyListeners(event)
    console.log(`🎯 Rodada ${roundNumber + 1} iniciada:`, question.text)
    return true
  }

  // Finalizar rodada
  endRound(): boolean {
    if (this.state.roundStatus !== 'active') {
      console.error('❌ Não é possível finalizar rodada: rodada não está ativa')
      return false
    }

    this.state = {
      ...this.state,
      roundStatus: 'finished',
      roundEndTime: new Date()
    }

    const event: GameEvent = {
      type: 'ROUND_END',
      data: { 
        game: this.state,
        correctAnswer: this.state.currentQuestion?.correctAnswer,
        roundNumber: this.state.currentRound
      },
      timestamp: new Date()
    }

    this.notifyListeners(event)
    console.log(`🏁 Rodada ${this.state.currentRound + 1} finalizada`)
    return true
  }

  // Processar resposta
  processAnswer(participantId: string, answer: string): boolean {
    if (this.state.roundStatus !== 'active' || !this.state.currentQuestion) {
      console.error('❌ Não é possível processar resposta: rodada não está ativa')
      return false
    }

    const participant = this.state.participants.find(p => p.participantId === participantId)
    if (!participant) {
      console.error('❌ Participante não encontrado')
      return false
    }

    const isCorrect = answer === this.state.currentQuestion.correctAnswer
    const points = isCorrect ? 10 : 0

    // Atualizar pontuação
    this.state.participants = this.state.participants.map(p => 
      p.participantId === participantId 
        ? { ...p, score: p.score + points }
        : p
    )

    const event: GameEvent = {
      type: 'ANSWER_SUBMITTED',
      data: { 
        participantId, 
        answer, 
        isCorrect, 
        points,
        currentScore: participant.score + points
      },
      timestamp: new Date()
    }

    this.notifyListeners(event)
    console.log(`📝 Resposta processada: ${participant.name} - ${answer} (${isCorrect ? 'Correta' : 'Incorreta'}) - +${points} pontos`)
    return true
  }

  // Finalizar jogo
  endGame(): boolean {
    if (!this.canTransition(this.state.status, 'finished')) {
      console.error('❌ Transição inválida: não é possível finalizar o jogo no estado atual')
      return false
    }

    this.state = {
      ...this.state,
      status: 'finished',
      endedAt: new Date(),
      roundStatus: 'finished'
    }

    // Determinar vencedor
    const winner = this.state.participants.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    )

    const event: GameEvent = {
      type: 'GAME_END',
      data: { 
        game: this.state, 
        winner: winner.score > 0 ? winner : null,
        finalScores: this.state.participants.map(p => ({
          name: p.name,
          score: p.score
        }))
      },
      timestamp: new Date()
    }

    this.notifyListeners(event)
    console.log('🏆 Jogo finalizado. Vencedor:', winner.name, 'com', winner.score, 'pontos')
    return true
  }

  // Atualizar timer
  updateTimer(timeRemaining: number): void {
    const event: GameEvent = {
      type: 'TIMER_UPDATE',
      data: { timeRemaining },
      timestamp: new Date()
    }

    this.notifyListeners(event)
  }

  // Verificar se o jogo pode avançar para próxima rodada
  canAdvanceToNextRound(): boolean {
    return this.state.status === 'active' && 
           this.state.currentRound < this.state.totalRounds - 1 &&
           this.state.roundStatus === 'finished'
  }

  // Avançar para próxima rodada
  advanceToNextRound(): boolean {
    if (!this.canAdvanceToNextRound()) {
      return false
    }

    return this.startRound(this.state.currentRound + 1)
  }
}
