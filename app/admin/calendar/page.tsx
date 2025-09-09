import { CalendarClient } from '@/components/admin/calendar-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Plus, Filter, Download, Settings } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/database'
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { requireAdmin } from '@/lib/admin-auth'

export default async function AdminCalendarPage() {
  await requireAdmin()
  
  // Get current month data
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length
  
  // Fetch real calendar statistics
  let monthlyRevenue = { _sum: { total: 0 }, _count: 0 }
  let monthlyReservations: any[] = []
  let occupancyDays = 0
  let totalNights = 0
  
  try {
    const [revenueData, reservations] = await Promise.all([
      db.getMonthlyRevenue(monthStart.toISOString(), monthEnd.toISOString()),
      db.findReservationsByStatus('ALL') // Get all reservations and filter later
    ])
    
    monthlyRevenue = revenueData
    // Filter reservations to those overlapping with this month
    monthlyReservations = (reservations || []).filter((res: any) => {
      const checkIn = new Date(res.check_in)
      const checkOut = new Date(res.check_out)
      return checkIn <= monthEnd && checkOut >= monthStart
    })
    
    // Calculate occupancy and average stay
    monthlyReservations.forEach(res => {
      if (res.status !== 'CANCELLED') {
        const checkIn = new Date(res.check_in)
        const checkOut = new Date(res.check_out)
        const nights = res.nights || Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        
        // Count days within this month
        const monthOverlapStart = checkIn < monthStart ? monthStart : checkIn
        const monthOverlapEnd = checkOut > monthEnd ? monthEnd : checkOut
        const daysInThisMonth = Math.max(0, Math.ceil((monthOverlapEnd.getTime() - monthOverlapStart.getTime()) / (1000 * 60 * 60 * 24)))
        
        occupancyDays += daysInThisMonth
        totalNights += nights
      }
    })
  } catch (error) {
    console.error('Error fetching calendar data:', error)
  }
  
  const occupancyRate = Math.round((occupancyDays / daysInMonth) * 100)
  const averageStay = monthlyReservations.length > 0 ? (totalNights / monthlyReservations.length).toFixed(1) : '0.0'
  
  return (
    <CalendarClient 
      occupancyRate={occupancyRate}
      revenue={monthlyRevenue._sum.total || 0}
      reservationCount={monthlyRevenue._count || 0}
      averageStay={averageStay}
    />
  )
}