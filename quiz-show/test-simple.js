const io = require('socket.io-client')

console.log('🧪 Teste Simples do Socket.IO...')

// Testar conexão principal
const mainSocket = io('http://localhost:3001')

mainSocket.on('connect', () => {
  console.log('✅ Conectado ao Socket.IO principal')
  
  // Testar ping
  mainSocket.emit('ping')
  console.log('📤 Ping enviado')
})

mainSocket.on('pong', (data) => {
  console.log('📥 Pong recebido:', data)
})

mainSocket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão:', error.message)
})

// Testar namespace admin
const adminSocket = io('http://localhost:3001/admin')

adminSocket.on('connect', () => {
  console.log('✅ Conectado ao namespace Admin')
  
  // Testar ping admin
  adminSocket.emit('admin:ping')
  console.log('📤 Admin ping enviado')
})

adminSocket.on('admin:pong', (data) => {
  console.log('📥 Admin pong recebido:', data)
})

adminSocket.on('admin:message', (data) => {
  console.log('📨 Mensagem do admin:', data)
})

adminSocket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão admin:', error.message)
})

// Manter conexão por 10 segundos
setTimeout(() => {
  console.log('⏰ Encerrando teste')
  mainSocket.disconnect()
  adminSocket.disconnect()
  process.exit(0)
}, 10000)
