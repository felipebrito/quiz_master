const { spawn } = require('child_process')
const io = require('socket.io-client')

console.log(`[${new Date().toISOString()}] 🚀 INICIANDO TESTE COMPLETO DO QUIZ SHOW`)
console.log('='.repeat(60))

// Função para log com timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

// Função para executar comandos com timeout
function runCommand(command, args = [], timeout = 10000) {
  return new Promise((resolve, reject) => {
    log(`🔧 Executando: ${command} ${args.join(' ')}`)
    const process = spawn(command, args, { cwd: '/Users/brito/Desktop/Quiz/quiz-show' })
    
    let output = ''
    let error = ''
    
    process.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    process.stderr.on('data', (data) => {
      error += data.toString()
    })
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(output)
      } else {
        reject(new Error(`Command failed with code ${code}: ${error}`))
      }
    })
    
    // Timeout
    setTimeout(() => {
      process.kill()
      reject(new Error('Command timeout'))
    }, timeout)
  })
}

async function main() {
  try {
    // 1. Resetar banco de dados
    log('📊 Resetando banco de dados...')
    await runCommand('node', ['-e', `
      const { PrismaClient } = require('./src/generated/prisma')
      const prisma = new PrismaClient()
      
      async function reset() {
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
        
        console.log('Participantes criados:')
        participants.forEach(p => console.log(\`- \${p.name} (ID: \${p.id})\`))
        await prisma.\$disconnect()
      }
      
      reset().catch(console.error)
    `], 15000)
    
    log('✅ Banco resetado com sucesso')
    
    // 2. Iniciar servidor em background
    log('🚀 Iniciando servidor Socket.IO...')
    const serverProcess = spawn('node', ['socket-server-simple.js'], { 
      cwd: '/Users/brito/Desktop/Quiz/quiz-show',
      detached: true,
      stdio: 'ignore'
    })
    serverProcess.unref()
    
    // Aguardar servidor inicializar
    await new Promise(resolve => setTimeout(resolve, 3000))
    log('✅ Servidor iniciado')
    
    // 3. Executar teste
    log('🎮 Executando teste de simulação...')
    await runTest()
    
    // 4. Limpar processos
    log('🧹 Limpando processos...')
    process.kill(serverProcess.pid)
    
    log('✅ TESTE COMPLETO FINALIZADO COM SUCESSO!')
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`)
    process.exit(1)
  }
}

function runTest() {
  return new Promise((resolve, reject) => {
    const SOCKET_URL = 'http://localhost:3001'
    const ADMIN_NAMESPACE = `${SOCKET_URL}/admin`
    
    const adminSocket = io(ADMIN_NAMESPACE, { transports: ['websocket', 'polling'] })
    const mainSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] })
    
    // IDs dos participantes (vamos buscar do banco)
    const participantIds = [
      'cmg2a16n10000yi84uv1tmxzv',
      'cmg2a16n10001yi84nt3hqd11', 
      'cmg2a16n10002yi842of4e670'
    ]
    
    let gameId = null
    let currentQuestion = null
    let roundCount = 0
    let gameStarted = false
    
    // Timeout global
    const globalTimeout = setTimeout(() => {
      log('⏰ Timeout global - encerrando teste')
      adminSocket.disconnect()
      mainSocket.disconnect()
      reject(new Error('Test timeout'))
    }, 60000) // 1 minuto
    
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
      
      // Simular algumas respostas
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
      log('✅ TESTE CONCLUÍDO COM SUCESSO!')
      clearTimeout(globalTimeout)
      adminSocket.disconnect()
      mainSocket.disconnect()
      resolve()
    })
    
    function simulateAnswers() {
      if (!gameId || !currentQuestion || !gameStarted) {
        log('⚠️ Jogo não iniciado para simular respostas')
        return
      }
      
      const answers = ['A', 'B', 'C']
      const participants = [
        { id: participantIds[0], name: 'Carlos' },
        { id: participantIds[1], name: 'Maria' },
        { id: participantIds[2], name: 'Pedro' }
      ]
      
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
