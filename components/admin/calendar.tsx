'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/use-translation'

interface CalendarProps {
  viewType: 'month' | 'week'
  showAvailability?: boolean
  showReservations?: boolean
  showBlocked?: boolean
  selectedAction?: 'none' | 'block' | 'reserve' | 'unblock'
  onCalendarUpdate?: () => void
}

interface CalendarEvent {
  id: string
  title: string
  type: 'reservation' | 'blocked' | 'checkout' | 'checkin'
  status?: 'confirmed' | 'pending' | 'cancelled'
  date: Date
  endDate?: Date
  guestName?: string
  nights?: number
}

export function Calendar({ viewType, showAvailability = true, showReservations = true, showBlocked = true, selectedAction = 'none', onCalendarUpdate }: CalendarProps) {
  const { t } = useTranslation('admin')
  const [currentDate, setCurrentDate] = useState(new Date())

  const getTranslatedMonth = (date: Date) => {
    const monthKey = format(date, 'MMMM').toLowerCase()
    return t(`pricing.customDatePricing.monthNames.${monthKey}` as any) || format(date, 'MMMM')
  }
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null })
  
  // Function to fetch calendar data
  const fetchCalendarData = async () => {
      try {
        // Get data for current month only to improve performance
        const monthStart = startOfMonth(currentDate).toISOString().split('T')[0]
        const monthEnd = endOfMonth(currentDate).toISOString().split('T')[0]

        const [reservationsResponse, blockedPeriodsResponse] = await Promise.all([
          fetch(`/api/admin/reservations?startDate=${monthStart}&endDate=${monthEnd}`),
          fetch(`/api/admin/blocked-periods?startDate=${monthStart}&endDate=${monthEnd}`)
        ])
        
        const reservationsData = await reservationsResponse.json()
        const blockedData = await blockedPeriodsResponse.json()
        
        const calendarEvents: CalendarEvent[] = []
        
        // Add reservations
        if (reservationsData.success) {
          console.log('Raw reservations data:', reservationsData.reservations)
          const reservationEvents = reservationsData.reservations.map((reservation: any) => {
            // Only PAID and APPROVED are confirmed - AWAITING_APPROVAL should show as pending
            const isConfirmed = ['PAID', 'APPROVED'].includes(reservation.status.toUpperCase())
            console.log(`Reservation ${reservation.id}: status=${reservation.status}, isConfirmed=${isConfirmed}`)
            
            return {
              id: reservation.id,
              title: reservation.users?.customer_profiles?.[0]?.full_name || reservation.users?.email || 'Guest',
              type: 'reservation' as const,
              status: isConfirmed ? 'confirmed' as const : 'pending' as const,
              date: new Date(reservation.check_in),
              endDate: new Date(reservation.check_out),
              guestName: reservation.users?.customer_profiles?.[0]?.full_name || reservation.users?.email || 'Guest',
              nights: reservation.nights
            }
          })
          calendarEvents.push(...reservationEvents)
        }
        
        // Add blocked periods
        if (blockedData.success) {
          console.log('Raw blocked periods data:', blockedData.blockedPeriods)
          const blockedEvents = blockedData.blockedPeriods.map((period: any) => {
            // Create dates from the date strings without adding time components to avoid timezone issues
            const startDate = new Date(period.start_date)
            const endDate = new Date(period.end_date)
            console.log(`Processing blocked period: ${period.start_date} to ${period.end_date}`)
            console.log(`Created dates: ${startDate.toISOString()} to ${endDate.toISOString()}`)
            return {
              id: period.id,
              title: period.reason || 'Blocked Period',
              type: 'blocked' as const,
              date: startDate,
              endDate: endDate
            }
          })
          console.log('Processed blocked events:', blockedEvents)
          calendarEvents.push(...blockedEvents)
        }
        
        console.log('Final calendar events array:', calendarEvents)
        setEvents(calendarEvents)
      } catch (error) {
        console.error('Error fetching calendar data:', error)
        setEvents([])
      }
    }
  
  // Fetch real reservations and blocked periods data
  useEffect(() => {
    fetchCalendarData()
  }, [currentDate]) // Refetch when month changes
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  
  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    // Normalize the input date to midnight for consistent comparison
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    const filteredEvents = events.filter(event => {
      // Filter based on visibility options
      if (event.type === 'reservation' && !showReservations) return false
      if (event.type === 'blocked' && !showBlocked) return false
      
      if (event.endDate) {
        // Normalize event dates to midnight for consistent comparison
        const eventStartDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate())
        const eventEndDate = new Date(event.endDate.getFullYear(), event.endDate.getMonth(), event.endDate.getDate())
        
        // For reservations, check-out date should not be included (guests leave that day)
        if (event.type === 'reservation') {
          return normalizedDate >= eventStartDate && normalizedDate < eventEndDate
        }
        // For blocked periods, include both start and end dates
        const isInRange = normalizedDate >= eventStartDate && normalizedDate <= eventEndDate
        if (event.type === 'blocked' && isInRange) {
          console.log(`Date ${dateStr} is in blocked range: ${format(eventStartDate, 'yyyy-MM-dd')} to ${format(eventEndDate, 'yyyy-MM-dd')}`)
        }
        return isInRange
      }
      // For single-day events, compare normalized dates
      const eventDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate())
      return normalizedDate.getTime() === eventDate.getTime()
    })
    
    if (filteredEvents.some(e => e.type === 'blocked')) {
      console.log(`Date ${dateStr} has blocked events:`, filteredEvents.filter(e => e.type === 'blocked'))
    }
    
    return filteredEvents
  }
  
  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayEvents = getEventsForDate(date)
    if (dayEvents.length === 0) return showAvailability ? 'available' : 'hidden'
    
    const hasBlocked = dayEvents.some(e => e.type === 'blocked')
    const hasReservation = dayEvents.some(e => e.type === 'reservation' && e.status === 'confirmed')
    const hasPending = dayEvents.some(e => e.type === 'reservation' && e.status === 'pending')
    
    const status = hasBlocked ? 'blocked' : 
                  hasReservation ? 'reserved' : 
                  hasPending ? 'pending' : 
                  showAvailability ? 'available' : 'hidden'
    
    if (dayEvents.length > 0) {
      console.log(`Date ${dateStr}: events=${dayEvents.length}, hasBlocked=${hasBlocked}, status=${status}`, dayEvents)
    }
    
    return status
  }
  
  const handleDateClick = async (date: Date) => {
    if (selectedAction === 'none') {
      setSelectedDate(date)
      return
    }

    if (selectedAction === 'block') {
      // Check if date is available for blocking
      const dayEvents = getEventsForDate(date)
      const hasConfirmedReservation = dayEvents.some(e => e.type === 'reservation' && e.status === 'confirmed')
      const hasBlock = dayEvents.some(e => e.type === 'blocked')
      const today = new Date(new Date().setHours(0, 0, 0, 0))
      
      // Debug logging
      console.log('Blocking date:', format(date, 'yyyy-MM-dd'))
      console.log('Day events:', dayEvents)
      console.log('Has confirmed reservation:', hasConfirmedReservation)
      console.log('All events:', events)
      
      if (date < today) {
        alert('Cannot block dates in the past')
        return
      }
      
      if (hasConfirmedReservation) {
        alert('Cannot block this date - it has an existing reservation')
        return
      }
      
      if (hasBlock) {
        alert('This date is already blocked')
        return
      }
      
      // Block single day
      await createBlockPeriod(date, date)
    } else if (selectedAction === 'reserve') {
      if (!selectedRange.start) {
        // First click - set start date
        setSelectedRange({ start: date, end: null })
      } else if (!selectedRange.end) {
        // Second click - set end date and create reservation
        const startDate = selectedRange.start
        const endDate = date > startDate ? date : startDate
        const actualStartDate = date > startDate ? startDate : date
        
        await createQuickReservation(actualStartDate, endDate)
        setSelectedRange({ start: null, end: null })
      } else {
        // Reset and start new selection
        setSelectedRange({ start: date, end: null })
      }
    } else if (selectedAction === 'unblock') {
      if (!selectedRange.start) {
        // First click - set start date for unblock range
        setSelectedRange({ start: date, end: null })
      } else if (!selectedRange.end) {
        // Second click - set end date and unblock the range
        const startDate = selectedRange.start
        const endDate = date > startDate ? date : startDate
        const actualStartDate = date > startDate ? startDate : date

        await unblockDateRange(actualStartDate, endDate)
        setSelectedRange({ start: null, end: null })
      } else {
        // Reset and start new selection
        setSelectedRange({ start: date, end: null })
      }
    }
  }

  const createBlockPeriod = async (startDate: Date, endDate: Date) => {
    try {
      const response = await fetch('/api/admin/blocked-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          reason: 'Quick block from calendar'
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('Dates blocked successfully!')
        // Refresh calendar data
        await fetchCalendarData()
        onCalendarUpdate?.()
      } else {
        alert(data.error || 'Failed to block dates')
      }
    } catch (error) {
      console.error('Error blocking dates:', error)
      alert('Failed to block dates')
    }
  }

  const createQuickReservation = async (startDate: Date, endDate: Date) => {
    try {
      // Create anonymous guest user
      const userResponse = await fetch('/api/admin/create-anonymous-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'quick@guest.com',
          name: 'Quick Reservation'
        })
      })

      const userData = await userResponse.json()
      if (!userData.success) {
        throw new Error(userData.error)
      }

      // Calculate nights
      const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      // Create reservation
      const reservationData = {
        user_id: userData.userId,
        check_in: format(startDate, 'yyyy-MM-dd'),
        check_out: format(endDate, 'yyyy-MM-dd'),
        nights,
        adults: 2,
        children: 0,
        status: 'AWAITING_APPROVAL',
        total: nights * 500,
        subtotal: nights * 500,
        fees: 0,
        taxes: 0,
        notes: 'Quick reservation from calendar'
      }

      const response = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData)
      })

      const data = await response.json()
      if (data.success) {
        onCalendarUpdate?.()
        alert('Reservation created successfully!')
      } else {
        alert(data.error || 'Failed to create reservation')
      }
    } catch (error) {
      console.error('Error creating reservation:', error)
      alert('Failed to create reservation')
    }
  }

  const unblockDateRange = async (startDate: Date, endDate: Date) => {
    try {
      // Find all blocked events that overlap with the selected range
      const allBlockedEvents = events.filter(event => event.type === 'blocked')

      // Find blocked events that overlap with the selected date range
      const overlappingBlockedEvents = allBlockedEvents.filter(blockedEvent => {
        const blockedStart = new Date(blockedEvent.date.getFullYear(), blockedEvent.date.getMonth(), blockedEvent.date.getDate())
        const blockedEnd = new Date(blockedEvent.endDate.getFullYear(), blockedEvent.endDate.getMonth(), blockedEvent.endDate.getDate())

        // Check if ranges overlap
        return blockedStart <= endDate && blockedEnd >= startDate
      })

      if (overlappingBlockedEvents.length === 0) {
        alert('No blocked dates found in the selected range')
        return
      }

      // Delete each overlapping blocked period
      const deletePromises = overlappingBlockedEvents.map(blockedEvent =>
        fetch(`/api/admin/blocked-periods?id=${blockedEvent.id}`, {
          method: 'DELETE',
        }).then(response => response.json())
      )

      const results = await Promise.all(deletePromises)
      const successfulDeletes = results.filter(result => result.success)
      const failedDeletes = results.filter(result => !result.success)

      if (successfulDeletes.length > 0) {
        alert(`Successfully unblocked ${successfulDeletes.length} date range(s)!`)
        // Refresh calendar data
        await fetchCalendarData()
        onCalendarUpdate?.()
      }

      if (failedDeletes.length > 0) {
        console.error('Some unblock operations failed:', failedDeletes)
        alert(`Failed to unblock ${failedDeletes.length} date range(s). Check console for details.`)
      }
    } catch (error) {
      console.error('Error unblocking date range:', error)
      alert('Failed to unblock dates')
    }
  }

  const getDateClasses = (date: Date) => {
    const status = getDateStatus(date)
    const baseClasses = 'w-full h-20 p-2 border border-gray-200 text-left hover:bg-gray-50 transition-colors'
    
    const statusClasses = {
      available: 'bg-green-50 hover:bg-green-100',
      reserved: 'bg-blue-50 hover:bg-blue-100',
      pending: 'bg-amber-50 hover:bg-amber-100',
      blocked: 'bg-red-50 hover:bg-red-100',
      hidden: 'bg-gray-50 hover:bg-gray-100'
    }
    
    // Add selection highlighting
    const isInRange = selectedRange.start && (
      (selectedRange.end && date >= selectedRange.start && date <= selectedRange.end) ||
      (!selectedRange.end && format(date, 'yyyy-MM-dd') === format(selectedRange.start, 'yyyy-MM-dd'))
    )
    
    return cn(
      baseClasses,
      statusClasses[status],
      !isSameMonth(date, currentDate) && 'opacity-40',
      isToday(date) && 'ring-2 ring-coral',
      isInRange && selectedAction !== 'none' && 'ring-2 ring-blue-500 bg-blue-100',
      selectedAction !== 'none' && 'cursor-pointer'
    )
  }
  
  if (viewType === 'week') {
    // Week view implementation would go here
    return <div>Week view coming soon...</div>
  }
  
  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {getTranslatedMonth(currentDate)} {format(currentDate, 'yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentDate(new Date())}
          >
            {t('calendar.navigation.today')}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCalendarData}>
            {t('calendar.navigation.refresh')}
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-0">
        {[
          t('pricing.customDatePricing.dayNames.sunday'),
          t('pricing.customDatePricing.dayNames.monday'),
          t('pricing.customDatePricing.dayNames.tuesday'),
          t('pricing.customDatePricing.dayNames.wednesday'),
          t('pricing.customDatePricing.dayNames.thursday'),
          t('pricing.customDatePricing.dayNames.friday'),
          t('pricing.customDatePricing.dayNames.saturday')
        ].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 border border-gray-200">
        {monthDays.map(date => {
          const dayEvents = getEventsForDate(date)
          
          return (
            <button
              key={format(date, 'yyyy-MM-dd')}
              className={getDateClasses(date)}
              onClick={() => handleDateClick(date)}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-sm font-medium',
                    !isSameMonth(date, currentDate) && 'text-gray-400',
                    isToday(date) && 'text-coral font-bold'
                  )}>
                    {format(date, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={`${event.id}-${format(date, 'yyyy-MM-dd')}`}
                      className={cn(
                        'text-xs px-1 py-0.5 rounded truncate',
                        event.type === 'reservation' && event.status === 'confirmed' && 'bg-blue-600 text-white',
                        event.type === 'reservation' && event.status === 'pending' && 'bg-amber-600 text-white',
                        event.type === 'blocked' && 'bg-red-600 text-white',
                        event.type === 'checkin' && 'bg-purple-600 text-white',
                        event.type === 'checkout' && 'bg-gray-600 text-white'
                      )}
                    >
                      {event.type === 'reservation' && event.guestName ? 
                        event.guestName : event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).map(event => (
              <div key={event.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div>
                  <div className="font-medium">{event.title}</div>
                  {event.guestName && event.nights && (
                    <div className="text-sm text-gray-600">
                      {event.nights} nights • {event.status}
                    </div>
                  )}
                </div>
                <Badge variant={
                  event.status === 'confirmed' ? 'default' :
                  event.status === 'pending' ? 'secondary' : 'outline'
                }>
                  {event.type}
                </Badge>
              </div>
            ))}
            {getEventsForDate(selectedDate).length === 0 && (
              <p className="text-gray-500">No events on this date</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}