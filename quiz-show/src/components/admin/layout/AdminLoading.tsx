'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AdminLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: ReactNode
}

export function AdminLoading({ 
  message = "Carregando...", 
  size = 'md',
  className,
  children
}: AdminLoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8",
      className
    )}>
      <div className={cn(
        "animate-spin rounded-full border-b-2 border-blue-600",
        sizeClasses[size]
      )}></div>
      <p className="text-gray-600 mt-4 text-sm">{message}</p>
      {children}
    </div>
  )
}

export function AdminLoadingPage({ 
  message = "Carregando dados do dashboard...",
  className 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <div className={cn(
      "flex items-center justify-center min-h-screen bg-gray-50",
      className
    )}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}
