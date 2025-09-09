'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useTranslation } from '@/lib/use-translation'
import { 
  CalendarDays, 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Building
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface DashboardContentProps {
  pendingReservations: any[]
  upcomingArrivals: any[]
  monthlyRevenue: { _sum: { total: number }, _count: number }
  totalUsers: number
  recentActivity: any[]
}

export default function DashboardContent({
  pendingReservations,
  upcomingArrivals,
  monthlyRevenue,
  totalUsers,
  recentActivity
}: DashboardContentProps) {
  const { t } = useTranslation('admin')

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
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/calendar">
            <Button variant="outline">{t('dashboard.viewCalendar')}</Button>
          </Link>
          <Link href="/admin/reservations">
            <Button>{t('dashboard.manageReservations')}</Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.metrics.pendingApprovals')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReservations.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.metrics.requireAttention')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.metrics.monthlyRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyRevenue._sum.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyRevenue._count} {t('dashboard.metrics.bookingsThisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.metrics.upcomingArrivals')}</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingArrivals.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.metrics.next7Days')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.metrics.totalCustomers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.metrics.registeredUsers')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Arrivals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('dashboard.upcomingArrivals.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.upcomingArrivals.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingArrivals.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">{t('dashboard.upcomingArrivals.noArrivals')}</h3>
              <p className="text-muted-foreground">
                {t('dashboard.upcomingArrivals.allQuiet')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingArrivals.map((reservation: any) => (
                <div key={reservation.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="space-y-1">
                    <h4 className="font-medium">
                      {reservation.users?.customer_profiles?.[0]?.full_name || reservation.users?.email}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{t('dashboard.upcomingArrivals.checkIn')} {format(new Date(reservation.check_in), 'MMM d, yyyy')}</span>
                      <span>{reservation.nights} {t('dashboard.upcomingArrivals.nights')}</span>
                      <span>{reservation.adults} {t('dashboard.upcomingArrivals.adults')}, {reservation.children} {t('dashboard.upcomingArrivals.children')}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status}
                    </Badge>
                    <Link href={`/admin/reservations/${reservation.id}`}>
                      <Button size="sm" variant="ghost">{t('dashboard.upcomingArrivals.view')}</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions.reservations.title')}</CardTitle>
            <CardDescription>{t('dashboard.quickActions.reservations.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/reservations" className="block">
              <Button variant="outline" className="w-full justify-start">
                {t('dashboard.quickActions.reservations.allReservations')}
              </Button>
            </Link>
            <Link href="/admin/reservations?status=awaiting_approval" className="block">
              <Button variant="outline" className="w-full justify-start">
                {t('dashboard.quickActions.reservations.pendingApprovals')}
              </Button>
            </Link>
            <Link href="/admin/calendar" className="block">
              <Button variant="outline" className="w-full justify-start">
                {t('dashboard.quickActions.reservations.calendarView')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions.propertyManagement.title')}</CardTitle>
            <CardDescription>{t('dashboard.quickActions.propertyManagement.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/pricing" className="block">
              <Button variant="outline" className="w-full justify-start">
                {t('dashboard.quickActions.propertyManagement.pricingRules')}
              </Button>
            </Link>
            <Link href="/admin/coupons" className="block">
              <Button variant="outline" className="w-full justify-start">
                {t('dashboard.quickActions.propertyManagement.coupons')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions.systemManagement.title')}</CardTitle>
            <CardDescription>{t('dashboard.quickActions.systemManagement.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start">
                {t('dashboard.quickActions.systemManagement.userManagement')}
              </Button>
            </Link>
            <Link href="/admin/reports" className="block">
              <Button variant="outline" className="w-full justify-start">
                {t('dashboard.quickActions.systemManagement.reports')}
              </Button>
            </Link>
            <Link href="/admin/audit" className="block">
              <Button variant="outline" className="w-full justify-start">
                {t('dashboard.quickActions.systemManagement.auditLogs')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity.title')}</CardTitle>
          <CardDescription>{t('dashboard.recentActivity.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.slice(0, 8).map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div className="flex-1">
                  <p>
                    <span className="font-medium">
                      {log.users?.email || t('dashboard.recentActivity.system')}
                    </span>
                    {' '}
                    <span className="text-muted-foreground">
                      {log.action.toLowerCase().replace('_', ' ')}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="text-center pt-4">
              <Link href="/admin/audit">
                <Button variant="outline" size="sm">{t('dashboard.recentActivity.viewAllActivity')}</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}