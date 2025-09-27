'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AdminCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  headerActions?: ReactNode
  badge?: {
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }
  loading?: boolean
}

export function AdminCard({
  title,
  description,
  children,
  className,
  headerActions,
  badge,
  loading = false
}: AdminCardProps) {
  return (
    <Card className={cn("bg-white shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {badge && (
              <Badge variant={badge.variant || 'default'}>
                {badge.label}
              </Badge>
            )}
          </div>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
