'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface DatePickerWithRangeProps {
  dateRange: { from: Date; to: Date }
  onDateRangeChange: (range: { from: Date; to: Date }) => void
}

export function DatePickerWithRange({ dateRange, onDateRangeChange }: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to })
      setIsOpen(false)
    }
  }

  const quickRanges = [
    {
      label: 'Últimos 7 dias',
      getRange: () => ({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date()
      })
    },
    {
      label: 'Últimos 30 dias',
      getRange: () => ({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
      })
    },
    {
      label: 'Últimos 90 dias',
      getRange: () => ({
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date()
      })
    },
    {
      label: 'Este mês',
      getRange: () => {
        const now = new Date()
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now
        }
      }
    },
    {
      label: 'Mês passado',
      getRange: () => {
        const now = new Date()
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          from: lastMonth,
          to: endLastMonth
        }
      }
    }
  ]

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecionar período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="p-3 border-r">
              <h4 className="font-medium text-sm mb-2">Períodos Rápidos</h4>
              <div className="space-y-1">
                {quickRanges.map((range, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => {
                      const newRange = range.getRange()
                      onDateRangeChange(newRange)
                      setIsOpen(false)
                    }}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={ptBR}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
