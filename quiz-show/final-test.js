const { spawn } = require('child_process')
const io = require('socket.io-client')
const { PrismaClient } = require('./src/generated/prisma')

console.log(`[${new Date().toISOString()}] 🚀 TESTE FINAL DO QUIZ SHOW`)
console.log('='.repeat(50))

const prisma = new PrismaClient()

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

async function main() {
  try {
    // 1. Resetar banco e criar participantes
    log('📊 Resetando banco de dados...')
    await prisma.gameParticipant.deleteMany()
    await prisma.game.deleteMany()
    await prisma.participant.deleteMany()
    
    const participants = await Promise.all([
      prisma.participant.create({
        data: { name: 'Carlos Santos', city: 'São Paulo', state: 'SP', status: 'waiting' }
      }),
      prisma.participant.create({
        data: { name: 'Maria Oliveira', city: 'Rio de Janeiro', state: 'RJ', status: 'waiting' }
      }),
      prisma.participant.create({
        data: { name: 'Pedro Costa', city: 'Belo Horizonte', state: 'MG', status: 'waiting' }
      })
    ])
    
    log('✅ Participantes criados:')
    participants.forEach(p => log(`- ${p.name} (ID: ${p.id})`))
    
    const participantIds = participants.map(p => p.id)
    
    // 2. Iniciar servidor
    log('🚀 Iniciando servidor...')
    const serverProcess = spawn('node', ['socket-server-simple.js'], { 
      cwd: '/Users/brito/Desktop/Quiz/quiz-show',
      detached: true,
      stdio: 'ignore'
    })
    serverProcess.unref()
    
    // Aguardar servidor
    await new Promise(resolve => setTimeout(resolve, 3000))
    log('✅ Servidor iniciado')
    
    // 3. Executar teste
    log('🎮 Executando simulação...')
    await runTest(participantIds)
    
    // 4. Limpar
    log('🧹 Limpando...')
    process.kill(serverProcess.pid)
    await prisma.$disconnect()
    
    log('✅ TESTE FINALIZADO COM SUCESSO!')
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`)
    await prisma.$disconnect()
    process.exit(1)
  }
}

function runTest(participantIds) {
  return new Promise((resolve, reject) => {
    const SOCKET_URL = 'http://localhost:3001'
    const ADMIN_NAMESPACE = `${SOCKET_URL}/admin`
    
    const adminSocket = io(ADMIN_NAMESPACE, { transports: ['websocket', 'polling'] })
    const mainSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    
    let gameId = null
    let currentQuestion = null
    let roundCount = 0
    let gameStarted = false
    
    // Timeout global
    const globalTimeout = setTimeout(() => {
      log('⏰ Timeout global')
      adminSocket.disconnect()
      mainSocket.disconnect()
      reject(new Error('Test timeout'))
    }, 45000)
    
    // Admin events
    adminSocket.on('connect', () => {
      log('✅ Admin conectado')
      setTimeout(() => {
        log('🚀 Iniciando partida...')
        adminSocket.emit('admin:game:start', { participantIds })
      }, 1000)
    })
    
    adminSocket.on('admin:message', (message) => {
      log(`📢 Admin: ${message.message}`)
      if (message.type === 'error') {
        clearTimeout(globalTimeout)
        adminSocket.disconnect()
        mainSocket.disconnect()
        reject(new Error(`Admin error: ${message.message}`))
      }
    })
    
    // Main events
    mainSocket.on('game:started', (data) => {
      log('🎉 PARTIDA INICIADA!')
      log(`Game ID: ${data.gameId}`)
      log(`Participantes: ${data.participants.map(p => p.name).join(', ')}`)
      log(`\n🎯 RODADA 1`)
      log(`❓ ${data.question.text}`)
      log(`A) ${data.question.optionA}`)
      log(`B) ${data.question.optionB}`)
      log(`C) ${data.question.optionC}`)
      log(`✅ Resposta correta: ${data.question.correct_answer}`)
      
      gameId = data.gameId
      currentQuestion = data.question
      gameStarted = true
      roundCount = 1
      
      // Simular respostas
      setTimeout(() => {
        simulateAnswers()
      }, 2000)
    })
    
    mainSocket.on('round:started', (data) => {
      roundCount++
      currentQuestion = data.question
      log(`\n🎯 RODADA ${data.roundNumber}`)
      log(`❓ ${data.question.text}`)
      log(`✅ Resposta correta: ${data.question.correct_answer}`)
      
      setTimeout(() => {
        simulateAnswers()
      }, 2000)
    })
    
    mainSocket.on('round:ended', (data) => {
      log(`\n🏁 RODADA ${roundCount} FINALIZADA!`)
      if (data.currentScores && data.currentScores.length > 0) {
        log('📊 Pontuações:')
        data.currentScores.forEach(p => {
          log(`  ${p.name}: ${p.score} pontos`)
        })
      }
    })
    
    mainSocket.on('game:ended', (data) => {
      log(`\n🏆 JOGO FINALIZADO!`)
      log(`🥇 Vencedor: ${data.winner ? data.winner.name : 'N/A'}`)
      if (data.finalScores && data.finalScores.length > 0) {
        log('🏅 Ranking Final:')
        data.finalScores.forEach((p, index) => {
          log(`  ${index + 1}º ${p.name}: ${p.score} pontos`)
        })
      }
      log('✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO!')
      clearTimeout(globalTimeout)
      adminSocket.disconnect()
      mainSocket.disconnect()
      resolve()
    })
    
    mainSocket.on('answer:result', (data) => {
      const participantName = getParticipantName(data.participantId, participantIds)
      log(`📝 ${participantName}: ${data.isCorrect ? 'CORRETO' : 'INCORRETO'} (${data.score} pts)`)
    })
    
    function getParticipantName(id, ids) {
      const names = ['Carlos', 'Maria', 'Pedro']
      const index = ids.indexOf(id)
      return index >= 0 ? names[index] : 'Jogador'
    }
    
    function simulateAnswers() {
      if (!gameId || !currentQuestion || !gameStarted) {
        log('⚠️ Jogo não iniciado para simular respostas')
        return
      }
      
      const answers = ['A', 'B', 'C']
      const participants = participantIds.map((id, index) => ({
        id,
        name: ['Carlos', 'Maria', 'Pedro'][index]
      }))
      
      log('👥 Jogadores respondendo...')
      
      participants.forEach((participant, index) => {
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)]
        const responseTime = Math.floor(Math.random() * 3000) + 1000
        
        setTimeout(() => {
          mainSocket.emit('player:answer', {
            gameId,
            participantId: participant.id,
            questionId: currentQuestion.id,
            answer: randomAnswer,
            responseTime
          })
          log(`👤 ${participant.name}: ${randomAnswer}`)
        }, responseTime)
      })
    }
    
    // Error handling
    adminSocket.on('connect_error', (err) => {
      log(`❌ Erro admin: ${err.message}`)
      clearTimeout(globalTimeout)
      reject(err)
    })
    
    mainSocket.on('connect_error', (err) => {
      log(`❌ Erro principal: ${err.message}`)
      clearTimeout(globalTimeout)
      reject(err)
    })
  })
}

// Executar
main().catch(console.error)
