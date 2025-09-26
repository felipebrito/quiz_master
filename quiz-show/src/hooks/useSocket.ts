'use client'

import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket, getAdminSocket } from '@/lib/socket'

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = getSocket()
    setSocket(socketInstance)

    if (socketInstance) {
      socketInstance.on('connect', () => {
        console.log('🔌 Connected to Socket.IO server')
        setIsConnected(true)
      })

      socketInstance.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from Socket.IO server:', reason)
        setIsConnected(false)
      })

      socketInstance.on('pong', (data) => {
        console.log('🏓 Received pong:', data)
      })
    }

    return () => {
      if (socketInstance) {
        socketInstance.off('connect')
        socketInstance.off('disconnect')
        socketInstance.off('pong')
      }
    }
  }, [])

  const ping = () => {
    if (socket && isConnected) {
      socket.emit('ping')
    }
  }

  return { socket, isConnected, ping }
}

export const useAdminSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = getAdminSocket()
    setSocket(socketInstance)

    if (socketInstance) {
      socketInstance.on('connect', () => {
        console.log('👨‍💼 Connected to Admin namespace')
        setIsConnected(true)
      })

      socketInstance.on('disconnect', (reason) => {
        console.log('👨‍💼 Disconnected from Admin namespace:', reason)
        setIsConnected(false)
      })

      socketInstance.on('admin:pong', (data) => {
        console.log('🏓 Admin pong received:', data)
      })
    }

    return () => {
      if (socketInstance) {
        socketInstance.off('connect')
        socketInstance.off('disconnect')
        socketInstance.off('admin:pong')
      }
    }
  }, [])

  const ping = () => {
    if (socket && isConnected) {
      socket.emit('admin:ping')
    }
  }

  return { socket, isConnected, ping }
}

