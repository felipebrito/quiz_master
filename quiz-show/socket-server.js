const { Server } = require('socket.io')
const { createServer } = require('http')

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"],
    credentials: true
  }
})

// Store game state
let gameState = {
  isRunning: false,
  timeRemaining: 30, // 30 seconds
  players: new Map()
}

// Timer interval
let timerInterval = null

// Start timer
function startTimer() {
  if (timerInterval) return
  
  gameState.isRunning = true
  timerInterval = setInterval(() => {
    gameState.timeRemaining--
    
    // Broadcast time to all players
    io.emit('timer:update', {
      timeRemaining: gameState.timeRemaining,
      isRunning: gameState.isRunning
    })
    
    if (gameState.timeRemaining <= 0) {
      stopTimer()
    }
  }, 1000)
}

// Stop timer
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  gameState.isRunning = false
  gameState.timeRemaining = 30
  
  io.emit('timer:end', {
    timeRemaining: 0,
    isRunning: false
  })
}

// Reset timer
function resetTimer() {
  stopTimer()
  gameState.timeRemaining = 30
  gameState.isRunning = false
  
  io.emit('timer:reset', {
    timeRemaining: gameState.timeRemaining,
    isRunning: gameState.isRunning
  })
}

// Main namespace
io.on('connection', (socket) => {
  console.log(`✅ Player connected: ${socket.id}`)
  
  // Send current game state to new player
  socket.emit('timer:state', {
    timeRemaining: gameState.timeRemaining,
    isRunning: gameState.isRunning
  })
  
  // Handle player registration
  socket.on('player:register', (data) => {
    const { playerId, playerName } = data
    gameState.players.set(socket.id, { playerId, playerName, socketId: socket.id })
    console.log(`👤 Player registered: ${playerName} (${playerId})`)
    
    // Broadcast player list to all
    io.emit('players:update', Array.from(gameState.players.values()))
  })
  
  // Handle timer controls
  socket.on('timer:start', () => {
    console.log('⏰ Timer started by player:', socket.id)
    startTimer()
  })
  
  socket.on('timer:stop', () => {
    console.log('⏹️ Timer stopped by player:', socket.id)
    stopTimer()
  })
  
  socket.on('timer:reset', () => {
    console.log('🔄 Timer reset by player:', socket.id)
    resetTimer()
  })
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Player disconnected: ${socket.id}, reason: ${reason}`)
    
    // Remove player from game state
    if (gameState.players.has(socket.id)) {
      const player = gameState.players.get(socket.id)
      gameState.players.delete(socket.id)
      console.log(`👤 Player removed: ${player.playerName}`)
      
      // Broadcast updated player list
      io.emit('players:update', Array.from(gameState.players.values()))
    }
  })
})

// Admin namespace
const adminNamespace = io.of('/admin')
adminNamespace.on('connection', (socket) => {
  console.log(`👨‍💼 Admin connected: ${socket.id}`)
  
  // Send current game state to admin
  socket.emit('admin:state', {
    gameState,
    players: Array.from(gameState.players.values())
  })
  
  // Admin controls
  socket.on('admin:timer:start', () => {
    console.log('👨‍💼 Admin started timer')
    startTimer()
  })
  
  socket.on('admin:timer:stop', () => {
    console.log('👨‍💼 Admin stopped timer')
    stopTimer()
  })
  
  socket.on('admin:timer:reset', () => {
    console.log('👨‍💼 Admin reset timer')
    resetTimer()
  })
  
  socket.on('disconnect', (reason) => {
    console.log(`👨‍💼 Admin disconnected: ${socket.id}, reason: ${reason}`)
  })
})

const PORT = 3001
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📡 Main namespace: ws://0.0.0.0:${PORT}`)
  console.log(`👨‍💼 Admin namespace: ws://0.0.0.0:${PORT}/admin`)
  console.log(`🌐 Accessible from any IP on the network`)
})
