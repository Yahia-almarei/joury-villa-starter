'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RescheduleDialog } from '@/components/admin/reschedule-dialog'
import { X, Clock, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Reservation {
  id: string
  status: string
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

interface ReservationActionsProps {
  reservation: Reservation
}

export default function ReservationActions({ reservation }: ReservationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const handleRescheduleSuccess = () => {
    router.refresh()
  }

  const handleApprove = async () => {
    setLoading(prev => ({ ...prev, approve: true }))
    
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        alert('Reservation approved successfully!')
        router.refresh()
      } else {
        const error = await response.json()
        alert('Error approving reservation: ' + error.error)
      }
    } catch (error) {
      alert('Error approving reservation: ' + error)
    } finally {
      setLoading(prev => ({ ...prev, approve: false }))
    }
  }

  const handleDecline = async () => {
    const reason = prompt('Please provide a reason for declining (optional):')
    setLoading(prev => ({ ...prev, decline: true }))
    
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        alert('Reservation declined successfully!')
        router.refresh()
      } else {
        const error = await response.json()
        alert('Error declining reservation: ' + error.error)
      }
    } catch (error) {
      alert('Error declining reservation: ' + error)
    } finally {
      setLoading(prev => ({ ...prev, decline: false }))
    }
  }

  const handleCancel = async () => {
    setLoading(prev => ({ ...prev, cancel: true }))
    
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      })

      if (response.ok) {
        alert('Reservation cancelled successfully!')
        setCancelDialogOpen(false)
        router.refresh()
      } else {
        const error = await response.json()
        alert('Error cancelling reservation: ' + error.error)
      }
    } catch (error) {
      alert('Error cancelling reservation: ' + error)
    } finally {
      setLoading(prev => ({ ...prev, cancel: false }))
    }
  }

  // Don't show actions for cancelled reservations
  if (reservation.status === 'CANCELLED') {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Actions</CardTitle>
        <CardDescription>
          Manage this reservation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Approval actions for pending reservations */}
          {reservation.status === 'AWAITING_APPROVAL' && (
            <>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={loading.approve}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {loading.approve ? 'Approving...' : 'Approve'}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDecline}
                disabled={loading.decline}
              >
                <X className="h-4 w-4 mr-2" />
                {loading.decline ? 'Declining...' : 'Decline'}
              </Button>
            </>
          )}

          {/* Cancel action - available for all non-cancelled reservations */}
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                <X className="h-4 w-4 mr-2" />
                Cancel Reservation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Reservation</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this reservation? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cancelReason">Reason (optional)</Label>
                  <Textarea
                    id="cancelReason"
                    placeholder="Enter reason for cancellation..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                  Keep Reservation
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancel}
                  disabled={loading.cancel}
                >
                  {loading.cancel ? 'Cancelling...' : 'Cancel Reservation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reschedule action - available for approved/paid reservations */}
          {(reservation.status === 'APPROVED' || reservation.status === 'PAID') && (
            <RescheduleDialog 
              reservation={reservation} 
              onRescheduleSuccess={handleRescheduleSuccess}
            >
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
            </RescheduleDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}