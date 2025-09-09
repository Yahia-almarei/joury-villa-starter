'use client'

import { useState } from 'react'
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

interface AddReservationDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
  initialStartDate?: string
  initialEndDate?: string
}

export function AddReservationDialog({ trigger, onSuccess, initialStartDate, initialEndDate }: AddReservationDialogProps) {
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
  const [adults, setAdults] = useState('2')
  const [children, setChildren] = useState('0')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('AWAITING_APPROVAL')

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
        adults: parseInt(adults),
        children: parseInt(children),
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
        setAdults('2')
        setChildren('0')
        setNotes('')
        setStatus('AWAITING_APPROVAL')
        onSuccess?.()
        
        alert('Reservation created successfully!')
      } else {
        alert(data.error || 'Failed to create reservation')
      }
    } catch (error) {
      console.error('Error creating reservation:', error)
      alert('Failed to create reservation')
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button className="w-full justify-start" variant="outline">
      <CalendarDays className="w-4 h-4 mr-2" />
      Add Reservation
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
            Add Reservation
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
                  disabledDates={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults">Adults</Label>
                <select
                  id="adults"
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num.toString()}>{num}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Children</Label>
                <select
                  id="children"
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {[0,1,2,3,4].map(num => (
                    <option key={num} value={num.toString()}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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