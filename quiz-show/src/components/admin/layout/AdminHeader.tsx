'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface AdminHeaderProps {
  title: string
  description?: string
  showBackButton?: boolean
  backHref?: string
  actions?: ReactNode
  badges?: Array<{
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    status?: boolean
  }>
  onRefresh?: () => void
  isLoading?: boolean
}

export function AdminHeader({
  title,
  description,
  showBackButton = false,
  backHref = '/admin',
  actions,
  badges = [],
  onRefresh,
  isLoading = false
}: AdminHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Link href={backHref}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-600 mt-2">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {badges.length > 0 && (
            <div className="flex space-x-2">
              {badges.map((badge, index) => (
                <Badge 
                  key={index}
                  variant={badge.variant || 'default'}
                  className={badge.status !== undefined ? (badge.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') : ''}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
          
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
          
          {actions}
        </div>
      </div>
    </div>
  )
}
