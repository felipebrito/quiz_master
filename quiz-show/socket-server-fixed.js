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
    
    // Send confirmation to player
    socket.emit('player:registered', {
      success: true,
      playerId: data.playerId,
      playerName: data.playerName
    })
  })

  // Ping/Pong system for connection verification
  socket.on('player:ping', (data) => {
    console.log('🏓 Player ping received from:', data.playerName || 'Unknown')
    socket.emit('player:pong', {
      timestamp: Date.now(),
      playerId: data.playerId,
      playerName: data.playerName
    })
  })

  socket.on('player:answer', async (data) => {
    try {
      console.log('📝 Player answer received:', data)
      
      if (gameState.status !== 'active' || !gameState.currentQuestion) {
        socket.emit('answer:result', { 
          success: false, 
          message: 'Game not active or no current question' 
        })
        return
      }

      // Check if answer is correct
      const isCorrect = data.answer === gameState.currentQuestion.correctAnswer
      const points = isCorrect ? 10 : 0

      console.log(`📊 ${data.participantName} answered ${data.answer}, correct: ${isCorrect}, points: ${points}`)

      // Update player points
      const participant = gameState.participants.find(p => p.id === data.participantId)
      if (participant) {
        participant.points += points
      }

      // Send result to player
      socket.emit('answer:result', {
        success: true,
        correct: isCorrect,
        points: points,
        correctAnswer: gameState.currentQuestion.correctAnswer
      })

      // Broadcast updated state
      broadcastGameState()

    } catch (error) {
      console.error('❌ Error processing player answer:', error)
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

  // Send current game state to admin
  socket.emit('game:state', {
    ...gameState,
    controls: gameControls
  })

  // Test event to verify socket communication
  socket.emit('admin:test', { message: 'Test connection' })
  console.log('🧪 Test event sent to admin socket:', socket.id)

  socket.on('admin:message:ack', (data) => {
    console.log('📨 Admin message acknowledgment received:', data)
  })

  socket.on('admin:game:start', async (data) => {
    try {
      console.log('👨‍💼 Admin requested game start with participants:', data.participantIds)

      // Validate participants
      if (!data.participantIds || data.participantIds.length === 0) {
        socket.emit('admin:message', {
          type: 'error',
          message: 'No participants selected'
        })
        return
      }

      // Get participants from database
      const participants = await prisma.participant.findMany({
        where: {
          id: { in: data.participantIds }
        }
      })

      if (participants.length !== data.participantIds.length) {
        socket.emit('admin:message', {
          type: 'error',
          message: 'Some participants not found'
        })
        return
      }

      // Initialize game state
      gameState = {
        id: `game_${Date.now()}`,
        status: 'waiting',
        currentRound: 0,
        totalRounds: 8,
        participants: participants.map(p => ({
          id: p.id,
          name: p.name,
          connected: connectedPlayers.has(p.id) ? connectedPlayers.get(p.id).connected : false,
          points: 0
        })),
        currentQuestion: null,
        startTime: new Date(),
        endTime: null,
        roundTimer: null,
        questionTimer: null
      }

      updateGameControls()
      broadcastGameState()

      // Check if all players are connected
      const allConnected = gameState.participants.every(p => p.connected)
      if (!allConnected) {
        socket.emit('admin:message', {
          type: 'warning',
          message: `Waiting for players to connect (${gameControls.connectedPlayers}/${gameControls.totalPlayers})`
        })
        return
      }

      // Start the game
      await startGame()

      socket.emit('admin:message', {
        type: 'success',
        message: 'Game started successfully!'
      })

    } catch (error) {
      console.error('❌ Error starting game:', error)
      socket.emit('admin:message', {
        type: 'error',
        message: 'Error starting game: ' + error.message
      })
    }
  })

  socket.on('admin:game:pause', () => {
    if (gameState.status === 'active') {
      gameState.status = 'paused'
      clearTimers()
      updateGameControls()
      broadcastGameState()
      
      socket.emit('admin:message', {
        type: 'success',
        message: 'Game paused'
      })
    }
  })

  socket.on('admin:game:resume', () => {
    if (gameState.status === 'paused') {
      gameState.status = 'active'
      updateGameControls()
      broadcastGameState()
      
      socket.emit('admin:message', {
        type: 'success',
        message: 'Game resumed'
      })
    }
  })

  socket.on('admin:game:stop', () => {
    gameState.status = 'stopped'
    gameState.endTime = new Date()
    clearTimers()
    updateGameControls()
    broadcastGameState()
    
    socket.emit('admin:message', {
      type: 'success',
      message: 'Game stopped'
    })
  })

  socket.on('admin:game:next-round', () => {
    if (gameState.status === 'active') {
      nextRound()
      socket.emit('admin:message', {
        type: 'success',
        message: 'Next round started'
      })
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('👨‍💼 Admin disconnected:', socket.id, 'reason:', reason)
  })
})

// Game logic functions
async function startGame() {
  console.log('🎮 Starting game...')
  
  gameState.status = 'active'
  gameState.currentRound = 1
  updateGameControls()
  broadcastGameState()

  // Start first round
  await startRound(1)
}

async function startRound(roundNumber) {
  console.log(`🎯 Starting round ${roundNumber}`)
  
  try {
    // Get random question
    const question = await prisma.question.findFirst({
      orderBy: { id: 'asc' },
      skip: Math.floor(Math.random() * 10) // Simple random selection
    })

    if (!question) {
      throw new Error('No questions available')
    }

    gameState.currentQuestion = {
      id: question.id,
      text: question.text,
      options: [question.option_a, question.option_b, question.option_c, question.option_d],
      correctAnswer: question.correct_answer,
      timeLeft: 30
    }

    updateGameControls()
    broadcastGameState()

    // Start question timer
    gameState.questionTimer = setTimeout(() => {
      endRound()
    }, 30000) // 30 seconds

    console.log(`🎯 Round ${roundNumber} started: ${question.text}`)

  } catch (error) {
    console.error('❌ Error starting round:', error)
    gameState.status = 'stopped'
    updateGameControls()
    broadcastGameState()
  }
}

function endRound() {
  console.log(`🏁 Round ${gameState.currentRound} ended`)
  
  clearTimers()
  
  if (gameState.currentRound >= gameState.totalRounds) {
    // Game finished
    gameState.status = 'finished'
    gameState.endTime = new Date()
    
    // Find winner
    const winner = gameState.participants.reduce((prev, current) => 
      (prev.points > current.points) ? prev : current
    )
    
    console.log(`🏆 Game ended! Winner: ${winner.name} with ${winner.points} points`)
  } else {
    // Next round
    gameState.currentRound++
    setTimeout(() => {
      startRound(gameState.currentRound)
    }, 2000) // 2 second delay between rounds
  }

  updateGameControls()
  broadcastGameState()
}

function nextRound() {
  if (gameState.status === 'active' && gameState.currentRound < gameState.totalRounds) {
    clearTimers()
    gameState.currentRound++
    startRound(gameState.currentRound)
  }
}

// Server startup
const PORT = 3002
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Fixed Socket.IO server running on port', PORT)
  console.log('📡 Main namespace: ws://0.0.0.0:' + PORT)
  console.log('👨‍💼 Admin namespace: ws://0.0.0.0:' + PORT + '/admin')
  console.log('🌐 Accessible from any IP on the network')
  console.log('🎮 Enhanced with proper player connection verification')
})