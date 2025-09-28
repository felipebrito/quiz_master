const { io } = require('socket.io-client')

// Connect to the enhanced socket server
const socket = io('http://localhost:3001')

let gameState = {
  isActive: false,
  currentRound: 0,
  participants: [],
  scores: {}
}

// Simulate 3 players
const players = [
  { id: 'player1', name: 'Jogador 1' },
  { id: 'player2', name: 'Jogador 2' },
  { id: 'player3', name: 'Jogador 3' }
]

// Connect all players
const playerSockets = players.map(player => {
  const playerSocket = io('http://localhost:3001')
  
  playerSocket.on('connect', () => {
    console.log(`✅ ${player.name} connected`)
    playerSocket.emit('player:register', {
      playerId: player.id,
      playerName: player.name
    })
  })

  playerSocket.on('game:started', (data) => {
    console.log(`🎮 ${player.name} - Game started:`, data.gameId)
    gameState.isActive = true
    gameState.participants = data.participants
  })

  playerSocket.on('round:started', (data) => {
    console.log(`🎯 ${player.name} - Round ${data.roundNumber} started`)
    console.log(`   Question: ${data.question.text}`)
    console.log(`   Options: A) ${data.question.optionA} | B) ${data.question.optionB} | C) ${data.question.optionC}`)
    console.log(`   Difficulty: ${data.question.difficulty}`)
    
    // Simulate random answer after random delay (1-5 seconds)
    const delay = Math.random() * 4000 + 1000
    const answer = ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
    
    setTimeout(() => {
      console.log(`📝 ${player.name} answering: ${answer}`)
      playerSocket.emit('player:answer', {
        gameId: data.gameId,
        questionId: data.question.id,
        answer: answer,
        participantId: player.id,
        participantName: player.name
      })
    }, delay)
  })

  playerSocket.on('answer:result', (data) => {
    console.log(`📊 ${player.name} - Answer result:`)
    console.log(`   Answer: ${data.answer} | Correct: ${data.isCorrect} | Points: ${data.points}`)
    console.log(`   Response time: ${data.responseTime}ms | First: ${data.isFirst}`)
  })

  playerSocket.on('round:ended', (data) => {
    console.log(`🏁 ${player.name} - Round ended`)
    console.log(`   Correct answer: ${data.correctAnswer}`)
    console.log(`   Current scores:`, data.currentScores)
  })

  playerSocket.on('game:ended', (data) => {
    console.log(`🏆 ${player.name} - Game ended!`)
    console.log(`   Winner: ${data.winner.name} with ${data.winner.score} points`)
    console.log(`   Final scores:`, data.finalScores)
  })

  return playerSocket
})

// Admin socket for starting the game
const adminSocket = io('http://localhost:3001/admin')

adminSocket.on('connect', () => {
  console.log('👨‍💼 Admin connected')
  
  // Wait a bit for all players to connect
  setTimeout(async () => {
    console.log('\n🚀 Starting game with participants...')
    
    // Get participants from database first
    const { PrismaClient } = require('./src/generated/prisma')
    const prisma = new PrismaClient()
    
    try {
      const participants = await prisma.participant.findMany({
        where: { status: 'waiting' },
        take: 3
      })
      
      if (participants.length < 3) {
        console.log('❌ Not enough participants in database. Creating test participants...')
        
        // Create test participants
        const testParticipants = await Promise.all([
          prisma.participant.create({
            data: {
              name: 'Jogador 1',
              city: 'São Paulo',
              state: 'SP',
              status: 'waiting'
            }
          }),
          prisma.participant.create({
            data: {
              name: 'Jogador 2', 
              city: 'Rio de Janeiro',
              state: 'RJ',
              status: 'waiting'
            }
          }),
          prisma.participant.create({
            data: {
              name: 'Jogador 3',
              city: 'Belo Horizonte', 
              state: 'MG',
              status: 'waiting'
            }
          })
        ])
        
        console.log('✅ Test participants created')
        adminSocket.emit('admin:game:start', {
          participantIds: testParticipants.map(p => p.id)
        })
      } else {
        console.log('✅ Using existing participants:', participants.map(p => p.name))
        adminSocket.emit('admin:game:start', {
          participantIds: participants.map(p => p.id)
        })
      }
    } catch (error) {
      console.error('❌ Error getting participants:', error)
    } finally {
      await prisma.$disconnect()
    }
  }, 2000)
})

adminSocket.on('admin:message', (data) => {
  console.log('👨‍💼 Admin message:', data)
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test...')
  playerSockets.forEach(socket => socket.disconnect())
  adminSocket.disconnect()
  process.exit(0)
})

console.log('🎮 Starting complete game test...')
console.log('📡 Connecting to socket server on port 3001')
console.log('⏳ This will simulate a full 8-round game with 3 players')
console.log('🔄 Press Ctrl+C to stop the test\n')
