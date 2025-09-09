import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'
import PendingReservations from '@/components/admin/pending-reservations'
import DashboardContent from '@/components/admin/dashboard-content'
import { startOfMonth, endOfMonth, addDays } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  await requireAdmin()

  // Get current month data
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Fetch real dashboard data using database adapter
  let pendingReservations: any[] = []
  let upcomingArrivals: any[] = []
  let monthlyRevenue = { _sum: { total: 0 }, _count: 0 }
  let totalUsers = 0
  let recentActivity: any[] = []

  try {
    // Use Promise.allSettled to handle errors gracefully and avoid worker overload
    const results = await Promise.allSettled([
      db.findReservationsByStatus('AWAITING_APPROVAL', 5),
      db.getUpcomingArrivals(now.toISOString(), addDays(now, 7).toISOString()),
      db.getMonthlyRevenue(monthStart.toISOString(), monthEnd.toISOString()),
      db.getUserCount('CUSTOMER'),
      db.getRecentAuditLogs(10)
    ])

    // Extract results with fallbacks
    pendingReservations = results[0].status === 'fulfilled' ? (results[0].value || []) : []
    upcomingArrivals = results[1].status === 'fulfilled' ? (results[1].value || []) : []
    monthlyRevenue = results[2].status === 'fulfilled' ? (results[2].value || { _sum: { total: 0 }, _count: 0 }) : { _sum: { total: 0 }, _count: 0 }
    totalUsers = results[3].status === 'fulfilled' ? (results[3].value || 0) : 0
    recentActivity = results[4].status === 'fulfilled' ? (results[4].value || []) : []

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Fallback values are already set above
  }

  return (
    <div>
      {/* Pending Approvals - Interactive Component */}
      <PendingReservations initialReservations={pendingReservations} />
      
      {/* Main Dashboard Content */}
      <DashboardContent
        pendingReservations={pendingReservations}
        upcomingArrivals={upcomingArrivals}
        monthlyRevenue={monthlyRevenue}
        totalUsers={totalUsers}
        recentActivity={recentActivity}
      />
    </div>
  )
}
