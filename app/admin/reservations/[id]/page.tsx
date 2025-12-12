'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, Users, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

// Helper function to safely format dates
const formatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return format(date, formatStr)
  } catch {
    return 'Invalid date'
  }
}
import { useTranslation } from '@/lib/use-translation'
import ReservationActions from '@/components/admin/reservation-actions'

interface ReservationPageProps {
  params: {
    id: string
  }
}

export default function ReservationPage({ params }: ReservationPageProps) {
  const { t } = useTranslation('admin')
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await fetch(`/api/admin/reservations/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setReservation(data.reservation)
          }
        }
      } catch (error) {
        console.error('Error fetching reservation:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReservation()
  }, [params.id])

  if (loading) {
    return <div className="container py-8">Loading...</div>
  }

  if (!reservation) {
    return <div className="container py-8">Reservation not found</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'AWAITING_APPROVAL': return 'bg-yellow-100 text-yellow-800'
      case 'PENDING': return 'bg-orange-100 text-orange-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('reservationDetails.backToDashboard')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('reservationDetails.title')}</h1>
          <p className="text-muted-foreground">
            {t('reservationDetails.subtitle')} #{reservation.id.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Reservation Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Guest Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('reservationDetails.guestInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">
                {reservation.users?.customer_profiles?.[0]?.full_name || reservation.users?.email || 'Anonymous Guest'}
              </h3>
              <p className="text-muted-foreground">{reservation.users?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Reservation Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reservationDetails.statusAndTiming')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge className={getStatusColor(reservation.status)} variant="secondary">
                {reservation.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">{t('reservationDetails.created')}</p>
                <p>{formatDate(reservation.created_at, 'MMM d, yyyy h:mm a')}</p>
              </div>
              {reservation.approved_at && (
                <div>
                  <p className="text-sm font-medium">{t('reservationDetails.approved')}</p>
                  <p>{formatDate(reservation.approved_at, 'MMM d, yyyy h:mm a')}</p>
                </div>
              )}
              {reservation.paid_at && (
                <div>
                  <p className="text-sm font-medium">{t('reservationDetails.paid')}</p>
                  <p>{formatDate(reservation.paid_at, 'MMM d, yyyy h:mm a')}</p>
                </div>
              )}
              {reservation.cancelled_at && (
                <div>
                  <p className="text-sm font-medium">{t('reservationDetails.cancelled')}</p>
                  <p>{formatDate(reservation.cancelled_at, 'MMM d, yyyy h:mm a')}</p>
                  {reservation.cancellation_reason && (
                    <p className="text-sm text-muted-foreground">
                      {t('reservationDetails.reason')}: {reservation.cancellation_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stay Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('reservationDetails.stayDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium mb-2">{t('reservationDetails.checkIn')}</p>
            <p className="text-lg font-semibold">
              {formatDate(reservation.check_in, 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{t('reservationDetails.checkOut')}</p>
            <p className="text-lg font-semibold">
              {formatDate(reservation.check_out, 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{t('reservationDetails.duration')}</p>
            <p className="text-lg font-semibold">{reservation.nights} {t('reservationDetails.nights')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('reservationDetails.pricingBreakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>{t('reservationDetails.subtotal')} ({reservation.nights} {t('reservationDetails.nights')})</span>
            <span>{formatCurrency(reservation.subtotal)}</span>
          </div>
          {reservation.fees > 0 && (
            <div className="flex justify-between">
              <span>{t('reservationDetails.fees')}</span>
              <span>{formatCurrency(reservation.fees)}</span>
            </div>
          )}
          {reservation.taxes > 0 && (
            <div className="flex justify-between">
              <span>{t('reservationDetails.taxes')}</span>
              <span>{formatCurrency(reservation.taxes)}</span>
            </div>
          )}
          <hr />
          <div className="flex justify-between font-semibold text-lg">
            <span>{t('reservationDetails.total')}</span>
            <span>{formatCurrency(reservation.total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <ReservationActions reservation={reservation} />
    </div>
  )
}