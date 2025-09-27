'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Column {
  key: string
  label: string
}

interface MetricsTableProps {
  data: Array<Record<string, any>>
  columns: Column[]
}

export function MetricsTable({ data, columns }: MetricsTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum dado disponível</p>
      </div>
    )
  }

  const getCellValue = (item: Record<string, any>, key: string) => {
    const value = item[key]
    
    // Special handling for photo_url
    if (key === 'photo_url' && value) {
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={value} alt="Participant" />
          <AvatarFallback>
            {item.name ? item.name.charAt(0).toUpperCase() : '?'}
          </AvatarFallback>
        </Avatar>
      )
    }
    
    // Special handling for scores
    if (key === 'averageScore') {
      return (
        <Badge variant="secondary" className="font-mono">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </Badge>
      )
    }
    
    // Special handling for games played
    if (key === 'gamesPlayed') {
      return (
        <Badge variant="outline">
          {value} {value === 1 ? 'partida' : 'partidas'}
        </Badge>
      )
    }
    
    return value
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className="font-semibold">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={item.id || index}>
              {columns.map((column) => (
                <TableCell key={column.key} className="align-middle">
                  {getCellValue(item, column.key)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
