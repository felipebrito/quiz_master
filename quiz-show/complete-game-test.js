const { spawn } = require('child_process')
const io = require('socket.io-client')
const { PrismaClient } = require('./src/generated/prisma')

console.log(`[${new Date().toISOString()}] 🎮 TESTE COMPLETO - 6 RODADAS COM ESTATÍSTICAS`)
console.log('='.repeat(70))

const prisma = new PrismaClient()

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

async function main() {
  try {
    // 1. Resetar banco e criar participantes com fotos
    log('📊 Preparando banco de dados...')
    await prisma.gameParticipant.deleteMany()
    await prisma.game.deleteMany()
    await prisma.participant.deleteMany()
    
    const participants = await Promise.all([
      prisma.participant.create({
        data: { 
          name: 'Carlos Santos', 
          city: 'São Paulo', 
          state: 'SP', 
          status: 'waiting',
          photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        }
      }),
      prisma.participant.create({
        data: { 
          name: 'Maria Oliveira', 
          city: 'Rio de Janeiro', 
          state: 'RJ', 
          status: 'waiting',
          photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        }
      }),
      prisma.participant.create({
        data: { 
          name: 'Pedro Costa', 
          city: 'Belo Horizonte', 
          state: 'MG', 
          status: 'waiting',
          photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        }
      })
    ])
    
    log('✅ Participantes criados com fotos:')
    participants.forEach(p => log(`- ${p.name} (ID: ${p.id}) - Foto: ${p.photo_url}`))
    
    const participantIds = participants.map(p => p.id)
    
    // 2. Iniciar servidor
    log('🚀 Iniciando servidor...')
    const serverProcess = spawn('node', ['socket-server-simple.js'], { 
      cwd: '/Users/brito/Desktop/Quiz/quiz-show',
      detached: true,
      stdio: 'ignore'
    })
    serverProcess.unref()
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    log('✅ Servidor iniciado')
    
    // 3. Executar jogo completo
    log('🎮 Iniciando jogo completo de 6 rodadas...')
    await runCompleteGame(participantIds, participants)
    
    // 4. Limpar
    log('🧹 Finalizando...')
    process.kill(serverProcess.pid)
    await prisma.$disconnect()
    
    log('✅ TESTE COMPLETO FINALIZADO!')
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`)
    await prisma.$disconnect()
    process.exit(1)
  }
}

function runCompleteGame(participantIds, participants) {
  return new Promise((resolve, reject) => {
    const SOCKET_URL = 'http://localhost:3001'
    const ADMIN_NAMESPACE = `${SOCKET_URL}/admin`
    
    const adminSocket = io(ADMIN_NAMESPACE, { transports: ['websocket', 'polling'] })
    const mainSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    
    let gameId = null
    let currentQuestion = null
    let roundCount = 0
    let gameStarted = false
    let gameStats = {
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        city: p.city,
        state: p.state,
        photo_url: p.photo_url,
        score: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        totalAnswers: 0,
        answers: []
      })),
      rounds: []
    }
    
    // Timeout global
    const globalTimeout = setTimeout(() => {
      log('⏰ Timeout global')
      adminSocket.disconnect()
      mainSocket.disconnect()
      reject(new Error('Test timeout'))
    }, 300000) // 5 minutos
    
    // Admin events
    adminSocket.on('connect', () => {
      log('✅ Admin conectado')
      setTimeout(() => {
        log('🚀 Iniciando partida de 6 rodadas...')
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
      
      gameId = data.gameId
      currentQuestion = data.question
      gameStarted = true
      roundCount = 1
      
      log(`\n🎯 RODADA ${roundCount}`)
      log(`❓ ${data.question.text}`)
      log(`A) ${data.question.optionA}`)
      log(`B) ${data.question.optionB}`)
      log(`C) ${data.question.optionC}`)
      log(`✅ Resposta correta: ${data.question.correct_answer}`)
      
      // Simular respostas de todos os jogadores
      setTimeout(() => {
        simulateAllAnswers()
      }, 2000)
    })
    
    mainSocket.on('round:started', (data) => {
      roundCount++
      currentQuestion = data.question
      log(`\n🎯 RODADA ${data.roundNumber}`)
      log(`❓ ${data.question.text}`)
      log(`A) ${data.question.optionA}`)
      log(`B) ${data.question.optionB}`)
      log(`C) ${data.question.optionC}`)
      log(`✅ Resposta correta: ${data.question.correct_answer}`)
      
      // Simular respostas de todos os jogadores
      setTimeout(() => {
        simulateAllAnswers()
      }, 2000)
    })
    
    mainSocket.on('round:ended', (data) => {
      log(`\n🏁 RODADA ${roundCount} FINALIZADA!`)
      if (data.currentScores && data.currentScores.length > 0) {
        log('📊 Pontuações atuais:')
        data.currentScores.forEach(p => {
          const participant = gameStats.participants.find(part => part.id === p.id)
          if (participant) {
            participant.score = p.score
          }
          log(`  ${p.name}: ${p.score} pontos`)
        })
      }
      
      // Salvar estatísticas da rodada
      if (currentQuestion) {
        gameStats.rounds.push({
          roundNumber: roundCount,
          question: currentQuestion.text,
          correctAnswer: currentQuestion.correct_answer,
          participants: data.currentScores.map(p => ({
            name: p.name,
            score: p.score
          }))
        })
      }
    })
    
    mainSocket.on('game:ended', (data) => {
      log(`\n🏆 JOGO FINALIZADO!`)
      
      // Encontrar campeão
      const champion = gameStats.participants.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      )
      
      log(`\n🥇 CAMPEÃO: ${champion.name.toUpperCase()}`)
      log(`🏆 Pontuação: ${champion.score} pontos`)
      log(`📸 Foto: ${champion.photo_url}`)
      log(`📍 Local: ${champion.city}, ${champion.state}`)
      
      // Exibir ranking final
      log(`\n🏅 RANKING FINAL:`)
      const sortedParticipants = gameStats.participants.sort((a, b) => b.score - a.score)
      sortedParticipants.forEach((p, index) => {
        log(`  ${index + 1}º ${p.name}: ${p.score} pontos`)
      })
      
      // Exibir estatísticas detalhadas
      log(`\n📊 ESTATÍSTICAS DETALHADAS:`)
      gameStats.participants.forEach(participant => {
        log(`\n👤 ${participant.name}:`)
        log(`  📍 ${participant.city}, ${participant.state}`)
        log(`  🏆 Pontuação final: ${participant.score} pontos`)
        log(`  ✅ Respostas corretas: ${participant.correctAnswers}`)
        log(`  ❌ Respostas incorretas: ${participant.wrongAnswers}`)
        log(`  📈 Taxa de acerto: ${participant.totalAnswers > 0 ? Math.round((participant.correctAnswers / participant.totalAnswers) * 100) : 0}%`)
        
        if (participant.answers.length > 0) {
          log(`  📝 Respostas por rodada:`)
          participant.answers.forEach((answer, index) => {
            log(`    Rodada ${index + 1}: ${answer.answer} ${answer.isCorrect ? '✅' : '❌'}`)
          })
        }
      })
      
      // Exibir resumo das perguntas
      log(`\n📚 RESUMO DAS PERGUNTAS:`)
      gameStats.rounds.forEach(round => {
        log(`\n🎯 Rodada ${round.roundNumber}:`)
        log(`  ❓ ${round.question}`)
        log(`  ✅ Resposta correta: ${round.correctAnswer}`)
        log(`  📊 Pontuações: ${round.participants.map(p => `${p.name}: ${p.score}`).join(', ')}`)
      })
      
      log(`\n✅ JOGO COMPLETO FINALIZADO COM SUCESSO!`)
      clearTimeout(globalTimeout)
      adminSocket.disconnect()
      mainSocket.disconnect()
      resolve()
    })
    
    mainSocket.on('answer:result', (data) => {
      const participant = gameStats.participants.find(p => p.id === data.participantId)
      if (participant) {
        participant.score = data.score
        participant.totalAnswers++
        if (data.isCorrect) {
          participant.correctAnswers++
        } else {
          participant.wrongAnswers++
        }
        
        // Encontrar a resposta atual na lista
        const currentAnswer = participant.answers.find(a => a.roundNumber === roundCount)
        if (currentAnswer) {
          currentAnswer.isCorrect = data.isCorrect
        }
        
        log(`📝 ${participant.name}: ${data.isCorrect ? 'CORRETO' : 'INCORRETO'} (${data.score} pts)`)
      }
    })
    
    function simulateAllAnswers() {
      if (!gameId || !currentQuestion || !gameStarted) {
        log('⚠️ Jogo não iniciado para simular respostas')
        return
      }
      
      const answers = ['A', 'B', 'C']
      const participants = gameStats.participants
      
      log('👥 Todos os jogadores respondendo...')
      
      participants.forEach((participant, index) => {
        const randomAnswer = answers[Math.floor(Math.random() * answers.length)]
        const responseTime = Math.floor(Math.random() * 3000) + 500 // 0.5-3.5 segundos
        
        // Registrar a resposta
        participant.answers.push({
          roundNumber: roundCount,
          answer: randomAnswer,
          isCorrect: null // Será preenchido no answer:result
        })
        
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
