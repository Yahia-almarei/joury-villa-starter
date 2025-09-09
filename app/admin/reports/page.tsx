'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { 
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Clock
} from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface RevenueData {
  period: string
  revenue: number
  bookings: number
  averageRate: number
}

interface BookingStats {
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  pendingBookings: number
}

interface CustomerAnalytics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  averageSpend: number
  topSpenders: Array<{
    name: string
    email: string
    totalSpent: number
    bookings: number
  }>
}

export default function AdminReportsPage() {
  const { t } = useTranslation('admin')
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [refreshing, setRefreshing] = useState(false)
  const [isAllTime, setIsAllTime] = useState(false)
  
  // Analytics data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null)
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null)
  
  useEffect(() => {
    // Set default date range (last 6 months)
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    setDateFrom(sixMonthsAgo)
    setDateTo(now)
    
    fetchAnalytics()
  }, [])
  
  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Prepare date range - use "all time" if option is selected
      let fromDate, toDate

      if (isAllTime) {
        fromDate = '2020-01-01' // Far back date for all time
        toDate = new Date().toISOString().split('T')[0]
      } else {
        fromDate = dateFrom ? dateFrom.toISOString().split('T')[0] : '2024-01-01'
        toDate = dateTo ? dateTo.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }

      // Determine grouping based on date range
      const daysDiff = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24))
      let groupBy = 'month'

      if (daysDiff <= 31) {
        groupBy = 'day' // For ranges up to 1 month, show daily data
      } else if (daysDiff <= 180) {
        groupBy = 'week' // For ranges up to 6 months, show weekly data
      } else {
        groupBy = 'month' // For longer ranges, show monthly data
      }

      // Fetch analytics data from API endpoint
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateFrom: fromDate,
          dateTo: toDate,
          groupBy: groupBy
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()

      if (data.success) {
        setRevenueData(data.revenueData || [])
        setBookingStats(data.bookingStats || null)
        setCustomerAnalytics(data.customerAnalytics || null)
      } else {
        console.error('Analytics API error:', data.error)
      }
      
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }
  
  
  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalytics().finally(() => setRefreshing(false))
  }
  
  const exportReport = () => {
    // Generate CSV export
    const csvContent = generateCSVReport()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `joury-villa-report-${dateFrom}-to-${dateTo}.csv`
    link.click()
  }
  
  const generateCSVReport = (): string => {
    const dateRangeText = isAllTime 
      ? 'All Time' 
      : `${dateFrom?.toLocaleDateString()} to ${dateTo?.toLocaleDateString()}`
    
    let csv = `Joury Villa Analytics Report - ${dateRangeText}\n\n`
    
    // Revenue data
    csv += 'Revenue Data\n'
    csv += 'Period,Revenue,Bookings,Average Rate\n'
    revenueData.forEach(row => {
      csv += `${row.period},${row.revenue},${row.bookings},${row.averageRate.toFixed(2)}\n`
    })
    
    csv += '\nBooking Statistics\n'
    if (bookingStats) {
      csv += `Total Bookings,${bookingStats.totalBookings}\n`
      csv += `Confirmed Bookings,${bookingStats.confirmedBookings}\n`
      csv += `Cancelled Bookings,${bookingStats.cancelledBookings}\n`
      csv += `Pending Bookings,${bookingStats.pendingBookings}\n`
    }
    
    return csv
  }

  const handleAllTimeToggle = () => {
    const newAllTime = !isAllTime
    setIsAllTime(newAllTime)
    
    if (!newAllTime) {
      // Reset to default date range when turning off all time
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      setDateFrom(sixMonthsAgo)
      setDateTo(now)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-600">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('reports.actions.refresh')}
          </Button>
          <Button onClick={exportReport} className="bg-coral hover:bg-coral/90">
            <Download className="w-4 h-4 mr-2" />
            {t('reports.actions.exportReport')}
          </Button>
        </div>
      </div>
      
      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
                  setDateFrom(lastWeek)
                  setDateTo(now)
                  setIsAllTime(false)
                }}
                disabled={isAllTime}
                className="text-xs"
              >
                {t('reports.datePresets.last7days')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                  setDateFrom(lastMonth)
                  setDateTo(now)
                  setIsAllTime(false)
                }}
                disabled={isAllTime}
                className="text-xs"
              >
                {t('reports.datePresets.last30days')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const lastQuarter = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
                  setDateFrom(lastQuarter)
                  setDateTo(now)
                  setIsAllTime(false)
                }}
                disabled={isAllTime}
                className="text-xs"
              >
                {t('reports.datePresets.last3months')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const last6Months = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
                  setDateFrom(last6Months)
                  setDateTo(now)
                  setIsAllTime(false)
                }}
                disabled={isAllTime}
                className="text-xs"
              >
                {t('reports.datePresets.last6months')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  const thisYear = new Date(now.getFullYear(), 0, 1)
                  setDateFrom(thisYear)
                  setDateTo(now)
                  setIsAllTime(false)
                }}
                disabled={isAllTime}
                className="text-xs"
              >
                {t('reports.datePresets.thisYear')}
              </Button>
            </div>

            {/* All Time Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="all-time"
                checked={isAllTime}
                onChange={handleAllTimeToggle}
                className="h-4 w-4 text-coral border-gray-300 rounded focus:ring-coral focus:ring-2"
              />
              <Label htmlFor="all-time" className="text-sm font-medium">
                {t('reports.datePresets.showAllTime')}
              </Label>
            </div>

            {/* Date Range Pickers (disabled when All Time is selected) */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label>{t('reports.datePresets.fromDate')}</Label>
                <DatePicker
                  date={dateFrom}
                  onDateChange={setDateFrom}
                  placeholder={t('reports.filters.pickStartDate')}
                  disabled={isAllTime}
                  className={isAllTime ? 'opacity-50 cursor-not-allowed' : ''}
                />
              </div>
              <div className="flex-1">
                <Label>{t('reports.datePresets.toDate')}</Label>
                <DatePicker
                  date={dateTo}
                  onDateChange={setDateTo}
                  placeholder={t('reports.filters.pickEndDate')}
                  disabled={isAllTime}
                  className={isAllTime ? 'opacity-50 cursor-not-allowed' : ''}
                  disabledDates={(date) => {
                    if (!dateFrom) return false
                    return date < dateFrom
                  }}
                />
              </div>
              <Button onClick={fetchAnalytics}>
                <Filter className="w-4 h-4 mr-2" />
                {t('reports.datePresets.applyFilter')}
              </Button>
            </div>

            {/* Date Range Display */}
            <div className="text-sm text-gray-600">
              {isAllTime ? (
                <span className="font-medium text-coral">{t('reports.datePresets.showingAllTime')}</span>
              ) : (
                <span>
                  {t('reports.datePresets.showingDataFrom').replace('{from}', dateFrom?.toLocaleDateString() || t('reports.datePresets.start')).replace('{to}', dateTo?.toLocaleDateString() || t('reports.datePresets.end'))}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('reports.loading')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.keyMetrics.totalRevenue')}</p>
                    <p className="text-2xl font-bold">
                      ₪{revenueData.reduce((sum, r) => sum + r.revenue, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">+12% {t('reports.trends.fromLastPeriod')}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.keyMetrics.totalBookings')}</p>
                    <p className="text-2xl font-bold">{bookingStats?.totalBookings || 0}</p>
                    <p className="text-xs text-blue-600">{bookingStats?.confirmedBookings || 0} {t('reports.keyMetrics.confirmed')}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('reports.keyMetrics.activeCustomers')}</p>
                    <p className="text-2xl font-bold">{customerAnalytics?.totalCustomers || 0}</p>
                    <p className="text-xs text-orange-600">{customerAnalytics?.newCustomers || 0} {t('reports.keyMetrics.newThisMonth')}</p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {isAllTime ? t('reports.charts.allTimeRevenueTrend') : t('reports.charts.customPeriodRevenueTrend')}
              </CardTitle>
              <CardDescription>
                {isAllTime
                  ? t('reports.charts.revenueAllTime')
                  : t('reports.charts.revenueCustomPeriod').replace('{from}', dateFrom?.toLocaleDateString() || '').replace('{to}', dateTo?.toLocaleDateString() || '')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <div className="space-y-4">
                  {revenueData.map((data, index) => {
                    const maxRevenue = Math.max(...revenueData.map(r => r.revenue))
                    const barWidth = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0

                    return (
                      <div key={data.period} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{data.period}</span>
                          <div className="text-right">
                            <div className="font-bold">₪{data.revenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">{data.bookings} {t('reports.bookingsByStatus.bookings')}</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-coral h-3 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('reports.noData.message')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Booking Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                {t('reports.bookingsByStatus.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookingStats ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600">{t('reports.bookingStatus.confirmed')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(bookingStats.confirmedBookings / bookingStats.totalBookings) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{bookingStats.confirmedBookings}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-600">{t('reports.bookingStatus.pending')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(bookingStats.pendingBookings / bookingStats.totalBookings) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{bookingStats.pendingBookings}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600">{t('reports.bookingStatus.cancelled')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(bookingStats.cancelledBookings / bookingStats.totalBookings) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{bookingStats.cancelledBookings}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">{t('reports.noData.message')}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}