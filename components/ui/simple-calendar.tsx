"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SimpleCalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  disabled?: (date: Date) => boolean
  className?: string
}

export function SimpleCalendar({
  selected,
  onSelect,
  disabled,
  className
}: SimpleCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => selected || new Date())

  const monthStart = React.useMemo(() => startOfMonth(currentMonth), [currentMonth])
  const monthEnd = React.useMemo(() => endOfMonth(currentMonth), [currentMonth])
  const days = React.useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd])

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  // Pad the beginning of the month to align with the correct day of week
  const paddedDays = React.useMemo(() => {
    const startPadding = monthStart.getDay()
    return Array(startPadding).fill(null).concat(days)
  }, [monthStart, days])

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  const handleDateSelect = (date: Date) => {
    if (disabled && disabled(date)) return
    onSelect?.(date)
  }

  return (
    <div className={cn("p-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold text-sm">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {paddedDays.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-8 w-8" />
          }

          const isDisabled = disabled && disabled(day)
          const isSelected = selected && isSameDay(day, selected)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isTodayDate = isToday(day)

          return (
            <Button
              key={day.toISOString()}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              onClick={() => handleDateSelect(day)}
              disabled={isDisabled}
              className={cn(
                "h-8 w-8 p-0 text-xs font-normal",
                !isCurrentMonth && "text-muted-foreground opacity-50",
                isTodayDate && !isSelected && "bg-accent text-accent-foreground",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {format(day, 'd')}
            </Button>
          )
        })}
      </div>
    </div>
  )
}