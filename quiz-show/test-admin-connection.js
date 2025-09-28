const { io } = require('socket.io-client');

console.log('🔌 Testing admin connection...');

const adminSocket = io('http://localhost:3001/admin', {
  transports: ['websocket', 'polling']
});

adminSocket.on('connect', () => {
  console.log('✅ Admin connected to socket server');
  
  // Test starting a game
  const participantIds = [
    'cmg311w6j000byi7l7auj0l7n',
    'cmg311w6j0009yi7lvcebo0s5', 
    'cmg311w6j000ayi7lbs6xsw27'
  ];
  
  console.log('🎮 Sending game start command...');
  adminSocket.emit('admin:game:start', {
    participantIds: participantIds
  });
});

adminSocket.on('admin:message', (data) => {
  console.log('📨 Admin message received:', data);
});

adminSocket.on('disconnect', () => {
  console.log('❌ Admin disconnected');
});

adminSocket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

// Keep the script running
setTimeout(() => {
  console.log('⏰ Test completed');
  process.exit(0);
}, 5000);
