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
  scores: {},
  startTime: null,
  timerInterval: null,
  roundStartTime: null,
  roundTimeout: null, // Timeout for round end
  answersReceived: new Set(), // Track who has answered
  roundAnswers: new Map(), // Store answers for current round
  allQuestions: [] // Store all questions for the current game
}

// Enhanced scoring system based on speed and difficulty
function calculateScore(isCorrect, responseTime, difficulty, isFirstAnswer = false) {
  if (!isCorrect) return 0
  
  let baseScore = 10
  
  // Difficulty multiplier
  const difficultyMultipliers = {
    'easy': 1.0,
    'medium': 1.5,
    'hard': 2.0
  }
  
  baseScore *= difficultyMultipliers[difficulty] || 1.0
  
  // Speed bonus (faster = more points)
  const maxTime = 30000 // 30 seconds
  const timeBonus = Math.max(0, (maxTime - responseTime) / maxTime)
  const speedBonus = Math.floor(baseScore * timeBonus * 0.5) // Up to 50% bonus
  
  // First answer bonus
  const firstAnswerBonus = isFirstAnswer ? Math.floor(baseScore * 0.3) : 0
  
  const totalScore = Math.floor(baseScore + speedBonus + firstAnswerBonus)
  
  console.log(`🎯 Score calculation: base=${baseScore}, speed=${speedBonus}, first=${firstAnswerBonus}, total=${totalScore}`)
  
  return totalScore
}

// Carregar jogo ativo do banco de dados na inicialização
async function loadActiveGame() {
  try {
    const activeGame = await prisma.game.findFirst({
      where: { status: 'active' },
      include: {
        participants: {
          include: {
            participant: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    if (activeGame) {
      console.log('🎮 Carregando jogo ativo:', activeGame.id)
      gameState.isActive = true
      gameState.gameId = activeGame.id
      gameState.currentRound = activeGame.current_round
      gameState.participants = activeGame.participants.map(gp => ({
        id: gp.participant.id,
        name: gp.participant.name,
        score: gp.score
      }))
    }
  } catch (error) {
    console.error('❌ Erro ao carregar jogo ativo:', error)
  }
}

// Timer functions
function startTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval)
  }

  gameState.isRunning = true
  gameState.startTime = Date.now()
  gameState.roundStartTime = Date.now()

  gameState.timerInterval = setInterval(() => {
    if (gameState.timeRemaining > 0) {
      gameState.timeRemaining--
      
      // Emit timer update to all clients
      io.emit('timer:update', {
        timeRemaining: gameState.timeRemaining,
        isRunning: gameState.isRunning
      })

      // Emit to admin namespace
      adminIo.emit('game:timer:update', {
        timeRemaining: gameState.timeRemaining,
        isRunning: gameState.isRunning
      })
    } else {
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

// Game logic functions
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

    // Get random questions - exactly 8 for full game
    const allQuestions = await prisma.question.findMany()
    if (allQuestions.length < 8) {
      throw new Error('Not enough questions in database')
    }
    
    const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random())
    const questions = shuffledQuestions.slice(0, 8)

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
    gameState.participants = participants.map(p => ({ ...p, score: 0 }))
    gameState.currentRound = 0
    gameState.scores = {}
    gameState.answersReceived.clear()
    gameState.roundAnswers.clear()
    gameState.allQuestions = allQuestions

    // Notify all clients
    io.emit('game:started', {
      gameId: game.id,
      participants: gameState.participants.map(p => ({
        id: p.id,
        name: p.name,
        score: 0
      })),
      currentRound: 0,
      totalRounds: 8,
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

    // Reset round state
    gameState.answersReceived.clear()
    gameState.roundAnswers.clear()
    gameState.currentRound = roundNumber
    gameState.currentQuestion = question
    gameState.timeRemaining = 30
    gameState.isRunning = true
    gameState.roundStartTime = Date.now()

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

    // Emit to admin namespace
    adminIo.emit('game:round:started', {
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
      },
      timeRemaining: 30
    })

    // Set timeout for round to end (always wait full time)
    gameState.roundTimeout = setTimeout(() => {
      endRound(gameId, allQuestions, roundIndex)
    }, 30000) // 30 seconds

  } catch (error) {
    console.error('❌ Error starting round:', error)
  }
}

async function endRound(gameId, allQuestions, roundIndex) {
  try {
    stopTimer()
    
    // Clear round timeout
    if (gameState.roundTimeout) {
      clearTimeout(gameState.roundTimeout)
      gameState.roundTimeout = null
    }
    
    console.log(`🏁 Round ${roundIndex + 1} ended.`)

    // Process all answers received
    const roundAnswers = Array.from(gameState.roundAnswers.values())
    const correctAnswers = roundAnswers.filter(a => a.isCorrect)
    const firstCorrectAnswer = correctAnswers.length > 0 ? correctAnswers[0] : null

    // Update scores in database
    for (const answer of roundAnswers) {
      await prisma.gameParticipant.updateMany({
        where: {
          game_id: gameId,
          participant_id: answer.participantId
        },
        data: {
          score: { increment: answer.points }
        }
      })
    }

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

    // Update game state scores
    gameState.participants = currentScores

    // Emit round ended event with detailed results
    io.emit('round:ended', {
      gameId,
      roundNumber: roundIndex + 1,
      correctAnswer: gameState.currentQuestion.correct_answer,
      explanation: `Resposta correta: ${gameState.currentQuestion.correct_answer}`,
      currentScores: currentScores,
      roundResults: roundAnswers.map(a => ({
        participantId: a.participantId,
        participantName: a.participantName,
        answer: a.answer,
        isCorrect: a.isCorrect,
        points: a.points,
        responseTime: a.responseTime,
        isFirst: a.isFirst
      }))
    })

    // Emit to admin namespace
    adminIo.emit('game:round:ended', {
      gameId,
      roundNumber: roundIndex + 1,
      correctAnswer: gameState.currentQuestion.correct_answer,
      currentScores: currentScores,
      roundResults: roundAnswers.map(a => ({
        participantId: a.participantId,
        participantName: a.participantName,
        answer: a.answer,
        isCorrect: a.isCorrect,
        points: a.points,
        responseTime: a.responseTime,
        isFirst: a.isFirst
      }))
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

    // Get final scores
    const gameParticipants = await prisma.gameParticipant.findMany({
      where: { game_id: gameId },
      include: { participant: true },
      orderBy: { score: 'desc' }
    })

    const finalScores = gameParticipants.map(gp => ({
      id: gp.participant.id,
      name: gp.participant.name,
      score: gp.score,
      position: gameParticipants.indexOf(gp) + 1
    }))

    const winner = finalScores[0]

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
      where: { id: { in: finalScores.map(s => s.id) } },
      data: { status: 'finished' }
    })

    // Emit game ended event
    io.emit('game:ended', {
      gameId,
      winner: winner,
      finalScores: finalScores
    })

    // Emit to admin namespace
    adminIo.emit('game:ended', {
      gameId,
      winner: winner,
      finalScores: finalScores
    })

    console.log('🏆 Game ended. Winner:', winner.name, 'with', winner.score, 'points')

  } catch (error) {
    console.error('❌ Error ending game:', error)
  }
}

// Main namespace events
io.on('connection', (socket) => {
  console.log('✅ Player connected:', socket.id)

  socket.on('player:register', (data) => {
    socket.playerId = data.playerId
    socket.playerName = data.playerName
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

      if (!gameState.isRunning) {
        socket.emit('answer:result', { 
          success: false, 
          message: 'Round not active' 
        })
        return
      }

      // Check if participant already answered this round
      if (gameState.answersReceived.has(data.participantId)) {
        socket.emit('answer:result', { 
          success: false, 
          message: 'Already answered this round' 
        })
        return
      }

      // Calculate response time
      const responseTime = Date.now() - gameState.roundStartTime
      
      // Check if answer is correct
      const isCorrect = data.answer === gameState.currentQuestion.correct_answer
      
      // Check if this is the first correct answer
      const isFirstCorrect = isCorrect && !Array.from(gameState.roundAnswers.values()).some(a => a.isCorrect)
      
      // Calculate score
      const points = calculateScore(
        isCorrect, 
        responseTime, 
        gameState.currentQuestion.difficulty,
        isFirstCorrect
      )

      // Store answer
      const answerData = {
        participantId: data.participantId,
        participantName: data.participantName || 'Unknown',
        answer: data.answer,
        isCorrect: isCorrect,
        points: points,
        responseTime: responseTime,
        isFirst: isFirstCorrect,
        timestamp: Date.now()
      }

      gameState.roundAnswers.set(data.participantId, answerData)
      gameState.answersReceived.add(data.participantId)

      // Update participant score in memory
      const participant = gameState.participants.find(p => p.id === data.participantId)
      if (participant) {
        participant.score += points
      }

      // Emit immediate result to the answering player
      socket.emit('answer:result', {
        success: true,
        participantId: data.participantId,
        participantName: answerData.participantName,
        answer: data.answer,
        correctAnswer: gameState.currentQuestion.correct_answer,
        isCorrect: isCorrect,
        points: points,
        responseTime: responseTime,
        isFirst: isFirstCorrect
      })

      // Broadcast to all players (without revealing correct answer yet)
      io.emit('answer:received', {
        participantId: data.participantId,
        participantName: answerData.participantName,
        responseTime: responseTime,
        isCorrect: isCorrect
      })

      // Emit to admin namespace
      adminIo.emit('game:answer:received', {
        participantId: data.participantId,
        participantName: answerData.participantName,
        answer: data.answer,
        isCorrect: isCorrect,
        responseTime: responseTime,
        points: points
      })

      console.log(`📊 ${answerData.participantName} answered ${data.answer}, correct: ${isCorrect}, points: ${points}, time: ${responseTime}ms`)

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
  })
})

// Admin namespace events
adminIo.on('connection', (socket) => {
  console.log('👨‍💼 Admin connected:', socket.id)

  socket.on('admin:game:start', async (data) => {
    try {
      const result = await startGame(data.participantIds)
      socket.emit('admin:message', result)
    } catch (error) {
      console.error('❌ Error starting game:', error)
      socket.emit('admin:message', { 
        success: false, 
        error: error.message 
      })
    }
  })

  socket.on('admin:game:stop', async () => {
    try {
      if (gameState.isActive && gameState.gameId) {
        await endGame(gameState.gameId)
        socket.emit('admin:message', { 
          success: true, 
          message: 'Game stopped successfully' 
        })
      } else {
        socket.emit('admin:message', { 
          success: false, 
          message: 'No active game to stop' 
        })
      }
    } catch (error) {
      console.error('❌ Error stopping game:', error)
      socket.emit('admin:message', { 
        success: false, 
        error: error.message 
      })
    }
  })

  socket.on('admin:round:end', () => {
    try {
      console.log('⏭️ Admin ending current round')
      if (gameState.isActive && gameState.isRunning) {
        // Clear current round timeout
        if (gameState.roundTimeout) {
          clearTimeout(gameState.roundTimeout)
          gameState.roundTimeout = null
        }
        
        // End current round immediately
        const allQuestions = gameState.allQuestions || []
        const currentRoundIndex = gameState.currentRound - 1
        endRound(gameState.gameId, allQuestions, currentRoundIndex)
        
        socket.emit('admin:message', { success: true, message: 'Rodada finalizada' })
      } else {
        socket.emit('admin:message', { success: false, error: 'Nenhuma rodada ativa' })
      }
    } catch (error) {
      console.error('❌ Error ending round:', error)
      socket.emit('admin:message', { success: false, error: error.message })
    }
  })

  socket.on('admin:game:new', () => {
    try {
      console.log('🆕 Admin requesting new game')
      // Reset game state
      gameState.isActive = false
      gameState.gameId = null
      gameState.participants = []
      gameState.currentRound = 0
      gameState.currentQuestion = null
      gameState.timeRemaining = 30
      gameState.isRunning = false
      gameState.scores = {}
      gameState.startTime = null
      gameState.roundStartTime = null
      gameState.roundTimeout = null
      gameState.answersReceived.clear()
      gameState.roundAnswers.clear()
      
      // Stop timer if running
      stopTimer()
      
      socket.emit('admin:message', { success: true, message: 'Estado do jogo resetado. Pronto para nova partida.' })
    } catch (error) {
      console.error('❌ Error resetting game:', error)
      socket.emit('admin:message', { success: false, error: error.message })
    }
  })

  socket.on('disconnect', () => {
    console.log('👨‍💼 Admin disconnected:', socket.id)
  })
})

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📡 Main namespace: ws://0.0.0.0:${PORT}`)
  console.log(`👨‍💼 Admin namespace: ws://0.0.0.0:${PORT}/admin`)
  console.log(`🌐 Accessible from any IP on the network`)
  
  // Load any active game on startup
  await loadActiveGame()
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...')
  stopTimer()
  await prisma.$disconnect()
  process.exit(0)
})
