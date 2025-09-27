const { PrismaClient } = require('./src/generated/prisma')
const io = require('socket.io-client')

const prisma = new PrismaClient()

// Conectar ao Socket.IO
const socket = io('http://localhost:3001')

async function simulateGame() {
  try {
    console.log('🎮 Iniciando simulação de partida...')
    
    // Aguardar conexão
    socket.on('connect', async () => {
      console.log('✅ Conectado ao Socket.IO')
      
      // 1. Buscar participantes
      const participants = await prisma.participant.findMany({
        where: { status: 'waiting' },
        take: 3
      })
      
      if (participants.length < 3) {
        console.log('❌ Não há participantes suficientes. Precisa de pelo menos 3.')
        return
      }
      
      console.log(`👥 Participantes selecionados: ${participants.map(p => p.name).join(', ')}`)
      
      // 2. Simular início da partida
      console.log('🚀 Iniciando partida...')
      socket.emit('admin:game:start', {
        participantIds: participants.map(p => p.id)
      })
      
      // 3. Aguardar confirmação
      socket.on('game:started', (data) => {
        console.log('🎯 Partida iniciada!', data)
        
        // Simular respostas dos jogadores
        setTimeout(() => {
          simulatePlayerAnswers(participants, data.gameId)
        }, 2000)
      })
      
      // 4. Aguardar fim da partida
      socket.on('game:ended', (data) => {
        console.log('🏆 Partida finalizada!', data)
        console.log(`🥇 Vencedor: ${data.winner.name} com ${data.winner.score} pontos`)
        
        // Mostrar ranking final
        showFinalRanking(data.finalScores)
        
        process.exit(0)
      })
    })
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error)
    process.exit(1)
  }
}

async function simulatePlayerAnswers(participants, gameId) {
  console.log('📝 Simulando respostas dos jogadores...')
  
  // Buscar perguntas do jogo
  const questions = await prisma.question.findMany({
    take: 8,
    orderBy: { id: 'asc' }
  })
  
  for (let round = 0; round < 8; round++) {
    const question = questions[round]
    console.log(`\n🎯 Rodada ${round + 1}/8: ${question.text}`)
    console.log(`   A) ${question.option_a}`)
    console.log(`   B) ${question.option_b}`)
    console.log(`   C) ${question.option_c}`)
    console.log(`   Resposta correta: ${question.correct_answer}`)
    
    // Simular respostas dos jogadores
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i]
      
      // Simular tempo de resposta (1-25 segundos)
      const responseTime = Math.floor(Math.random() * 25000) + 1000
      
      // Simular acerto (70% de chance)
      const isCorrect = Math.random() < 0.7
      const answer = isCorrect ? question.correct_answer : 
        ['A', 'B', 'C'].filter(opt => opt !== question.correct_answer)[Math.floor(Math.random() * 2)]
      
      setTimeout(() => {
        console.log(`   👤 ${participant.name}: ${answer} (${isCorrect ? '✅' : '❌'}) - ${responseTime}ms`)
        
        socket.emit('player:answer', {
          gameId,
          participantId: participant.id,
          questionId: question.id,
          answer,
          responseTime
        })
      }, responseTime)
    }
    
    // Aguardar fim da rodada
    await new Promise(resolve => setTimeout(resolve, 30000))
  }
}

function showFinalRanking(scores) {
  console.log('\n🏆 RANKING FINAL:')
  console.log('================')
  
  scores.forEach((participant, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'
    console.log(`${medal} ${index + 1}º lugar: ${participant.name} - ${participant.score} pontos`)
  })
}

// Iniciar simulação
simulateGame()
