const io = require('socket.io-client')

const SOCKET_URL = 'http://localhost:3001'
const ADMIN_NAMESPACE = `${SOCKET_URL}/admin`

console.log('🎮 Iniciando simulação simples...')

// Conectar ao namespace principal
const mainSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
const adminSocket = io(ADMIN_NAMESPACE, { transports: ['websocket', 'polling'] })

let gameStarted = false

mainSocket.on('connect', () => {
  console.log('✅ Conectado ao Socket.IO principal')
})

adminSocket.on('connect', () => {
  console.log('✅ Conectado ao namespace Admin')
  
  // Simular início de partida após 2 segundos
  setTimeout(() => {
    console.log('🚀 Iniciando partida...')
    adminSocket.emit('admin:game:start', { 
      participantIds: [
        'cmg1dnm9p0004yiseothtnx5s', // Carlos Santos
        'cmg1dnqcz0005yiseg35g848u', // Maria Oliveira
        'cmg1dnyj80006yise9uy2wx6f'  // Pedro Costa
      ]
    })
  }, 2000)
})

mainSocket.on('game:started', (data) => {
  console.log('🎉 Partida iniciada!')
  console.log('📊 Dados:', JSON.stringify(data, null, 2))
  gameStarted = true
  
  // Simular respostas dos jogadores
  setTimeout(() => {
    console.log('👤 Simulando respostas dos jogadores...')
    simulatePlayerAnswers()
  }, 3000)
})

mainSocket.on('round:started', (data) => {
  console.log('🎯 Rodada iniciada:', data.roundNumber)
  console.log('❓ Pergunta:', data.question.text)
  
  // Simular respostas após 5 segundos
  setTimeout(() => {
    simulatePlayerAnswers()
  }, 5000)
})

mainSocket.on('round:ended', (data) => {
  console.log('🏁 Rodada finalizada')
  console.log('📊 Pontuações:', data.currentScores)
})

mainSocket.on('game:ended', (data) => {
  console.log('🏆 Jogo finalizado!')
  console.log('🥇 Vencedor:', data.winner.name, 'com', data.winner.score, 'pontos')
  console.log('📊 Ranking final:', data.finalScores)
  
  // Encerrar simulação
  setTimeout(() => {
    mainSocket.disconnect()
    adminSocket.disconnect()
    process.exit(0)
  }, 2000)
})

mainSocket.on('timer:update', (data) => {
  if (gameStarted) {
    console.log(`⏰ Timer: ${data.timeRemaining}s`)
  }
})

function simulatePlayerAnswers() {
  const answers = ['A', 'B', 'C']
  const participants = [
    { id: 'cmg1dnm9p0004yiseothtnx5s', name: 'Carlos Santos' },
    { id: 'cmg1dnqcz0005yiseg35g848u', name: 'Maria Oliveira' },
    { id: 'cmg1dnyj80006yise9uy2wx6f', name: 'Pedro Costa' }
  ]
  
  participants.forEach((participant, index) => {
    const randomAnswer = answers[Math.floor(Math.random() * answers.length)]
    const responseTime = Math.floor(Math.random() * 15000) + 2000 // 2-17 segundos
    
    setTimeout(() => {
      mainSocket.emit('player:answer', {
        gameId: 'current-game',
        participantId: participant.id,
        questionId: 'current-question',
        answer: randomAnswer,
        responseTime: responseTime
      })
      console.log(`👤 ${participant.name} respondeu: ${randomAnswer} (${responseTime}ms)`)
    }, responseTime)
  })
}

// Tratamento de erros
mainSocket.on('connect_error', (err) => {
  console.error('❌ Erro de conexão principal:', err.message)
})

adminSocket.on('connect_error', (err) => {
  console.error('❌ Erro de conexão admin:', err.message)
})

// Timeout de segurança
setTimeout(() => {
  if (!gameStarted) {
    console.log('⏰ Timeout - encerrando simulação')
    mainSocket.disconnect()
    adminSocket.disconnect()
    process.exit(1)
  }
}, 30000)
