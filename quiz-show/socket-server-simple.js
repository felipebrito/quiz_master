const { Server } = require('socket.io')
const { createServer } = require('http')
const { PrismaClient } = require('./src/generated/prisma')

// Initialize Prisma
const prisma = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const adminIo = io.of('/admin')

let gameState = {
  isActive: false,
  gameId: null,
  participants: [],
  currentRound: 0,
  currentQuestion: null,
  timeRemaining: 30,
  isRunning: false,
  scores: {}
}

// Timer functions
function startTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval)
  }
  gameState.isRunning = true
  gameState.timerInterval = setInterval(() => {
    gameState.timeRemaining--
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
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval)
    gameState.timerInterval = null
  }
  gameState.isRunning = false
}

function resetTimer() {
  stopTimer()
  gameState.timeRemaining = 30
  io.emit('timer:update', {
    timeRemaining: gameState.timeRemaining,
    isRunning: gameState.isRunning
  })
}

// Game logic
async function startGame(participantIds) {
  try {
    console.log('🎮 Starting game with participants:', participantIds)

    // Validate participants
    if (!participantIds || participantIds.length !== 3) {
      throw new Error('Exactly 3 participants required')
    }

    // Check participants exist and are waiting
    const participants = await prisma.participant.findMany({
      where: {
        id: { in: participantIds },
        status: 'waiting'
      }
    })

    console.log('📊 Found participants:', participants.length)
    participants.forEach(p => {
      console.log(`  - ${p.name} (${p.id}) - Status: ${p.status}`)
    })

    if (participants.length !== 3) {
      throw new Error('Some participants not found or not available')
    }

    // Get random questions - exactly 6 for this test
    const allQuestions = await prisma.question.findMany()
    if (allQuestions.length < 6) {
      throw new Error('Not enough questions in database')
    }
    
    const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random())
    const questions = shuffledQuestions.slice(0, 6)

    // Create game
    const game = await prisma.game.create({
      data: {
        status: 'active',
        current_round: 0,
        started_at: new Date()
      }
    })

    // Create game participants
    const gameParticipants = []
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i]
      const gameParticipant = await prisma.gameParticipant.create({
        data: {
          game_id: game.id,
          participant_id: participant.id,
          score: 0,
          position: i + 1
        }
      })
      gameParticipants.push(gameParticipant)
    }

    // Update participant status
    await prisma.participant.updateMany({
      where: { id: { in: participantIds } },
      data: { status: 'playing' }
    })

    // Update game state
    gameState.isActive = true
    gameState.gameId = game.id
    gameState.participants = participants.map(p => p.id)
    gameState.currentRound = 0
    gameState.currentQuestion = questions[0]
    gameState.scores = participants.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})

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
      totalRounds: questions.length,
      currentRound: 1,
      question: {
        id: questions[0].id,
        text: questions[0].text,
        optionA: questions[0].option_a,
        optionB: questions[0].option_b,
        optionC: questions[0].option_c,
        correct_answer: questions[0].correct_answer,
        difficulty: questions[0].difficulty
      }
    })

    // Start first round
    startRound(game.id, questions, 0)

    return { success: true, gameId: game.id }

  } catch (error) {
    console.error('❌ Error starting game:', error)
    return { success: false, error: error.message }
  }
}

async function startRound(gameId, allQuestions, roundIndex) {
  try {
    if (roundIndex >= allQuestions.length) {
      console.log('🏁 All rounds completed. Ending game...')
      endGame(gameId)
      return
    }

    const question = allQuestions[roundIndex]
    const roundNumber = roundIndex + 1
    console.log(`🎯 Starting round ${roundNumber}:`, question.text)

    // Update game state
    gameState.currentRound = roundNumber
    gameState.currentQuestion = question
    gameState.timeRemaining = 30
    gameState.isRunning = true

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
        correct_answer: question.correct_answer,
        difficulty: question.difficulty
      }
    })

    // Set timeout for round to end (reduced to 10 seconds for testing)
    setTimeout(() => {
      endRound(gameId, allQuestions, roundIndex)
    }, 10000) // 10 seconds instead of 30

  } catch (error) {
    console.error('❌ Error starting round:', error)
  }
}

async function endRound(gameId, allQuestions, roundIndex) {
  try {
    stopTimer()
    console.log(`🏁 Round ${roundIndex + 1} ended.`)

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
      correctAnswer: gameState.currentQuestion.correct_answer,
      explanation: `Resposta correta: ${gameState.currentQuestion.correct_answer}`,
      currentScores: currentScores
    })

    // Move to next round
    startRound(gameId, allQuestions, roundIndex + 1)

  } catch (error) {
    console.error('❌ Error ending round:', error)
  }
}

async function endGame(gameId) {
  try {
    stopTimer()
    gameState.isActive = false
    gameState.gameId = null
    gameState.currentRound = 0
    gameState.currentQuestion = null
    gameState.timeRemaining = 30
    gameState.isRunning = false

    // Get final scores
    const gameParticipants = await prisma.gameParticipant.findMany({
      where: { game_id: gameId },
      include: { participant: true }
    })

    const finalScores = gameParticipants.map(gp => ({
      id: gp.participant.id,
      name: gp.participant.name,
      score: gp.score
    }))

    // Find winner
    const winner = finalScores.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    )

    // Update game status
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'finished',
        ended_at: new Date(),
        winner_id: winner.id
      }
    })

    // Update participant status
    await prisma.participant.updateMany({
      where: { id: { in: gameState.participants } },
      data: { status: 'waiting' }
    })

    io.emit('game:ended', {
      gameId,
      finalScores: finalScores.sort((a, b) => b.score - a.score),
      winner: winner
    })

    console.log('🏆 Game ended! Winner:', winner.name)

  } catch (error) {
    console.error('❌ Error ending game:', error)
  }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('✅ Player connected:', socket.id)

  socket.on('player:answer', async (data) => {
    if (!gameState.isActive) {
      console.log('❌ Answer received for inactive game')
      return
    }

    console.log(`📝 Player ${data.participantId} answered ${data.answer} for question ${data.questionId}`)
    
    // Check if answer is correct
    const question = gameState.currentQuestion
    if (question && data.questionId === question.id && data.answer === question.correct_answer) {
      // Update score in database
      await prisma.gameParticipant.updateMany({
        where: {
          game_id: data.gameId,
          participant_id: data.participantId
        },
        data: {
          score: { increment: 10 }
        }
      })

      gameState.scores[data.participantId] = (gameState.scores[data.participantId] || 0) + 10
      
      io.emit('answer:result', {
        participantId: data.participantId,
        isCorrect: true,
        score: gameState.scores[data.participantId]
      })
    } else {
      io.emit('answer:result', {
        participantId: data.participantId,
        isCorrect: false,
        score: gameState.scores[data.participantId] || 0
      })
    }
  })

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() })
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ Player disconnected:', socket.id, 'reason:', reason)
  })
})

adminIo.on('connection', (socket) => {
  console.log('👨‍💼 Admin connected:', socket.id)

  socket.on('admin:game:start', async (data) => {
    console.log('👨‍💼 Admin requested game start with participants:', data.participantIds)
    const result = await startGame(data.participantIds)
    if (result.success) {
      socket.emit('admin:message', { type: 'success', message: `Game started successfully with ID: ${result.gameId}` })
    } else {
      socket.emit('admin:message', { type: 'error', message: `Failed to start game: ${result.error}` })
    }
  })

  socket.on('admin:game:stop', async () => {
    console.log('👨‍💼 Admin requested game stop')
    if (gameState.isActive && gameState.gameId) {
      await endGame(gameState.gameId)
      socket.emit('admin:message', { type: 'success', message: 'Game stopped successfully' })
    } else {
      socket.emit('admin:message', { type: 'info', message: 'No active game to stop' })
    }
  })

  socket.on('admin:timer:start', () => {
    console.log('👨‍💼 Admin requested timer start')
    startTimer()
    socket.emit('admin:message', { type: 'info', message: 'Timer started' })
  })

  socket.on('admin:timer:stop', () => {
    console.log('👨‍💼 Admin requested timer stop')
    stopTimer()
    socket.emit('admin:message', { type: 'info', message: 'Timer stopped' })
  })

  socket.on('admin:timer:reset', () => {
    console.log('👨‍💼 Admin requested timer reset')
    resetTimer()
    socket.emit('admin:message', { type: 'info', message: 'Timer reset' })
  })

  socket.on('admin:ping', () => {
    socket.emit('admin:pong', { timestamp: Date.now(), namespace: 'admin' })
  })

  socket.on('disconnect', (reason) => {
    console.log('👨‍💼 Admin disconnected:', socket.id, 'reason:', reason)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📡 Main namespace: ws://0.0.0.0:${PORT}`)
  console.log(`👨‍💼 Admin namespace: ws://0.0.0.0:${PORT}/admin`)
  console.log('🌐 Accessible from any IP on the network')
})
