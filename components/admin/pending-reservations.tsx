'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/lib/use-translation'

interface Reservation {
  id: string
  check_in: string
  check_out: string
  adults: number
  children: number
  total: number
  status: string
  users?: {
    customer_profiles: {
      full_name: string
    }[]
  }
}

interface PendingReservationsProps {
  initialReservations: Reservation[]
}

export default function PendingReservations({ initialReservations }: PendingReservationsProps) {
  const { t } = useTranslation('admin')
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const handleApprove = async (reservationId: string) => {
    setLoading(prev => ({ ...prev, [reservationId]: true }))
    
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        // Remove from pending list
        setReservations(prev => prev.filter(r => r.id !== reservationId))
        alert('Reservation approved successfully!')
      } else {
        const error = await response.json()
        alert('Error approving reservation: ' + error.error)
      }
    } catch (error) {
      alert('Error approving reservation: ' + error)
    } finally {
      setLoading(prev => ({ ...prev, [reservationId]: false }))
    }
  }

  const handleDecline = async (reservationId: string) => {
    const reason = prompt('Please provide a reason for declining (optional):')
    
    setLoading(prev => ({ ...prev, [reservationId]: true }))
    
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        // Remove from pending list
        setReservations(prev => prev.filter(r => r.id !== reservationId))
        alert('Reservation declined successfully!')
      } else {
        const error = await response.json()
        alert('Error declining reservation: ' + error.error)
      }
    } catch (error) {
      alert('Error declining reservation: ' + error)
    } finally {
      setLoading(prev => ({ ...prev, [reservationId]: false }))
    }
  }

  if (reservations.length === 0) {
    return null // Hide the card if no pending reservations
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('dashboard.metrics.pendingApprovals')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.metrics.pendingApprovalsDesc')}
            </CardDescription>
          </div>
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {reservations.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {reservations.map((reservation) => (
          <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg mb-4 last:mb-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">
                  {reservation.users?.customer_profiles?.[0]?.full_name || 'Anonymous Guest'}
                </span>
                <Badge variant="secondary">
                  {new Date(reservation.check_in).toLocaleDateString()} - {new Date(reservation.check_out).toLocaleDateString()}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-4">
                <span>{reservation.adults + reservation.children} guests</span>
                <Badge variant={reservation.status === 'AWAITING_APPROVAL' ? 'destructive' : 'secondary'}>
                  Awaiting Approval
                </Badge>
                <p className="font-semibold">{formatCurrency(reservation.total)}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href={`/admin/reservations/${reservation.id}`}>
                <Button size="sm" variant="outline">{t('reservations.actions.reservationDetails')}</Button>
              </Link>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(reservation.id)}
                disabled={loading[reservation.id]}
              >
                {loading[reservation.id] ? 'Approving...' : 'Approve'}
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleDecline(reservation.id)}
                disabled={loading[reservation.id]}
              >
                {loading[reservation.id] ? 'Declining...' : 'Decline'}
              </Button>
            </div>
          </div>
        ))}
        
        {reservations.length > 5 && (
          <div className="text-center">
            <Link href="/admin/reservations?status=awaiting_approval">
              <Button variant="outline">View All Pending</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}