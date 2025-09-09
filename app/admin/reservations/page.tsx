'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/lib/use-translation'
import {
  Search,
  Filter,
  Download,
  Calendar,
  Users,
  DollarSign,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Mail,
  Phone
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import Link from 'next/link'
import { RescheduleDialog } from '@/components/admin/reschedule-dialog'

interface Reservation {
  id: string
  check_in: string
  check_out: string
  nights: number
  adults: number
  children: number
  total: number
  status: string
  created_at: string
  users: {
    email: string
    customer_profiles?: {
      full_name: string
      phone?: string
    }[]
  }
  properties: {
    name: string
  }
}

export default function AdminReservationsPage() {
  const { t } = useTranslation('admin')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
  useEffect(() => {
    fetchReservations()
  }, [statusFilter, dateFilter])
  
  const fetchReservations = async () => {
    setLoading(true)
    try {
      // Use the same API route as the calendar for consistent data
      const response = await fetch('/api/admin/reservations')
      const data = await response.json()
      
      if (!data.success) {
        console.error('Error fetching reservations:', data.error)
        setReservations([])
        return
      }
      
      let filteredReservations = data.reservations || []
      
      // Apply filters
      if (statusFilter !== 'all') {
        filteredReservations = filteredReservations.filter(
          (r: Reservation) => r.status.toLowerCase() === statusFilter.toLowerCase()
        )
      }
      
      if (dateFilter === 'upcoming') {
        filteredReservations = filteredReservations.filter(
          (r: Reservation) => new Date(r.check_in) >= new Date()
        )
      } else if (dateFilter === 'past') {
        filteredReservations = filteredReservations.filter(
          (r: Reservation) => new Date(r.check_out) < new Date()
        )
      }
      
      setReservations(filteredReservations)
    } catch (error) {
      console.error('Error:', error)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }
  
  const handleApprove = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'APPROVED',
          approved_at: new Date().toISOString()
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        console.error('Error approving reservation:', data.error)
        alert('Failed to approve reservation')
        return
      }
      
      // Refresh the list
      fetchReservations()
      
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to approve reservation')
    }
  }
  
  const handleDecline = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'CANCELLED',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Declined by admin'
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        console.error('Error declining reservation:', data.error)
        alert('Failed to decline reservation')
        return
      }
      
      fetchReservations()
      
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to decline reservation')
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'awaiting_approval': return 'bg-amber-100 text-amber-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      case 'awaiting_approval':
      case 'pending':
        return <Clock className="w-4 h-4" />
      default:
        return null
    }
  }
  
  const filteredReservations = reservations.filter(reservation =>
    searchTerm === '' ||
    reservation.users.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.users.customer_profiles?.[0]?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.id.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('reservations.title')}</h1>
          <p className="text-gray-600">{t('reservations.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('reservations.actions.export')}
          </Button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('reservations.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">{t('reservations.filters.status.all')}</option>
                <option value="awaiting_approval">{t('reservations.filters.status.awaitingApproval')}</option>
                <option value="pending">{t('reservations.filters.status.pendingPayment')}</option>
                <option value="approved">{t('reservations.filters.status.approved')}</option>
                <option value="paid">{t('reservations.filters.status.paid')}</option>
                <option value="cancelled">{t('reservations.filters.status.cancelled')}</option>
                <option value="refunded">{t('reservations.filters.status.refunded')}</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
              >
                <option value="all">{t('reservations.filters.dates.all')}</option>
                <option value="upcoming">{t('reservations.filters.dates.upcoming')}</option>
                <option value="past">{t('reservations.filters.dates.past')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('reservations.statistics.totalReservations')}</p>
                <p className="text-2xl font-bold">{reservations.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-coral" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('reservations.statistics.pendingApproval')}</p>
                <p className="text-2xl font-bold">
                  {reservations.filter(r => r.status === 'AWAITING_APPROVAL').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('reservations.statistics.thisMonthRevenue')}</p>
                <p className="text-2xl font-bold">
                  ₪{(reservations
                    .filter(r => {
                      if (r.status !== 'PAID' && r.status !== 'APPROVED') return false
                      const reservationDate = new Date(r.created_at)
                      const now = new Date()
                      return reservationDate.getFullYear() === now.getFullYear() && 
                             reservationDate.getMonth() === now.getMonth()
                    })
                    .reduce((sum, r) => sum + r.total, 0)
                  ).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('reservations.statistics.totalGuests')}</p>
                <p className="text-2xl font-bold">
                  {reservations
                    .filter(r => ['PAID', 'APPROVED'].includes(r.status))
                    .reduce((sum, r) => sum + r.adults + r.children, 0)
                  }
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reservations.table.title')}</CardTitle>
          <CardDescription>
            {t('reservations.table.description').replace('{filtered}', filteredReservations.length.toString()).replace('{total}', reservations.length.toString())}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('reservations.table.loading')}</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('reservations.table.noReservations')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">{t('reservations.table.headers.guest')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('reservations.table.headers.dates')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('reservations.table.headers.guests')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('reservations.table.headers.amount')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('reservations.table.headers.status')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('reservations.table.headers.created')}</th>
                    <th className="text-right p-4 font-medium text-gray-700">{t('reservations.table.headers.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {reservation.users.customer_profiles?.[0]?.full_name || t('reservations.table.guestInfo.guest')}
                          </div>
                          <div className="text-sm text-gray-600">{reservation.users.email}</div>
                          {reservation.users.customer_profiles?.[0]?.phone && (
                            <div className="text-sm text-gray-600">
                              {reservation.users.customer_profiles[0].phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(new Date(reservation.check_in), 'MMM d')} - {format(new Date(reservation.check_out), 'MMM d, yyyy')}
                          </div>
                          <div className="text-gray-600">{reservation.nights} {t('reservations.table.dateInfo.nights')}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {reservation.adults} {t('reservations.table.guestCount.adults')}
                          {reservation.children > 0 && `, ${reservation.children} ${t('reservations.table.guestCount.children')}`}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">₪{reservation.total.toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        <Badge className={`${getStatusColor(reservation.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(reservation.status)}
                          {reservation.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          {format(new Date(reservation.created_at), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {reservation.status === 'AWAITING_APPROVAL' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(reservation.id)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('reservations.actions.approve')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleDecline(reservation.id)}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                {t('reservations.actions.decline')}
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('reservations.actions.actions')}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/reservations/${reservation.id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  {t('reservations.actions.viewDetails')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="w-4 h-4 mr-2" />
                                {t('reservations.actions.sendEmail')}
                              </DropdownMenuItem>
                              <RescheduleDialog 
                                reservation={reservation} 
                                onRescheduleSuccess={fetchReservations}
                              >
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {t('reservations.actions.reschedule')}
                                </DropdownMenuItem>
                              </RescheduleDialog>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="w-4 h-4 mr-2" />
                                {t('reservations.actions.cancelBooking')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}