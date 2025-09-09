import { requireAdmin } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Calendar, Users, DollarSign, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { notFound } from 'next/navigation'
import ReservationActions from '@/components/admin/reservation-actions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ReservationPageProps {
  params: {
    id: string
  }
}

export default async function ReservationPage({ params }: ReservationPageProps) {
  await requireAdmin()

  let reservation: any = null
  
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        users (
          email,
          customer_profiles (
            full_name,
            phone
          )
        ),
        properties (
          name
        )
      `)
      .eq('id', params.id)
      .single()
      
    if (error) {
      console.error('Error fetching reservation:', error)
    } else {
      reservation = data
    }
  } catch (error) {
    console.error('Error fetching reservation:', error)
  }

  if (!reservation) {
    notFound()
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
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Reservation Details</h1>
          <p className="text-muted-foreground">
            View and manage reservation #{reservation.id.slice(0, 8)}...
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
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">
                {reservation.users?.customer_profiles?.[0]?.full_name || reservation.users?.email || 'Anonymous Guest'}
              </h3>
              <p className="text-muted-foreground">{reservation.users?.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Adults</p>
                <p className="text-2xl font-bold">{reservation.adults}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Children</p>
                <p className="text-2xl font-bold">{reservation.children}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservation Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Timing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge className={getStatusColor(reservation.status)} variant="secondary">
                {reservation.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Created</p>
                <p>{format(new Date(reservation.created_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
              {reservation.approved_at && (
                <div>
                  <p className="text-sm font-medium">Approved</p>
                  <p>{format(new Date(reservation.approved_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              )}
              {reservation.paid_at && (
                <div>
                  <p className="text-sm font-medium">Paid</p>
                  <p>{format(new Date(reservation.paid_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              )}
              {reservation.cancelled_at && (
                <div>
                  <p className="text-sm font-medium">Cancelled</p>
                  <p>{format(new Date(reservation.cancelled_at), 'MMM d, yyyy h:mm a')}</p>
                  {reservation.cancellation_reason && (
                    <p className="text-sm text-muted-foreground">
                      Reason: {reservation.cancellation_reason}
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
            Stay Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium mb-2">Check-in</p>
            <p className="text-lg font-semibold">
              {format(new Date(reservation.check_in), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Check-out</p>
            <p className="text-lg font-semibold">
              {format(new Date(reservation.check_out), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Duration</p>
            <p className="text-lg font-semibold">{reservation.nights} nights</p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal ({reservation.nights} nights)</span>
            <span>{formatCurrency(reservation.subtotal)}</span>
          </div>
          {reservation.fees > 0 && (
            <div className="flex justify-between">
              <span>Fees</span>
              <span>{formatCurrency(reservation.fees)}</span>
            </div>
          )}
          {reservation.taxes > 0 && (
            <div className="flex justify-between">
              <span>Taxes</span>
              <span>{formatCurrency(reservation.taxes)}</span>
            </div>
          )}
          <hr />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(reservation.total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <ReservationActions reservation={reservation} />
    </div>
  )
}