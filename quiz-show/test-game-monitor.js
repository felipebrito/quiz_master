const { io } = require('socket.io-client');

console.log('🔌 Testing GameMonitor connection...');

const adminSocket = io('http://localhost:3001/admin', {
  transports: ['websocket', 'polling']
});

adminSocket.on('connect', () => {
  console.log('✅ GameMonitor: Admin connected to socket server');
});

adminSocket.on('disconnect', () => {
  console.log('❌ GameMonitor: Admin disconnected');
});

adminSocket.on('game:round:started', (data) => {
  console.log('🎯 GameMonitor: Round started event received:', data);
});

adminSocket.on('game:answer:received', (data) => {
  console.log('📝 GameMonitor: Answer received event:', data);
});

adminSocket.on('game:round:ended', (data) => {
  console.log('🏁 GameMonitor: Round ended event:', data);
});

adminSocket.on('game:ended', (data) => {
  console.log('🏆 GameMonitor: Game ended event:', data);
});

adminSocket.on('game:timer:update', (data) => {
  console.log('⏰ GameMonitor: Timer update event:', data);
});

adminSocket.on('connect_error', (error) => {
  console.error('❌ GameMonitor: Connection error:', error);
});

// Keep the script running
setTimeout(() => {
  console.log('⏰ Test completed');
  process.exit(0);
}, 10000);
