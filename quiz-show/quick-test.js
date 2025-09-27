const io = require('socket.io-client')
const SOCKET_URL = 'http://localhost:3001'
const ADMIN_NAMESPACE = `${SOCKET_URL}/admin`

const adminSocket = io(ADMIN_NAMESPACE, { transports: ['websocket', 'polling'] })
const mainSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })

// Novos IDs dos participantes
const participantIds = [
  'cmg2a16n10000yi84uv1tmxzv', // Carlos Santos
  'cmg2a16n10001yi84nt3hqd11', // Maria Oliveira
  'cmg2a16n10002yi842of4e670'  // Pedro Costa
]

let gameId = null
let currentQuestion = null
let roundCount = 0
let gameStarted = false

console.log('🎮 TESTE RÁPIDO DO QUIZ SHOW')
console.log('============================')

// Timeout global para evitar travamento
const globalTimeout = setTimeout(() => {
  console.log('⏰ Timeout global - encerrando teste')
  process.exit(0)
}, 30000) // 30 segundos máximo

// Admin Socket Events
adminSocket.on('connect', () => {
  console.log('✅ Admin conectado')
  setTimeout(() => {
    console.log('🚀 Iniciando partida...')
    adminSocket.emit('admin:game:start', { participantIds })
  }, 1000)
})

adminSocket.on('admin:message', (message) => {
  console.log('📢 Admin:', message.message)
  if (message.type === 'error') {
    console.log('❌ Erro no admin, encerrando...')
    clearTimeout(globalTimeout)
    process.exit(1)
  }
})

// Main Socket Events
mainSocket.on('game:started', (data) => {
  console.log('🎉 PARTIDA INICIADA!')
  console.log(`Game ID: ${data.gameId}`)
  console.log(`Participantes: ${data.participants.map(p => p.name).join(', ')}`)
  console.log(`\n🎯 RODADA 1`)
  console.log(`❓ ${data.question.text}`)
  console.log(`A) ${data.question.optionA}`)
  console.log(`B) ${data.question.optionB}`)
  console.log(`C) ${data.question.optionC}`)
  console.log(`✅ Resposta correta: ${data.question.correct_answer}`)
  
  gameId = data.gameId
  currentQuestion = data.question
  gameStarted = true
  roundCount = 1
  
  // Simular respostas dos jogadores
  setTimeout(() => {
    simulateAnswers()
  }, 2000)
})

mainSocket.on('round:started', (data) => {
  roundCount++
  currentQuestion = data.question
  console.log(`\n🎯 RODADA ${data.roundNumber}`)
  console.log(`❓ ${data.question.text}`)
  console.log(`A) ${data.question.optionA}`)
  console.log(`B) ${data.question.optionB}`)
  console.log(`C) ${data.question.optionC}`)
  console.log(`✅ Resposta correta: ${data.question.correct_answer}`)
  
  // Simular respostas
  setTimeout(() => {
    simulateAnswers()
  }, 2000)
})

mainSocket.on('round:ended', (data) => {
  console.log(`\n🏁 RODADA ${roundCount} FINALIZADA!`)
  if (data.currentScores && data.currentScores.length > 0) {
    console.log('📊 Pontuações:')
    data.currentScores.forEach(p => {
      console.log(`  ${p.name}: ${p.score} pontos`)
    })
  }
})

mainSocket.on('game:ended', (data) => {
  console.log(`\n🏆 JOGO FINALIZADO!`)
  console.log(`🥇 Vencedor: ${data.winner ? data.winner.name : 'N/A'}`)
  if (data.finalScores && data.finalScores.length > 0) {
    console.log('🏅 Ranking Final:')
    data.finalScores.forEach((p, index) => {
      console.log(`  ${index + 1}º ${p.name}: ${p.score} pontos`)
    })
  }
  console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!')
  clearTimeout(globalTimeout)
  process.exit(0)
})

mainSocket.on('answer:result', (data) => {
  const participantName = getParticipantName(data.participantId)
  console.log(`📝 ${participantName}: ${data.isCorrect ? 'CORRETO' : 'INCORRETO'} (${data.score} pts)`)
})

function getParticipantName(id) {
  const names = {
    'cmg2a16n10000yi84uv1tmxzv': 'Carlos',
    'cmg2a16n10001yi84nt3hqd11': 'Maria',
    'cmg2a16n10002yi842of4e670': 'Pedro'
  }
  return names[id] || 'Jogador'
}

function simulateAnswers() {
  if (!gameId || !currentQuestion || !gameStarted) {
    console.log('⚠️ Jogo não iniciado para simular respostas')
    return
  }

  const answers = ['A', 'B', 'C']
  const participants = [
    { id: 'cmg2a16n10000yi84uv1tmxzv', name: 'Carlos' },
    { id: 'cmg2a16n10001yi84nt3hqd11', name: 'Maria' },
    { id: 'cmg2a16n10002yi842of4e670', name: 'Pedro' }
  ]

  console.log('👥 Jogadores respondendo...')
  
  participants.forEach((participant, index) => {
    const randomAnswer = answers[Math.floor(Math.random() * answers.length)]
    const responseTime = Math.floor(Math.random() * 5000) + 1000 // 1-6 segundos

    setTimeout(() => {
      mainSocket.emit('player:answer', {
        gameId,
        participantId: participant.id,
        questionId: currentQuestion.id,
        answer: randomAnswer,
        responseTime
      })
      console.log(`👤 ${participant.name}: ${randomAnswer} em ${responseTime}ms`)
    }, responseTime)
  })
}

// Tratamento de erros
adminSocket.on('connect_error', (err) => {
  console.error('❌ Erro de conexão admin:', err.message)
  clearTimeout(globalTimeout)
  process.exit(1)
})

mainSocket.on('connect_error', (err) => {
  console.error('❌ Erro de conexão principal:', err.message)
  clearTimeout(globalTimeout)
  process.exit(1)
})

// Iniciar servidor se não estiver rodando
setTimeout(() => {
  if (!gameStarted) {
    console.log('❌ Servidor não respondeu em 10 segundos')
    clearTimeout(globalTimeout)
    process.exit(1)
  }
}, 10000)
