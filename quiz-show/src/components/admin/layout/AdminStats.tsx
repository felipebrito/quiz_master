'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon?: ReactNode
  description?: string
}

interface AdminStatsProps {
  stats: StatItem[]
  className?: string
}

export function AdminStats({ stats, className }: AdminStatsProps) {
  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return '↗'
      case 'decrease':
        return '↘'
      default:
        return '→'
    }
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.label}
            </CardTitle>
            {stat.icon && (
              <div className="text-gray-400">
                {stat.icon}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stat.value}
            </div>
            {stat.description && (
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            )}
            {stat.change && (
              <div className="flex items-center mt-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    getChangeColor(stat.change.type)
                  )}
                >
                  {getChangeIcon(stat.change.type)} {Math.abs(stat.change.value)}%
                </Badge>
                <span className="text-xs text-gray-500 ml-2">
                  vs período anterior
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
