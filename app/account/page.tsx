import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CalendarDays, MapPin, Users, Clock, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

const supabase = createServerClient()

export default async function AccountPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/account')
  }

  const { data: users } = await supabase
    .from('users')
    .select(`
      *,
      customer_profiles(
        full_name,
        phone,
        country
      ),
      reservations(
        *,
        properties(
          name,
          address
        ),
        payments(*)
      )
    `)
    .eq('id', session.user.id)
    .limit(1)

  const user = users?.[0] as any

  if (!user) {
    redirect('/auth/signin')
  }

  // Sort reservations by check-in date descending
  const sortedReservations = (user.reservations || []).sort((a: any, b: any) => 
    new Date(b.check_in).getTime() - new Date(a.check_in).getTime()
  )

  const upcomingReservations = sortedReservations.filter((r: any) => 
    new Date(r.check_in) > new Date() && 
    ['PAID', 'APPROVED', 'AWAITING_APPROVAL'].includes(r.status)
  )
  
  const pastReservations = sortedReservations.filter((r: any) => 
    new Date(r.check_out) < new Date() && 
    ['PAID', 'APPROVED'].includes(r.status)
  )
  
  const pendingReservations = sortedReservations.filter((r: any) => 
    ['PENDING', 'AWAITING_APPROVAL'].includes(r.status)
  )

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.customer_profiles?.[0]?.full_name || user.email}
          </p>
        </div>
        <Link href="/availability">
          <Button>Book Another Stay</Button>
        </Link>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="font-medium">{user.customer_profiles?.[0]?.full_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="font-medium">{user.customer_profiles?.[0]?.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Country</label>
              <p className="font-medium">{user.customer_profiles?.[0]?.country || 'Not provided'}</p>
            </div>
          </div>
          <div className="pt-4">
            <Link href="/account/profile">
              <Button variant="outline">Edit Profile</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pending Reservations */}
      {pendingReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Reservations
            </CardTitle>
            <CardDescription>
              Reservations awaiting confirmation or payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReservations.map((reservation: any) => (
              <div key={reservation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{reservation.properties?.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {format(new Date(reservation.check_in), 'MMM d')} - {format(new Date(reservation.check_out), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {reservation.adults} adults, {reservation.children} children
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status.replace('_', ' ')}
                    </Badge>
                    <p className="font-semibold">{formatCurrency(reservation.total)}</p>
                  </div>
                </div>
                
                {reservation.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Link href={`/account/reservations/${reservation.id}`}>
                      <Button size="sm" variant="outline">View Details</Button>
                    </Link>
                    <Button size="sm">Complete Payment</Button>
                  </div>
                )}
                
                {reservation.status === 'AWAITING_APPROVAL' && (
                  <div className="text-sm text-muted-foreground">
                    Your reservation is being reviewed. You&apos;ll receive an email confirmation once approved.
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Upcoming Stays
          </CardTitle>
          <CardDescription>
            Your confirmed future reservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingReservations.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No upcoming stays</h3>
              <p className="text-muted-foreground mb-4">
                Ready to plan your next getaway to Joury Villa?
              </p>
              <Link href="/availability">
                <Button>Book Your Stay</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReservations.map((reservation: any) => (
                <div key={reservation.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{reservation.properties?.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {format(new Date(reservation.check_in), 'MMM d')} - {format(new Date(reservation.check_out), 'MMM d, yyyy')} ({reservation.nights} nights)
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {reservation.adults} adults, {reservation.children} children
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {reservation.properties?.address}
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                      <p className="font-semibold">{formatCurrency(reservation.total)}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/account/reservations/${reservation.id}`}>
                      <Button size="sm" variant="outline">View Details</Button>
                    </Link>
                    <Button size="sm" variant="outline">Request Changes</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Stays</CardTitle>
            <CardDescription>Your travel history with Joury Villa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastReservations.slice(0, 5).map((reservation: any) => (
                <div key={reservation.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="space-y-1">
                    <h4 className="font-medium">{reservation.properties?.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(new Date(reservation.check_in), 'MMM d')} - {format(new Date(reservation.check_out), 'MMM d, yyyy')}</span>
                      <span>{reservation.nights} nights</span>
                      <span>{reservation.adults} adults, {reservation.children} children</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-medium">{formatCurrency(reservation.total)}</p>
                    <Link href={`/account/reservations/${reservation.id}`}>
                      <Button size="sm" variant="ghost">View Details</Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              {pastReservations.length > 5 && (
                <div className="text-center pt-4">
                  <Link href="/account/history">
                    <Button variant="outline">View All Past Stays</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
