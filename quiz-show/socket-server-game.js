const { Server } = require('socket.io')
const { createServer } = require('http')
const { PrismaClient } = require('./src/generated/prisma')

const prisma = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"],
    credentials: true
  }
})

// Store game state
let gameState = {
  isRunning: false,
  timeRemaining: 30, // 30 seconds
  players: new Map(), // Stores connected players { socketId: { playerId, playerName, socketId } }
  currentQuestion: null,
  currentRound: 0,
  gameId: null,
  participants: [] // IDs of participants in the current game
}

// Timer interval
let timerInterval = null

// Helper functions for timer
function startTimer() {
  if (timerInterval) return

  gameState.isRunning = true
  timerInterval = setInterval(() => {
    gameState.timeRemaining--

    // Broadcast time to all players
    io.emit('timer:update', {
      timeRemaining: gameState.timeRemaining,
      isRunning: gameState.isRunning
    })

    if (gameState.timeRemaining <= 0) {
      stopTimer()
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  gameState.isRunning = false
}

function resetTimer() {
  stopTimer()
  gameState.timeRemaining = 30 // Reset to initial value
  io.emit('timer:update', {
    timeRemaining: gameState.timeRemaining,
    isRunning: gameState.isRunning
  })
}

// Game logic functions
async function startGame(participantIds) {
  try {
    console.log('🎮 Starting game with participants:', participantIds)

    // Validate participants
    if (!participantIds || participantIds.length !== 3) {
      throw new Error('Exactly 3 participants required')
    }

    const result = await prisma.$transaction(async tx => {
      // Get participants
      const participants = await tx.participant.findMany({
        where: {
          id: { in: participantIds },
          status: 'waiting'
        }
      })

      if (participants.length !== 3) {
        throw new Error('Some participants not found or not available')
      }

      // Get 8 random questions
      const allQuestions = await tx.question.findMany()
      
      if (allQuestions.length < 8) {
        throw new Error('Not enough questions in database')
      }
      
      // Shuffle and take 8 random questions
      const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random())
      const questions = shuffledQuestions.slice(0, 8)

      // Create game
      const game = await tx.game.create({
        data: {
          status: 'active',
          current_round: 0,
          started_at: new Date()
        }
      })

      // Create game participants
      await Promise.all(
        participants.map((participant, index) =>
          tx.gameParticipant.create({
            data: {
              game_id: game.id,
              participant_id: participant.id,
              score: 0,
              position: index + 1
            }
          })
        )
      )

      return { game, participants, questions }
    })

    const { game, participants, questions } = result

    // Update game state
    gameState.gameId = game.id
    gameState.participants = participants.map(p => p.id)
    gameState.currentRound = 0
    gameState.currentQuestion = questions[0]

    // Update participant status
    await prisma.participant.updateMany({
      where: { id: { in: participantIds } },
      data: { status: 'playing' }
    })

    console.log('✅ Game created successfully:', game.id)

    // Emit game started event
    io.emit('game:started', {
      gameId: game.id,
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        city: p.city,
        state: p.state,
        photo_url: p.photo_url
      })),
      totalRounds: 8,
      currentRound: 1,
      question: questions[0]
    })

    // Start first round
    startRound(game.id, questions[0], 1)

    return { success: true, gameId: game.id }

  } catch (error) {
    console.error('❌ Error starting game:', error)
    return { success: false, error: error.message }
  }
}

async function startRound(gameId, question, roundNumber) {
  try {
    console.log(`🎯 Starting round ${roundNumber}:`, question.text)

    // Update game state
    gameState.currentRound = roundNumber
    gameState.currentQuestion = question
    gameState.timeRemaining = 30

    // Start timer
    startTimer()

    // Emit round started event
    io.emit('round:started', {
      gameId,
      roundNumber,
      question: {
        id: question.id,
        text: question.text,
        optionA: question.option_a,
        optionB: question.option_b,
        optionC: question.option_c,
        difficulty: question.difficulty
      },
      timeRemaining: 30
    })

    // Set timeout to end round
    setTimeout(() => {
      endRound(gameId, question)
    }, 30000)

  } catch (error) {
    console.error('❌ Error starting round:', error)
  }
}

async function endRound(gameId, question) {
  try {
    console.log(`🏁 Ending round for question:`, question.text)

    // Stop timer
    stopTimer()

    // Get current scores
    const gameParticipants = await prisma.gameParticipant.findMany({
      where: { game_id: gameId },
      include: { participant: true }
    })

    const currentScores = gameParticipants.map(gp => ({
      id: gp.participant.id,
      name: gp.participant.name,
      score: gp.score
    }))

    // Emit round ended event
    io.emit('round:ended', {
      gameId,
      correctAnswer: question.correct_answer,
      explanation: `Resposta correta: ${question.correct_answer}`,
      currentScores: currentScores
    })

    // Check if there are more rounds
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { rounds: true }
    })

    if (game.current_round < 8) {
      // Move to next round
      const nextRound = game.current_round + 1
      const nextQuestion = await prisma.question.findFirst({
        where: {
          rounds: {
            some: {
              game_id: gameId,
              round_number: nextRound
            }
          }
        }
      })

      if (nextQuestion) {
        // Update game round
        await prisma.game.update({
          where: { id: gameId },
          data: { current_round: nextRound }
        })

        // Start next round after 3 seconds
        setTimeout(() => {
          startRound(gameId, nextQuestion, nextRound)
        }, 3000)
      }
    } else {
      // Game finished
      await endGame(gameId)
    }

  } catch (error) {
    console.error('❌ Error ending round:', error)
  }
}

async function endGame(gameId) {
  try {
    console.log('🏆 Ending game:', gameId)

    // Stop timer
    stopTimer()

    // Get final scores
    const gameParticipants = await prisma.gameParticipant.findMany({
      where: { game_id: gameId },
      include: { participant: true },
      orderBy: { score: 'desc' }
    })

    // Update game status
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'finished',
        ended_at: new Date()
      }
    })

    // Update participant status
    await prisma.participant.updateMany({
      where: { id: { in: gameState.participants } },
      data: { status: 'waiting' }
    })

    // Emit game ended event
    io.emit('game:ended', {
      gameId,
      winner: gameParticipants[0],
      finalScores: gameParticipants.map(gp => ({
        id: gp.participant.id,
        name: gp.participant.name,
        score: gp.score
      }))
    })

    // Reset game state
    gameState.gameId = null
    gameState.participants = []
    gameState.currentRound = 0
    gameState.currentQuestion = null

    console.log('✅ Game ended successfully')

  } catch (error) {
    console.error('❌ Error ending game:', error)
  }
}

// Main namespace for players
io.on('connection', (socket) => {
  console.log(`✅ Player connected: ${socket.id}`)

  // Send current timer state to newly connected players
  socket.emit('timer:update', {
    timeRemaining: gameState.timeRemaining,
    isRunning: gameState.isRunning
  })

  // Handle player registration
  socket.on('player:register', (data) => {
    const { playerId, playerName } = data
    gameState.players.set(socket.id, { playerId, playerName, socketId: socket.id })
    console.log(`👤 Player registered: ${playerName} (${playerId})`)
    
    // Broadcast player list to all
    io.emit('players:update', Array.from(gameState.players.values()))
  })

  // Handle player answer
  socket.on('player:answer', async (data) => {
    try {
      const { gameId, questionId, answer, participantId } = data

      if (!gameState.gameId || gameState.gameId !== gameId) {
        console.log('❌ Answer received for inactive game')
        return
      }

      if (!gameState.isRunning) {
        console.log('❌ Answer received when timer not running')
        return
      }

      // Get the question
      const question = await prisma.question.findUnique({
        where: { id: questionId }
      })

      if (!question) {
        console.log('❌ Question not found')
        return
      }

      // Check if answer is correct
      const isCorrect = answer === question.correct_answer
      const points = isCorrect ? 10 : 0

      // Update score
      await prisma.gameParticipant.updateMany({
        where: {
          game_id: gameId,
          participant_id: participantId
        },
        data: {
          score: { increment: points }
        }
      })

      console.log(`📝 Answer processed: ${participantId} - ${answer} (${isCorrect ? 'Correct' : 'Incorrect'}) - +${points} points`)

      // Emit answer result
      socket.emit('answer:result', {
        isCorrect,
        points,
        correctAnswer: question.correct_answer
      })

    } catch (error) {
      console.error('❌ Error processing answer:', error)
    }
  })
  
  // Handle timer controls (for individual player testing, if needed)
  socket.on('timer:start', () => {
    console.log('⏰ Timer started by player:', socket.id)
    startTimer()
  })
  
  socket.on('timer:stop', () => {
    console.log('⏹️ Timer stopped by player:', socket.id)
    stopTimer()
  })
  
  socket.on('timer:reset', () => {
    console.log('🔄 Timer reset by player:', socket.id)
    resetTimer()
  })
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Player disconnected: ${socket.id}, reason: ${reason}`)
    if (gameState.players.has(socket.id)) {
      const player = gameState.players.get(socket.id)
      console.log(`👤 Player removed: ${player.playerName}`)
      gameState.players.delete(socket.id)
      io.emit('players:update', Array.from(gameState.players.values()))
    }
  })
})

// Admin namespace
const adminNamespace = io.of('/admin')
adminNamespace.on('connection', (socket) => {
  console.log(`👨‍💼 Admin connected: ${socket.id}`)
  
  // Send current game state to admin
  socket.emit('admin:state', {
    gameState,
    players: Array.from(gameState.players.values())
  })
  
  // Admin controls for timer
  socket.on('admin:timer:start', () => {
    console.log('👨‍💼 Admin started timer')
    startTimer()
  })
  
  socket.on('admin:timer:stop', () => {
    console.log('👨‍💼 Admin stopped timer')
    stopTimer()
  })
  
  socket.on('admin:timer:reset', () => {
    console.log('👨‍💼 Admin reset timer')
    resetTimer()
  })
  
  // Admin controls for game
  socket.on('admin:game:start', async (data) => {
    console.log('👨‍💼 Admin requested game start with participants:', data.participantIds)
    
    const result = await startGame(data.participantIds)
    
    if (result.success) {
      adminNamespace.emit('admin:message', { 
        type: 'success', 
        message: `Game started successfully with ID: ${result.gameId}` 
      })
    } else {
      adminNamespace.emit('admin:message', { 
        type: 'error', 
        message: `Failed to start game: ${result.error}` 
      })
    }
  })

  socket.on('admin:game:stop', async (data) => {
    console.log('👨‍💼 Admin requested game stop:', data.gameId)
    
    if (gameState.gameId === data.gameId) {
      await endGame(data.gameId)
      adminNamespace.emit('admin:message', { 
        type: 'info', 
        message: 'Game stopped successfully' 
      })
    } else {
      adminNamespace.emit('admin:message', { 
        type: 'error', 
        message: 'Game not found or not active' 
      })
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(`👨‍💼 Admin disconnected: ${socket.id}, reason: ${reason}`)
  })
})

const PORT = 3001
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📡 Main namespace: ws://0.0.0.0:${PORT}`)
  console.log(`👨‍💼 Admin namespace: ws://0.0.0.0:${PORT}/admin`)
  console.log(`🌐 Accessible from any IP on the network`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...')
  await prisma.$disconnect()
  process.exit(0)
})
