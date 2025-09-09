'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Loader2, AlertCircle } from 'lucide-react'
import { format, parseISO, isBefore, isAfter, isSameDay, addDays } from 'date-fns'

interface Reservation {
  id: string
  check_in: string
  check_out: string
  nights: number
  users: {
    email: string
    customer_profiles?: {
      full_name: string
    }[]
  }
  properties: {
    name: string
  }
}

interface RescheduleDialogProps {
  reservation: Reservation
  children: React.ReactNode
  onRescheduleSuccess: () => void
}

interface UnavailableDate {
  start: string
  end: string
  type: 'reservation' | 'blocked'
  reason: string
}

export function RescheduleDialog({ 
  reservation, 
  children, 
  onRescheduleSuccess 
}: RescheduleDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([])
  const [loadingDates, setLoadingDates] = useState(false)
  const [formData, setFormData] = useState({
    newCheckIn: parseISO(reservation.check_in),
    newCheckOut: parseISO(reservation.check_out),
    reason: ''
  })
  const [error, setError] = useState('')

  // Fetch unavailable dates when dialog opens
  useEffect(() => {
    if (open) {
      fetchUnavailableDates()
    }
  }, [open, reservation.id])

  const fetchUnavailableDates = async () => {
    setLoadingDates(true)
    try {
      const response = await fetch(`/api/admin/unavailable-dates?excludeId=${reservation.id}`)
      const data = await response.json()
      
      if (data.success) {
        setUnavailableDates(data.unavailableDates || [])
      } else {
        console.error('Failed to fetch unavailable dates:', data.error)
      }
    } catch (error) {
      console.error('Error fetching unavailable dates:', error)
    } finally {
      setLoadingDates(false)
    }
  }

  // Function to check if a date is unavailable
  const isDateUnavailable = (date: Date): boolean => {
    for (const period of unavailableDates) {
      const startDate = parseISO(period.start)
      const endDate = parseISO(period.end)
      
      // Check if date falls within an unavailable period
      if ((isSameDay(date, startDate) || isAfter(date, startDate)) && 
          (isSameDay(date, endDate) || isBefore(date, endDate))) {
        return true
      }
    }
    return false
  }

  // Function to check if a date range conflicts with unavailable dates
  const isDateRangeValid = (checkIn: Date, checkOut: Date): string | null => {
    const startDate = checkIn
    const endDate = addDays(checkOut, -1) // Check-out is exclusive, so subtract 1 day
    
    for (const period of unavailableDates) {
      const periodStart = parseISO(period.start)
      const periodEnd = parseISO(period.end)
      
      // Check if the date range overlaps with any unavailable period
      if ((isSameDay(startDate, periodEnd) || isBefore(startDate, periodEnd)) && 
          (isSameDay(endDate, periodStart) || isAfter(endDate, periodStart))) {
        return `Dates conflict with ${period.type === 'blocked' ? 'blocked period' : 'existing reservation'}: ${period.reason}`
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate date range
    if (!formData.newCheckIn || !formData.newCheckOut) {
      setError('Please select both check-in and check-out dates')
      setIsLoading(false)
      return
    }

    // Check for conflicts
    const conflictError = isDateRangeValid(formData.newCheckIn, formData.newCheckOut)
    if (conflictError) {
      setError(conflictError)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newCheckIn: format(formData.newCheckIn, 'yyyy-MM-dd'),
          newCheckOut: format(formData.newCheckOut, 'yyyy-MM-dd'),
          reason: formData.reason.trim() || undefined
        })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to reschedule reservation')
        return
      }

      // Success
      setOpen(false)
      onRescheduleSuccess()
      
      // Reset form
      setFormData({
        newCheckIn: parseISO(reservation.check_in),
        newCheckOut: parseISO(reservation.check_out),
        reason: ''
      })
      
    } catch (error) {
      console.error('Error rescheduling reservation:', error)
      setError('Failed to reschedule reservation')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateNights = () => {
    if (!formData.newCheckIn || !formData.newCheckOut) return 0
    const diffTime = formData.newCheckOut.getTime() - formData.newCheckIn.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const isValidDateRange = () => {
    if (!formData.newCheckIn || !formData.newCheckOut) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return formData.newCheckIn >= today && formData.newCheckOut > formData.newCheckIn
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reschedule Reservation
          </DialogTitle>
          <DialogDescription>
            Modify the dates for reservation #{reservation.id.slice(-8)}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Current Reservation Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Current Reservation</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Guest:</strong> {reservation.users.customer_profiles?.[0]?.full_name || reservation.users.email}</p>
                <p><strong>Property:</strong> {reservation.properties.name}</p>
                <p><strong>Current Dates:</strong> {format(new Date(reservation.check_in), 'MMM dd')} - {format(new Date(reservation.check_out), 'MMM dd, yyyy')} ({reservation.nights} nights)</p>
              </div>
            </div>

            {/* New Dates */}
            {loadingDates ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Loading available dates...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Check-in</Label>
                  <DatePicker
                    date={formData.newCheckIn}
                    onDateChange={(date) => {
                      setFormData(prev => ({ ...prev, newCheckIn: date }))
                      setError('') // Clear any existing errors
                    }}
                    placeholder="Select check-in date"
                    disabledDates={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      return isBefore(date, today) || isDateUnavailable(date)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Check-out</Label>
                  <DatePicker
                    date={formData.newCheckOut}
                    onDateChange={(date) => {
                      setFormData(prev => ({ ...prev, newCheckOut: date }))
                      setError('') // Clear any existing errors
                    }}
                    placeholder="Select check-out date"
                    disabledDates={(date) => {
                      if (!formData.newCheckIn) return true
                      return isBefore(date, addDays(formData.newCheckIn, 1)) || isDateUnavailable(date)
                    }}
                  />
                </div>
              </div>
            )}

            {/* New nights calculation */}
            {isValidDateRange() && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>New stay duration:</strong> {calculateNights()} nights
                </p>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Reschedule (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rescheduling..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Unavailable dates info */}
            {!loadingDates && unavailableDates.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Unavailable Dates</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Some dates are blocked due to existing reservations or blocked periods. These dates are disabled in the calendar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isValidDateRange()}
              className="bg-coral hover:bg-coral/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                'Reschedule Booking'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}