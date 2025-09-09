'use client'

import { useState } from 'react'
import { Calendar } from '@/components/admin/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/lib/use-translation'
import {
  CalendarDays,
  Plus,
  Filter,
  Download,
  Eye,
  EyeOff,
  Unlock
} from 'lucide-react'
import { BlockDatesDialog } from '@/components/admin/block-dates-dialog'
import { AddReservationDialog } from '@/components/admin/add-reservation-dialog'

interface CalendarClientProps {
  occupancyRate: number
  revenue: number
  reservationCount: number
  averageStay: string
}

export function CalendarClient({ occupancyRate, revenue, reservationCount, averageStay }: CalendarClientProps) {
  const { t } = useTranslation('admin')
  const [viewType] = useState<'month'>('month') // Fixed to month view only
  const [showAvailability, setShowAvailability] = useState(true)
  const [showReservations, setShowReservations] = useState(true)
  const [showBlocked, setShowBlocked] = useState(true)
  const [calendarKey, setCalendarKey] = useState(0) // For refreshing calendar
  const [selectedAction, setSelectedAction] = useState<'none' | 'block' | 'reserve' | 'unblock'>('none')
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('calendar.title')}</h1>
          <p className="text-gray-600">{t('calendar.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="default"
            size="sm"
            disabled
          >
            {t('calendar.viewType.month')}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('calendar.actions.export')}
          </Button>
        </div>
      </div>
      
      {/* Controls and Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <Calendar
                key={calendarKey}
                viewType="month"
                showAvailability={showAvailability}
                showReservations={showReservations}
                showBlocked={showBlocked}
                selectedAction={selectedAction}
                onCalendarUpdate={() => setCalendarKey(prev => prev + 1)}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('calendar.quickActions.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BlockDatesDialog
                onSuccess={() => setCalendarKey(prev => prev + 1)}
              />
              <AddReservationDialog
                onSuccess={() => setCalendarKey(prev => prev + 1)}
              />

              <Button
                variant={selectedAction === 'unblock' ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setSelectedAction(selectedAction === 'unblock' ? 'none' : 'unblock')}
              >
                <Unlock className="w-4 h-4 mr-2" />
                {selectedAction === 'unblock' ? t('calendar.quickActions.cancelUnblock') : t('calendar.quickActions.selectDatesToUnblock')}
              </Button>
            </CardContent>
          </Card>
          
          {/* View Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('calendar.viewOptions.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('calendar.viewOptions.availableDates')}</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAvailability(!showAvailability)}
                >
                  {showAvailability ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('calendar.viewOptions.reservations')}</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReservations(!showReservations)}
                >
                  {showReservations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{t('calendar.viewOptions.blockedPeriods')}</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBlocked(!showBlocked)}
                >
                  {showBlocked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('calendar.legend.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
                <span className="text-sm">{t('calendar.legend.available')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
                <span className="text-sm">{t('calendar.legend.reserved')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-amber-200 border border-amber-300 rounded"></div>
                <span className="text-sm">{t('calendar.legend.pendingApproval')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-200 border border-red-300 rounded"></div>
                <span className="text-sm">{t('calendar.legend.blocked')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-200 border border-purple-300 rounded"></div>
                <span className="text-sm">{t('calendar.legend.checkInOut')}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Real Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('calendar.statistics.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('calendar.statistics.occupancyRate')}</span>
                <span className="text-sm font-medium">{occupancyRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('calendar.statistics.revenue')}</span>
                <span className="text-sm font-medium">₪{revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('calendar.statistics.reservations')}</span>
                <span className="text-sm font-medium">{reservationCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('calendar.statistics.avgStay')}</span>
                <span className="text-sm font-medium">{averageStay} {t('calendar.statistics.nights')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}