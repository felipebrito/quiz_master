'use client'

import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AdminErrorProps {
  title?: string
  message?: string
  showRetry?: boolean
  onRetry?: () => void
  showHome?: boolean
  className?: string
}

export function AdminError({
  title = "Algo deu errado",
  message = "Ocorreu um erro inesperado. Tente novamente.",
  showRetry = true,
  onRetry,
  showHome = true,
  className
}: AdminErrorProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-96", className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {showRetry && onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
          {showHome && (
            <Link href="/admin">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function AdminErrorInline({
  message = "Erro ao carregar dados",
  onRetry,
  className
}: {
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn(
      "flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg",
      className
    )}>
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
        <p className="text-red-800 text-sm mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  )
}
