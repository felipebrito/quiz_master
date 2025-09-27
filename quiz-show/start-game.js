const io = require('socket.io-client')

const ADMIN_NAMESPACE = 'http://localhost:3001/admin'

console.log('🎮 Iniciando partida via Admin...')

const adminSocket = io(ADMIN_NAMESPACE, { transports: ['websocket', 'polling'] })

adminSocket.on('connect', () => {
  console.log('✅ Conectado ao namespace Admin')
  
  // Iniciar partida imediatamente
  console.log('🚀 Iniciando partida...')
  adminSocket.emit('admin:game:start', { 
    participantIds: [
      'cmg1dnm9p0004yiseothtnx5s', // Carlos Santos
      'cmg1dnqcz0005yiseg35g848u', // Maria Oliveira
      'cmg1dnyj80006yise9uy2wx6f'  // Pedro Costa
    ]
  })
  console.log('📤 Comando de início enviado!')
})

adminSocket.on('admin:message', (data) => {
  console.log('📨 Mensagem do admin:', data)
})

adminSocket.on('connect_error', (err) => {
  console.error('❌ Erro de conexão admin:', err.message)
})

// Manter conexão por 30 segundos para observar
setTimeout(() => {
  console.log('⏰ Encerrando simulação')
  adminSocket.disconnect()
  process.exit(0)
}, 30000)
