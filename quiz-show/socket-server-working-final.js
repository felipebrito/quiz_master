const { Server } = require('socket.io')
const { createServer } = require('http')
const { PrismaClient } = require('./src/generated/prisma')

// Initialize Prisma
const prisma = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
})

// Main namespace
const mainNamespace = io.of('/')
// Admin namespace
const adminNamespace = io.of('/admin')

// Enhanced Game State Management
let gameState = {
  id: null,
  status: 'waiting', // waiting, starting, active, paused, finished, stopped
  currentRound: 0,
  totalRounds: 8,
  participants: [],
  currentQuestion: null,
  startTime: null,
  endTime: null,
  roundTimer: null,
  questionTimer: null
}

let connectedPlayers = new Map() // participantId -> { socketId, name, connected }
let gameControls = {
  canStart: false,
  canPause: false,
  canResume: false,
  canStop: false,
  canNextRound: false,
  connectedPlayers: 0,
  totalPlayers: 0
}

// Utility functions
function updateGameControls() {
  const allConnected = gameState.participants.every(p => p.connected)
  const connectedCount = gameState.participants.filter(p => p.connected).length

  gameControls = {
    canStart: gameState.status === 'waiting' && allConnected && gameState.participants.length > 0,
    canPause: gameState.status === 'active',
    canResume: gameState.status === 'paused',
    canStop: ['active', 'paused'].includes(gameState.status),
    canNextRound: gameState.status === 'active' && gameState.currentRound < gameState.totalRounds,
    connectedPlayers: connectedCount,
    totalPlayers: gameState.participants.length
  }

  console.log('🎮 Game controls updated:', gameControls)
}

function broadcastGameState() {
  const state = {
    ...gameState,
    controls: gameControls
  }
  
  // Broadcast to admin
  adminNamespace.emit('game:state', state)
  
  // Broadcast to players
  mainNamespace.emit('game:state', state)
  
  console.log('📡 Game state broadcasted:', state.status, `(${gameControls.connectedPlayers}/${gameControls.totalPlayers} players)`)
}

function updatePlayerConnection(participantId, connected, socketId = null, playerName = null) {
  const player = connectedPlayers.get(participantId)
  if (player) {
    player.connected = connected
    if (socketId) player.socketId = socketId
    if (playerName) player.name = playerName
  } else if (connected && socketId && playerName) {
    connectedPlayers.set(participantId, {
      socketId,
      name: playerName,
      connected: true
    })
  }

  // Update game state participants
  const participant = gameState.participants.find(p => p.id === participantId)
  if (participant) {
    participant.connected = connected
    if (playerName) participant.name = playerName
  }

  updateGameControls()
  broadcastGameState()
}

function clearTimers() {
  if (gameState.roundTimer) {
    clearTimeout(gameState.roundTimer)
    gameState.roundTimer = null
  }
  if (gameState.questionTimer) {
    clearTimeout(gameState.questionTimer)
    gameState.questionTimer = null
  }
}

// Main namespace events
mainNamespace.on('connection', (socket) => {
  console.log('✅ Player connected:', socket.id)

  socket.on('player:register', (data) => {
    console.log('👤 Player registered:', data.playerName, '(' + data.playerId + ')')
    socket.playerId = data.playerId
    socket.playerName = data.playerName
    
    // Update connection status
    updatePlayerConnection(data.playerId, true, socket.id, data.playerName)
  })

  socket.on('player:answer', async (data) => {
    try {
      console.log('📝 Player answer received:', data)
      
      if (!gameState.isActive || !gameState.currentQuestion) {
        socket.emit('answer:result', { 
          success: false, 
          message: 'No active game or question' 
        })
        return
      }

      // Check if answer is correct
      const isCorrect = data.answer === gameState.currentQuestion.correct_answer
      const points = isCorrect ? 10 : 0

      // Update participant score
      const participant = gameState.participants.find(p => p.id === data.participantId)
      if (participant) {
        participant.score += points
      }

      // Emit result to all players
      mainNamespace.emit('answer:result', {
        participantId: data.participantId,
        participantName: participant?.name || 'Unknown',
        answer: data.answer,
        correctAnswer: gameState.currentQuestion.correct_answer,
        isCorrect: isCorrect,
        points: points,
        responseTime: data.responseTime
      })

      console.log(`📊 ${participant?.name || 'Unknown'} answered ${data.answer}, correct: ${isCorrect}, points: ${points}`)

    } catch (error) {
      console.error('❌ Error processing answer:', error)
      socket.emit('answer:result', { 
        success: false, 
        message: 'Error processing answer' 
      })
    }
  })

  socket.on('disconnect', () => {
    console.log('❌ Player disconnected:', socket.id, 'reason:', socket.disconnectReason)
    
    if (socket.playerId) {
      updatePlayerConnection(socket.playerId, false)
    }
  })
})

// Admin namespace events
adminNamespace.on('connection', (socket) => {
  console.log('👨‍💼 Admin connected:', socket.id)

  socket.on('admin:message:ack', (data) => {
    console.log('📨 Admin message acknowledgment received:', data)
  })

  // Test event to verify socket communication
  socket.emit('admin:test', { message: 'Test connection' })
  console.log('🧪 Test event sent to admin socket:', socket.id)

  socket.on('admin:game:start', async (data) => {
    try {
      console.log('👨‍💼 Admin requested game start with participants:', data.participantIds)
      
      if (gameState.isActive) {
        socket.emit('admin:message', {
          type: 'error',
          message: 'Game is already active'
        })
        return
      }

      // Get participants from database
      const participants = await prisma.participant.findMany({
        where: {
          id: { in: data.participantIds }
        }
      })

      if (participants.length < 2) {
        socket.emit('admin:message', {
          type: 'error',
          message: 'Need at least 2 participants to start a game'
        })
        return
      }

      // Get random questions
      const allQuestions = await prisma.question.findMany()
      if (allQuestions.length < 8) {
        socket.emit('admin:message', {
          type: 'error',
          message: 'Not enough questions in database'
        })
        return
      }

      // Shuffle and select 8 questions
      const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random())
      const questions = shuffledQuestions.slice(0, 8)

      // Create game in database
      const game = await prisma.game.create({
        data: {
          status: 'active',
          current_round: 0,
          started_at: new Date()
        }
      })

      // Create game participants
      const gameParticipants = await Promise.all(
        participants.map(async (participant, index) => {
          return await prisma.gameParticipant.create({
            data: {
              game_id: game.id,
              participant_id: participant.id,
              score: 0,
              position: index + 1
            }
          })
        })
      )

      // Create rounds
      const rounds = await Promise.all(
        questions.map(async (question, index) => {
          return await prisma.round.create({
            data: {
              game_id: game.id,
              question_id: question.id,
              round_number: index + 1,
              start_time: new Date()
            }
          })
        })
      )

      // Update game state
      gameState = {
        isActive: true,
        gameId: game.id,
        currentRound: 0,
        totalRounds: 8,
        participants: participants.map(p => ({ ...p, score: 0 })),
        questions: questions,
        currentQuestion: null,
        timeRemaining: 30,
        isRunning: false
      }

      // Start first round
      await startRound(1)

      // Notify admin
      console.log('📤 Emitting admin:message to socket:', socket.id)
      console.log('🔌 Socket connected:', socket.connected)
      console.log('🔌 Socket in admin namespace:', socket.nsp.name)
      
      socket.emit('admin:message', {
        type: 'success',
        message: 'Game started successfully!'
      }, (response) => {
        console.log('📨 Admin message callback response:', response)
      })
      console.log('✅ admin:message event emitted')

      console.log('🎮 Game started successfully with', participants.length, 'participants')

    } catch (error) {
      console.error('❌ Error starting game:', error)
      socket.emit('admin:message', {
        type: 'error',
        message: 'Failed to start game: ' + error.message
      })
    }
  })

  socket.on('admin:game:stop', async () => {
    try {
      if (!gameState.isActive) {
        socket.emit('admin:message', {
          type: 'error',
          message: 'No active game to stop'
        })
        return
      }

      // End current game
      await prisma.game.update({
        where: { id: gameState.gameId },
        data: {
          status: 'finished',
          ended_at: new Date()
        }
      })

      // Find winner
      const winner = gameState.participants.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      )

      // Emit game ended to all players
      mainNamespace.emit('game:ended', {
        winner: winner,
        finalScores: gameState.participants.sort((a, b) => b.score - a.score)
      })

      // Reset game state
      gameState = {
        isActive: false,
        gameId: null,
        currentRound: 0,
        totalRounds: 8,
        participants: [],
        questions: [],
        currentQuestion: null,
        timeRemaining: 30,
        isRunning: false
      }

      socket.emit('admin:message', {
        type: 'success',
        message: 'Game stopped successfully!'
      })

      console.log('🏁 Game stopped by admin')

    } catch (error) {
      console.error('❌ Error stopping game:', error)
      socket.emit('admin:message', {
        type: 'error',
        message: 'Failed to stop game: ' + error.message
      })
    }
  })

  socket.on('disconnect', () => {
    console.log('👨‍💼 Admin disconnected:', socket.id, 'reason:', socket.disconnectReason)
  })
})

// Start a round
async function startRound(roundNumber) {
  try {
    if (roundNumber > gameState.totalRounds) {
      // End game
      await endGame()
      return
    }

    const question = gameState.questions[roundNumber - 1]
    gameState.currentRound = roundNumber
    gameState.currentQuestion = question
    gameState.timeRemaining = 30
    gameState.isRunning = true

    // Emit round started to all players
    mainNamespace.emit('round:started', {
      roundNumber: roundNumber,
      question: question,
      timeRemaining: 30
    })

    // Start timer
    const timer = setInterval(() => {
      gameState.timeRemaining--
      
      // Emit timer update
      mainNamespace.emit('timer:update', {
        timeRemaining: gameState.timeRemaining,
        isRunning: gameState.isRunning
      })

      if (gameState.timeRemaining <= 0) {
        clearInterval(timer)
        endRound()
      }
    }, 1000)

    console.log(`🎯 Round ${roundNumber} started:`, question.text)

  } catch (error) {
    console.error('❌ Error starting round:', error)
  }
}

// End current round
async function endRound() {
  try {
    gameState.isRunning = false
    gameState.timeRemaining = 0

    // Emit round ended
    mainNamespace.emit('round:ended', {
      roundNumber: gameState.currentRound,
      currentScores: gameState.participants
    })

    console.log(`🏁 Round ${gameState.currentRound} ended`)

    // Start next round after 3 seconds
    setTimeout(() => {
      startRound(gameState.currentRound + 1)
    }, 3000)

  } catch (error) {
    console.error('❌ Error ending round:', error)
  }
}

// End game
async function endGame() {
  try {
    gameState.isActive = false
    gameState.isRunning = false

    // Find winner
    const winner = gameState.participants.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    )

    // Emit game ended
    mainNamespace.emit('game:ended', {
      winner: winner,
      finalScores: gameState.participants.sort((a, b) => b.score - a.score)
    })

    console.log('🏆 Game ended! Winner:', winner.name, 'with', winner.score, 'points')

  } catch (error) {
    console.error('❌ Error ending game:', error)
  }
}

// Start server
const PORT = 3002
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Socket.IO server running on port', PORT)
  console.log('📡 Main namespace: ws://0.0.0.0:' + PORT)
  console.log('👨‍💼 Admin namespace: ws://0.0.0.0:' + PORT + '/admin')
  console.log('🌐 Accessible from any IP on the network')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...')
  await prisma.$disconnect()
  process.exit(0)
})
