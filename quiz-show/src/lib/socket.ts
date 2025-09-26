import { io as ClientIO, Socket } from 'socket.io-client'

// Socket.IO server configuration
const SOCKET_URL = 'http://localhost:3001'

// Global socket instances
let socket: Socket | null = null
let adminSocket: Socket | null = null

// Main socket connection
export const getSocket = (): Socket | null => {
  if (typeof window !== 'undefined' && !socket) {
    socket = ClientIO(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })
    console.log('🔌 Connected to real Socket.IO server')
  }
  return socket
}

// Admin namespace socket
export const getAdminSocket = (): Socket | null => {
  if (typeof window !== 'undefined' && !adminSocket) {
    adminSocket = ClientIO(`${SOCKET_URL}/admin`, {
      transports: ['websocket', 'polling']
    })
    console.log('🔌 Connected to admin namespace')
  }
  return adminSocket
}

// Disconnect all sockets
export const disconnectAllSockets = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  if (adminSocket) {
    adminSocket.disconnect()
    adminSocket = null
  }
  if (gameSocket) {
    gameSocket.disconnect()
    gameSocket = null
  }
}

// Socket event types for TypeScript
export interface SocketEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  
  // Ping/Pong events
  ping: () => void
  pong: (data: { timestamp: number }) => void
  
  // Admin events
  'admin:ping': () => void
  'admin:pong': (data: { timestamp: number; namespace: string }) => void
  
  // Game events
  'game:ping': () => void
  'game:pong': (data: { timestamp: number; namespace: string }) => void
}
