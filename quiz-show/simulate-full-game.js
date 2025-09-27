const io = require('socket.io-client')
const SOCKET_URL = 'http://localhost:3001'
const ADMIN_NAMESPACE = `${SOCKET_URL}/admin`

const mainSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
const adminSocket = io(ADMIN_NAMESPACE, { transports: ['websocket', 'polling'] })

let gameId = null
let currentQuestion = null
let gameStarted = false
let roundNumber = 1
let totalRounds = 8
let gameStats = {
  rounds: [],
  participants: [],
  winner: null,
  totalQuestions: 0,
  correctAnswers: 0,
  averageResponseTime: 0
}

console.log('🎮 SIMULAÇÃO COMPLETA DO QUIZ SHOW')
console.log('=====================================')

mainSocket.on('connect', () => {
  console.log('✅ Conectado ao Socket.IO principal')
})

adminSocket.on('connect', () => {
  console.log('✅ Conectado ao namespace Admin')
  
  // Simular início de partida após 2 segundos
  setTimeout(() => {
    console.log('🚀 Iniciando partida com 3 jogadores...')
    adminSocket.emit('admin:game:start', {
      participantIds: [
        'cmg29pw460002yitn0t2bp9kz', // Carlos Santos
        'cmg29pw460000yitnopxjrmvc', // Maria Oliveira
        'cmg29pw460001yitnqeg14jke'  // Pedro Costa
      ]
    })
  }, 2000)
})

mainSocket.on('game:started', (data) => {
  console.log('🎉 PARTIDA INICIADA!')
  console.log('📊 Dados da partida:', JSON.stringify(data, null, 2))
  gameId = data.gameId
  currentQuestion = data.question
  gameStarted = true
  gameStats.participants = data.participants.map(p => ({
    id: p.id,
    name: p.name,
    score: 0,
    correctAnswers: 0,
    totalResponseTime: 0
  }))
  
  console.log(`🎯 Rodada ${roundNumber} iniciada!`)
  console.log(`❓ Pergunta: ${currentQuestion.text}`)
  console.log(`A) ${currentQuestion.optionA}`)
  console.log(`B) ${currentQuestion.optionB}`)
  console.log(`C) ${currentQuestion.optionC}`)
  console.log(`✅ Resposta correta: ${currentQuestion.correct_answer}`)
  
  // Simular respostas após 5 segundos
  setTimeout(() => {
    simulatePlayerAnswers()
  }, 5000)
})

mainSocket.on('round:started', (data) => {
  console.log(`\n🎯 RODADA ${data.roundNumber} INICIADA!`)
  console.log(`❓ Pergunta: ${data.question.text}`)
  console.log(`A) ${data.question.optionA}`)
  console.log(`B) ${data.question.optionB}`)
  console.log(`C) ${data.question.optionC}`)
  console.log(`✅ Resposta correta: ${data.question.correct_answer}`)
  
  currentQuestion = data.question
  roundNumber = data.roundNumber
  
  // Simular respostas após 5 segundos
  setTimeout(() => {
    simulatePlayerAnswers()
  }, 5000)
})

mainSocket.on('round:ended', (data) => {
  console.log(`\n🏁 RODADA ${roundNumber} FINALIZADA!`)
  console.log('📊 Pontuações atuais:')
  data.currentScores.forEach(participant => {
    const stats = gameStats.participants.find(p => p.id === participant.id)
    if (stats) {
      stats.score = participant.score
      console.log(`  ${participant.name}: ${participant.score} pontos`)
    }
  })
  
  // Salvar estatísticas da rodada
  if (currentQuestion) {
    gameStats.rounds.push({
      roundNumber: roundNumber,
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
  console.log('\n🏆 PARTIDA FINALIZADA!')
  console.log('====================')
  console.log(`🥇 VENCEDOR: ${data.winner.name} com ${data.winner.score} pontos!`)
  console.log('\n📊 RANKING FINAL:')
  data.finalScores.forEach((participant, index) => {
    console.log(`${index + 1}º ${participant.name}: ${participant.score} pontos`)
  })
  
  // Calcular estatísticas finais
  gameStats.winner = data.winner
  gameStats.totalQuestions = gameStats.rounds.length
  gameStats.correctAnswers = gameStats.participants.reduce((sum, p) => sum + p.correctAnswers, 0)
  gameStats.averageResponseTime = gameStats.participants.reduce((sum, p) => sum + p.totalResponseTime, 0) / 
    (gameStats.participants.length * gameStats.totalQuestions)
  
  console.log('\n📈 ESTATÍSTICAS DA PARTIDA:')
  console.log(`Total de perguntas: ${gameStats.totalQuestions}`)
  console.log(`Total de respostas corretas: ${gameStats.correctAnswers}`)
  console.log(`Taxa de acerto: ${((gameStats.correctAnswers / (gameStats.participants.length * gameStats.totalQuestions)) * 100).toFixed(1)}%`)
  console.log(`Tempo médio de resposta: ${(gameStats.averageResponseTime / 1000).toFixed(1)}s`)
  
  console.log('\n🎯 DETALHES POR RODADA:')
  gameStats.rounds.forEach((round, index) => {
    console.log(`\nRodada ${index + 1}: ${round.question}`)
    console.log(`Resposta correta: ${round.correctAnswer}`)
    console.log('Pontuações:')
    round.participants.forEach(p => {
      console.log(`  ${p.name}: ${p.score} pontos`)
    })
  })
  
  console.log('\n🎉 SIMULAÇÃO CONCLUÍDA!')
  
  mainSocket.disconnect()
  adminSocket.disconnect()
})

mainSocket.on('timer:update', (data) => {
  if (gameStarted) {
    console.log(`⏰ Timer: ${data.timeRemaining}s`)
  }
})

function simulatePlayerAnswers() {
  const answers = ['A', 'B', 'C']
  const participants = [
    { id: 'cmg29pw460002yitn0t2bp9kz', name: 'Carlos Santos' },
    { id: 'cmg29pw460000yitnopxjrmvc', name: 'Maria Oliveira' },
    { id: 'cmg29pw460001yitnqeg14jke', name: 'Pedro Costa' }
  ]

  if (!gameId || !currentQuestion) {
    console.log('⚠️ Jogo ou pergunta não iniciados para simular respostas.')
    return
  }

  console.log(`\n👥 JOGADORES RESPONDENDO...`)
  
  participants.forEach((participant, index) => {
    // Simular diferentes estratégias de resposta
    let answer
    let responseTime
    
    if (index === 0) { // Carlos - mais rápido, 70% de acerto
      answer = Math.random() < 0.7 ? currentQuestion.correct_answer : answers[Math.floor(Math.random() * 3)]
      responseTime = Math.floor(Math.random() * 8000) + 2000 // 2-10 segundos
    } else if (index === 1) { // Maria - mais cautelosa, 80% de acerto
      answer = Math.random() < 0.8 ? currentQuestion.correct_answer : answers[Math.floor(Math.random() * 3)]
      responseTime = Math.floor(Math.random() * 12000) + 5000 // 5-17 segundos
    } else { // Pedro - mais lento, 60% de acerto
      answer = Math.random() < 0.6 ? currentQuestion.correct_answer : answers[Math.floor(Math.random() * 3)]
      responseTime = Math.floor(Math.random() * 15000) + 8000 // 8-23 segundos
    }
    
    const isCorrect = answer === currentQuestion.correct_answer
    
    // Atualizar estatísticas
    const stats = gameStats.participants.find(p => p.id === participant.id)
    if (stats) {
      if (isCorrect) {
        stats.correctAnswers++
        stats.score += 10
      }
      stats.totalResponseTime += responseTime
    }
    
    mainSocket.emit('player:answer', {
      gameId,
      participantId: participant.id,
      questionId: currentQuestion.id,
      answer: answer,
      responseTime: responseTime
    })
    
    console.log(`👤 ${participant.name}: ${answer} (${isCorrect ? '✅' : '❌'}) em ${(responseTime/1000).toFixed(1)}s`)
  })
}

// Encerrar a simulação após um tempo, caso algo trave
setTimeout(() => {
  console.log('⏰ Timeout - encerrando simulação')
  mainSocket.disconnect()
  adminSocket.disconnect()
}, 300000) // 5 minutos
