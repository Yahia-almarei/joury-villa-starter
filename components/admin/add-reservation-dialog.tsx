'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CalendarDays } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { useTranslation } from '@/lib/use-translation'

interface AddReservationDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
  initialStartDate?: string
  initialEndDate?: string
}

export function AddReservationDialog({ trigger, onSuccess, initialStartDate, initialEndDate }: AddReservationDialogProps) {
  const { t } = useTranslation('admin')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    initialStartDate ? new Date(initialStartDate) : undefined
  )
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    initialEndDate ? new Date(initialEndDate) : undefined
  )
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('AWAITING_APPROVAL')
  const [reservedDates, setReservedDates] = useState<Set<string>>(new Set())

  // Fetch reserved dates when dialog opens
  useEffect(() => {
    if (open) {
      fetchReservedDates()
    }
  }, [open])

  const fetchReservedDates = async () => {
    try {
      const [reservationsResponse, blockedPeriodsResponse] = await Promise.all([
        fetch('/api/admin/reservations'),
        fetch('/api/admin/blocked-periods')
      ])
      
      const reservationsData = await reservationsResponse.json()
      const blockedData = await blockedPeriodsResponse.json()
      
      const reserved = new Set<string>()
      
      // Add reservation dates
      if (reservationsData.success) {
        reservationsData.reservations.forEach((reservation: any) => {
          if (['PAID', 'APPROVED', 'AWAITING_APPROVAL'].includes(reservation.status)) {
            const checkIn = new Date(reservation.check_in)
            const checkOut = new Date(reservation.check_out)
            
            // Add all nights between check-in and check-out (excluding check-out day)
            const currentDate = new Date(checkIn)
            while (currentDate < checkOut) {
              reserved.add(format(currentDate, 'yyyy-MM-dd'))
              currentDate.setDate(currentDate.getDate() + 1)
            }
          }
        })
      }
      
      // Add blocked period dates
      if (blockedData.success) {
        blockedData.blockedPeriods.forEach((period: any) => {
          const startDate = new Date(period.start_date)
          const endDate = new Date(period.end_date)
          
          // Add all days in blocked period (including both start and end)
          const currentDate = new Date(startDate)
          while (currentDate <= endDate) {
            reserved.add(format(currentDate, 'yyyy-MM-dd'))
            currentDate.setDate(currentDate.getDate() + 1)
          }
        })
      }
      
      setReservedDates(reserved)
    } catch (error) {
      console.error('Error fetching reserved dates:', error)
    }
  }

  const isDateReserved = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return reservedDates.has(dateString)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First create/get anonymous user
      const userResponse = await fetch('/api/admin/create-anonymous-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: guestEmail || 'guest@example.com',
          name: guestName
        })
      })

      const userData = await userResponse.json()
      if (!userData.success) {
        throw new Error(userData.error)
      }

      // Calculate nights
      if (!checkInDate || !checkOutDate) {
        throw new Error('Please select both check-in and check-out dates')
      }
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

      // Create reservation
      const reservationData = {
        user_id: userData.userId,
        check_in: format(checkInDate, 'yyyy-MM-dd'),
        check_out: format(checkOutDate, 'yyyy-MM-dd'),
        nights,
        adults: 2,
        children: 0,
        status: status,
        total: nights * 500, // Default rate, can be calculated properly
        subtotal: nights * 500,
        fees: 0,
        taxes: 0,
        notes: notes
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
        setOpen(false)
        setCheckInDate(undefined)
        setCheckOutDate(undefined)
        setGuestName('')
        setGuestEmail('')
        setNotes('')
        setStatus('AWAITING_APPROVAL')
        onSuccess?.()

        alert('Reservation created successfully!')
      } else {
        console.error('Reservation creation failed:', data)
        alert(`Failed to create reservation: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating reservation:', error)
      alert(`Failed to create reservation: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className="w-full justify-start" variant="outline">
      <CalendarDays className="w-4 h-4 mr-2" />
      {t('calendar.quickActions.addReservation')}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {t('calendar.quickActions.addReservation')}
          </DialogTitle>
          <DialogDescription>
            Create a new reservation for a guest.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in Date</Label>
                <DatePicker
                  date={checkInDate}
                  onDateChange={setCheckInDate}
                  placeholder="Select check-in date"
                  disabledDates={(date) => {
                    const today = new Date(new Date().setHours(0, 0, 0, 0))
                    return date < today || isDateReserved(date)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out Date</Label>
                <DatePicker
                  date={checkOutDate}
                  onDateChange={setCheckOutDate}
                  placeholder="Select check-out date"
                  disabledDates={(date) => {
                    const today = new Date(new Date().setHours(0, 0, 0, 0))
                    if (checkInDate) {
                      // Check if any date between checkInDate and this date is reserved
                      const tempDate = new Date(checkInDate)
                      tempDate.setDate(tempDate.getDate() + 1) // Start from day after check-in
                      while (tempDate < date) {
                        if (isDateReserved(tempDate)) {
                          return true // Block this check-out date if any night in between is reserved
                        }
                        tempDate.setDate(tempDate.getDate() + 1)
                      }
                      return date <= checkInDate || date < today
                    }
                    return date < today
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guestName">Guest Name</Label>
              <Input
                id="guestName"
                placeholder="John Doe"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guestEmail">Guest Email</Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="john@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
            </div>
            
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Reservation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}