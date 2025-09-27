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

// Game state
let gameState = {
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

// Test Prisma connection
async function testPrisma() {
  try {
    console.log('🧪 Testing Prisma connection...')
    await prisma.$connect()
    console.log('✅ Prisma connected successfully')
    
    // Test query
    const participantCount = await prisma.participant.count()
    console.log('📊 Participants in database:', participantCount)
    
    const questionCount = await prisma.question.count()
    console.log('📊 Questions in database:', questionCount)
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error)
  }
}

// Main namespace events
mainNamespace.on('connection', (socket) => {
  console.log('✅ Player connected:', socket.id)

  socket.on('player:register', (data) => {
    console.log('👤 Player registered:', data.playerName, '(' + data.playerId + ')')
    socket.playerId = data.playerId
    socket.playerName = data.playerName
  })

  socket.on('disconnect', () => {
    console.log('❌ Player disconnected:', socket.id)
  })
})

// Admin namespace events
adminNamespace.on('connection', (socket) => {
  console.log('👨‍💼 Admin connected:', socket.id)

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

      // Test Prisma first
      console.log('🧪 Testing Prisma before game start...')
      const testParticipants = await prisma.participant.findMany({
        where: {
          id: { in: data.participantIds }
        }
      })
      console.log('✅ Found participants:', testParticipants.length)

      if (testParticipants.length < 2) {
        socket.emit('admin:message', {
          type: 'error',
          message: 'Need at least 2 participants to start a game'
        })
        return
      }

      // Get random questions
      const allQuestions = await prisma.question.findMany()
      console.log('✅ Found questions:', allQuestions.length)
      
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
      console.log('✅ Selected questions:', questions.length)

      // Create game in database
      console.log('🎮 Creating game in database...')
      const game = await prisma.game.create({
        data: {
          status: 'active',
          current_round: 0,
          started_at: new Date()
        }
      })
      console.log('✅ Game created:', game.id)

      // Create game participants
      console.log('👥 Creating game participants...')
      const gameParticipants = []
      for (let i = 0; i < testParticipants.length; i++) {
        const participant = testParticipants[i]
        try {
          console.log(`🔧 Creating game participant ${i + 1} with prisma:`, typeof prisma)
          const gameParticipant = await prisma.gameParticipant.create({
            data: {
              game_id: game.id,
              participant_id: participant.id,
              score: 0,
              position: i + 1
            }
          })
          gameParticipants.push(gameParticipant)
          console.log(`✅ Created game participant ${i + 1}:`, participant.name)
        } catch (error) {
          console.error(`❌ Error creating game participant ${i + 1}:`, error)
          console.error(`❌ Prisma type:`, typeof prisma)
          console.error(`❌ Prisma object:`, prisma)
          throw error
        }
      }

      // Create rounds
      console.log('🎯 Creating rounds...')
      const rounds = []
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        try {
          console.log(`🔧 Creating round ${i + 1} with prisma:`, typeof prisma)
          const round = await prisma.round.create({
            data: {
              game_id: game.id,
              question_id: question.id,
              round_number: i + 1,
              start_time: new Date()
            }
          })
          rounds.push(round)
          console.log(`✅ Created round ${i + 1}:`, question.text.substring(0, 50) + '...')
        } catch (error) {
          console.error(`❌ Error creating round ${i + 1}:`, error)
          console.error(`❌ Prisma type:`, typeof prisma)
          console.error(`❌ Prisma object:`, prisma)
          throw error
        }
      }

      // Update game state
      gameState = {
        isActive: true,
        gameId: game.id,
        currentRound: 0,
        totalRounds: 8,
        participants: testParticipants.map(p => ({ ...p, score: 0 })),
        questions: questions,
        currentQuestion: null,
        timeRemaining: 30,
        isRunning: false
      }

      // Start first round
      console.log('🚀 Starting first round...')
      await startRound(1)

      // Notify admin
      socket.emit('admin:message', {
        type: 'success',
        message: 'Game started successfully!'
      })

      console.log('🎮 Game started successfully with', testParticipants.length, 'participants')

    } catch (error) {
      console.error('❌ Error starting game:', error)
      socket.emit('admin:message', {
        type: 'error',
        message: 'Failed to start game: ' + error.message
      })
    }
  })

  socket.on('disconnect', () => {
    console.log('👨‍💼 Admin disconnected:', socket.id)
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

    console.log(`🎯 Round ${roundNumber} started:`, question.text)

  } catch (error) {
    console.error('❌ Error starting round:', error)
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
const PORT = 3001
httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log('🚀 Socket.IO server running on port', PORT)
  console.log('📡 Main namespace: ws://0.0.0.0:' + PORT)
  console.log('👨‍💼 Admin namespace: ws://0.0.0.0:' + PORT + '/admin')
  console.log('🌐 Accessible from any IP on the network')
  
  // Test Prisma connection
  await testPrisma()
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...')
  await prisma.$disconnect()
  process.exit(0)
})
