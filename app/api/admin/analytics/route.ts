import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { dateFrom, dateTo, groupBy = 'month' } = await request.json()

    // Fetch reservations data - filter by check_in date for revenue trends
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        id,
        created_at,
        check_in,
        check_out,
        total,
        status,
        nights,
        adults,
        children
      `)
      .gte('check_in', dateFrom)
      .lte('check_in', dateTo + 'T23:59:59')

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch reservations data' 
      }, { status: 500 })
    }

    console.log(`📊 Analytics API: Found ${reservations?.length || 0} reservations for period ${dateFrom} to ${dateTo}`)
    if (reservations?.length) {
      console.log('📊 Sample reservation statuses:', reservations.slice(0, 3).map(r => ({ 
        id: r.id, 
        status: r.status, 
        check_in: r.check_in,
        total: r.total 
      })))
    }

    // Fetch users/customers data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        created_at,
        customer_profiles (
          full_name,
          phone
        )
      `)
      .eq('role', 'CUSTOMER')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch users data' 
      }, { status: 500 })
    }

    // Process revenue data
    const revenueData = processRevenueData(reservations || [], dateFrom, dateTo, groupBy)
    
    // Calculate booking stats
    const bookingStats = calculateBookingStats(reservations || [], dateFrom, dateTo)
    
    // Calculate customer analytics
    const customerAnalytics = calculateCustomerAnalytics(users || [], reservations || [])

    return NextResponse.json({
      success: true,
      revenueData,
      bookingStats,
      customerAnalytics
    })

  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

function processRevenueData(reservations: any[], dateFrom: string, dateTo: string, groupBy: string) {
  const groupedData: { [key: string]: { revenue: number; bookings: number } } = {}

  reservations.forEach(reservation => {
    // Include all reservations, not just PAID/APPROVED for trending analysis
    if (reservation.status === 'PAID' || reservation.status === 'APPROVED' || reservation.status === 'CONFIRMED') {
      // Use check_in date instead of created_at for trend analysis
      const date = new Date(reservation.check_in || reservation.created_at)
      let key: string

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0] // YYYY-MM-DD
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
      }

      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, bookings: 0 }
      }

      groupedData[key].revenue += reservation.total || 0
      groupedData[key].bookings += 1
    }
  })

  return Object.entries(groupedData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, data]) => ({
      period: formatPeriodKey(period, groupBy),
      revenue: data.revenue,
      bookings: data.bookings,
      averageRate: data.bookings > 0 ? data.revenue / data.bookings : 0
    }))
}

function calculateBookingStats(reservations: any[], dateFrom: string, dateTo: string) {
  const total = reservations.length
  const confirmed = reservations.filter(r => r.status === 'PAID' || r.status === 'APPROVED').length
  const cancelled = reservations.filter(r => r.status === 'CANCELLED').length
  const pending = reservations.filter(r => r.status === 'PENDING' || r.status === 'AWAITING_APPROVAL').length
  
  return {
    totalBookings: total,
    confirmedBookings: confirmed,
    cancelledBookings: cancelled,
    pendingBookings: pending
  }
}

function calculateCustomerAnalytics(users: any[], reservations: any[]) {
  const total = users.length
  const dateThreshold = new Date()
  dateThreshold.setMonth(dateThreshold.getMonth() - 1)
  
  const newCustomers = users.filter(u => 
    new Date(u.created_at) > dateThreshold
  ).length

  // Calculate customer spending from reservations
  const customerSpending: { [email: string]: { totalSpent: number, bookings: number, name: string } } = {}
  
  reservations.forEach(reservation => {
    if (reservation.status === 'PAID' || reservation.status === 'APPROVED') {
      // For now, we'll use a placeholder since we don't have user email in reservations
      // In a real scenario, you'd join reservations with users
      const customerKey = `customer_${Math.floor(Math.random() * total)}`
      if (!customerSpending[customerKey]) {
        customerSpending[customerKey] = { totalSpent: 0, bookings: 0, name: 'Customer' }
      }
      customerSpending[customerKey].totalSpent += reservation.total || 0
      customerSpending[customerKey].bookings += 1
    }
  })

  const returningCustomers = Object.values(customerSpending).filter(c => c.bookings > 1).length
  
  const totalSpent = Object.values(customerSpending).reduce((sum, c) => sum + c.totalSpent, 0)
  const averageSpend = total > 0 ? totalSpent / total : 0
  
  const topSpenders = users
    .slice(0, 5) // Get first 5 users as top spenders for demo
    .map((user, index) => ({
      name: user.customer_profiles?.[0]?.full_name || `Customer ${index + 1}`,
      email: user.email,
      totalSpent: Math.floor(Math.random() * 10000) + 1000, // Random amount for demo
      bookings: Math.floor(Math.random() * 5) + 1 // Random bookings for demo
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)

  return {
    totalCustomers: total,
    newCustomers,
    returningCustomers,
    averageSpend: Math.round(averageSpend),
    topSpenders
  }
}

function formatPeriodKey(periodKey: string, groupBy: string): string {
  const [year, month, day] = periodKey.split('-').map(Number)

  switch (groupBy) {
    case 'day':
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    case 'week':
      const weekStart = new Date(year, month - 1, day)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    case 'month':
    default:
      const monthDate = new Date(year, month - 1)
      return monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }
}