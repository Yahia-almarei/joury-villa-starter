'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BlockDatesDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
  initialDate?: Date
}

export function BlockDatesDialog({ trigger, onSuccess, initialDate }: BlockDatesDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate)
  const [reason, setReason] = useState('')
  const [reservedDates, setReservedDates] = useState<Date[]>([])
  const [blockedDates, setBlockedDates] = useState<Date[]>([])

  // Fetch reserved and blocked dates when dialog opens
  const fetchCalendarData = async () => {
    try {
      const [reservationsRes, blockedRes] = await Promise.all([
        fetch('/api/admin/reservations'),
        fetch('/api/admin/blocked-periods')
      ])

      const [reservationsData, blockedData] = await Promise.all([
        reservationsRes.json(),
        blockedRes.json()
      ])

      if (reservationsData.success) {
        const dates: Date[] = []
        reservationsData.reservations.forEach((reservation: any) => {
          if (reservation.status !== 'CANCELLED') {
            const checkIn = new Date(reservation.check_in)
            const checkOut = new Date(reservation.check_out)
            // Add each date between check-in and check-out (exclusive of check-out)
            for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
              dates.push(new Date(d))
            }
          }
        })
        setReservedDates(dates)
      }

      if (blockedData.success) {
        const dates: Date[] = []
        blockedData.blockedPeriods.forEach((period: any) => {
          const startDate = new Date(period.start_date)
          const endDate = new Date(period.end_date)
          // Add each date between start and end (inclusive)
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d))
          }
        })
        setBlockedDates(dates)
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    }
  }

  // Fetch calendar data when dialog opens
  useEffect(() => {
    if (open) {
      fetchCalendarData()
    }
  }, [open])

  // Set initial date when prop changes
  useEffect(() => {
    if (initialDate && open) {
      setSelectedDate(initialDate)
    }
  }, [initialDate, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate) {
      alert('Please select a date to block')
      return
    }

    setLoading(true)

    try {
      // For single day blocking, start and end date are the same
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      
      const response = await fetch('/api/admin/blocked-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: dateStr,
          endDate: dateStr, // Same date for single day block
          reason: reason || 'Blocked from calendar'
        }),
      })

      if (response.status === 401) {
        alert('You are not authorized. Please log in as admin first.')
        return
      }

      const data = await response.json()

      if (data.success) {
        setOpen(false)
        setSelectedDate(undefined)
        setReason('')
        onSuccess?.()
        
        alert('Date blocked successfully!')
      } else {
        if (data.error?.includes('existing reservations') || data.conflicts) {
          alert('Cannot block this date - there is an existing reservation. Please choose a different date or cancel the reservation first.')
        } else {
          alert(data.error || 'Failed to block date')
        }
      }
    } catch (error) {
      console.error('Error blocking date:', error)
      alert('Failed to block date - please ensure you are logged in as admin')
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className="w-full justify-start" variant="outline">
      <Plus className="w-4 h-4 mr-2" />
      Block Date
    </Button>
  )

  const isDateAvailable = (date: Date) => {
    const today = new Date(new Date().setHours(0, 0, 0, 0))
    if (date < today) return false
    
    // Check if date is already reserved
    const isReserved = reservedDates.some(reservedDate => 
      reservedDate.toDateString() === date.toDateString()
    )
    
    // Check if date is already blocked
    const isBlocked = blockedDates.some(blockedDate => 
      blockedDate.toDateString() === date.toDateString()
    )
    
    return !isReserved && !isBlocked
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Block Single Date
          </DialogTitle>
          <DialogDescription>
            Block a specific date to prevent customers from booking it. Only available dates can be blocked.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can only block one day at a time. Dates that are already reserved or blocked cannot be selected.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label>Select Date to Block</Label>
              <DatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
                placeholder="Select date to block"
                disabledDates={(date) => !isDateAvailable(date)}
              />
              {selectedDate && !isDateAvailable(selectedDate) && (
                <p className="text-sm text-red-600">
                  This date cannot be blocked - it's either in the past, already reserved, or already blocked.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Maintenance, Personal use, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedDate || !isDateAvailable(selectedDate || new Date())}
            >
              {loading ? 'Blocking...' : 'Block Date'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}