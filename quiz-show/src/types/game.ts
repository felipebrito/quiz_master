// Tipos para a máquina de estados do jogo

export type GameStatus = 'waiting' | 'active' | 'finished'

export type RoundStatus = 'waiting' | 'active' | 'finished'

export interface GameState {
  id: string
  status: GameStatus
  currentRound: number
  totalRounds: number
  participants: GameParticipant[]
  questions: GameQuestion[]
  startedAt: Date | null
  endedAt: Date | null
  currentQuestion: GameQuestion | null
  roundStatus: RoundStatus
  roundStartTime: Date | null
  roundEndTime: Date | null
}

export interface GameParticipant {
  id: string
  participantId: string
  name: string
  score: number
  joinedAt: Date
  leftAt: Date | null
}

export interface GameQuestion {
  id: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  correctAnswer: string
  difficulty: string
  roundNumber: number
}

export interface GameEvent {
  type: 'GAME_START' | 'ROUND_START' | 'ROUND_END' | 'GAME_END' | 'ANSWER_SUBMITTED' | 'TIMER_UPDATE'
  data: any
  timestamp: Date
}

// Eventos Socket.IO
export interface SocketEvents {
  // Admin events
  'admin:game:start': { participantIds: string[] }
  'admin:game:stop': { gameId: string }
  'admin:round:next': { gameId: string }
  
  // Game events (broadcast)
  'game:started': { game: GameState }
  'game:ended': { game: GameState, winner: GameParticipant | null }
  'round:started': { game: GameState, question: GameQuestion, timeRemaining: number }
  'round:ended': { game: GameState, correctAnswer: string }
  'timer:update': { timeRemaining: number }
  
  // Player events
  'player:answer': { gameId: string, questionId: string, answer: string, participantId: string }
  'player:joined': { participant: GameParticipant }
  'player:left': { participantId: string }
}
