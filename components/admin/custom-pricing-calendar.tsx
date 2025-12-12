'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, DollarSign, Save, Trash2, Calendar, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/use-translation'

interface CustomPrice {
  id: string
  date: string
  price_per_night: number
  notes?: string
}

interface CustomPricingCalendarProps {
  onPricingUpdate?: () => void
}

export function CustomPricingCalendar({ onPricingUpdate }: CustomPricingCalendarProps) {
  const { t } = useTranslation('admin')
  const [currentDate, setCurrentDate] = useState(new Date())

  const getTranslatedMonth = (date: Date) => {
    const monthKey = format(date, 'MMMM').toLowerCase() as keyof typeof t
    return t(`pricing.customDatePricing.monthNames.${monthKey}` as any) || format(date, 'MMMM')
  }
  const [customPrices, setCustomPrices] = useState<Map<string, CustomPrice>>(new Map())
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkNotes, setBulkNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [showBulkEditor, setShowBulkEditor] = useState(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  useEffect(() => {
    fetchCustomPricing()
  }, [currentDate, refreshKey])

  const fetchCustomPricing = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/custom-pricing?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}`
      )
      const data = await response.json()
      
      if (data.success) {
        const pricesMap = new Map<string, CustomPrice>()
        data.customPricing.forEach((price: CustomPrice) => {
          pricesMap.set(price.date, price)
        })
        setCustomPrices(pricesMap)
      }
    } catch (error) {
      console.error('Error fetching custom pricing:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const newSelected = new Set(selectedDates)
    
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr)
    } else {
      newSelected.add(dateStr)
    }
    
    setSelectedDates(newSelected)
  }

  const handleBulkPricing = async () => {
    if (selectedDates.size === 0) {
      alert('Please select at least one date')
      return
    }
    
    if (!bulkPrice || parseFloat(bulkPrice) <= 0) {
      alert('Please enter a valid price')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/custom-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dates: Array.from(selectedDates),
          pricePerNight: parseFloat(bulkPrice),
          notes: bulkNotes || null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(data.message)
        setSelectedDates(new Set())
        setBulkPrice('')
        setBulkNotes('')
        setShowBulkEditor(false)
        // Force a complete re-render by updating refresh key
        setRefreshKey(prev => prev + 1)
        onPricingUpdate?.()
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error setting custom pricing:', error)
      alert('Error setting custom pricing')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePricing = async () => {
    if (selectedDates.size === 0) {
      alert('Please select at least one date')
      return
    }

    if (!confirm(`Remove custom pricing for ${selectedDates.size} selected date(s)?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/custom-pricing?dates=${Array.from(selectedDates).join(',')}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('DELETE request failed:', response.status, errorText)
        alert(`Delete failed (${response.status}): ${errorText}`)
        return
      }

      const data = await response.json()
      
      if (data.success) {
        alert(data.message)
        setSelectedDates(new Set())
        // Force clear the calendar first to ensure fresh data
        setCustomPrices(new Map())
        // Force a complete re-render by updating refresh key
        setRefreshKey(prev => prev + 1)
        onPricingUpdate?.()
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error removing custom pricing:', error)
      alert('Error removing custom pricing')
    } finally {
      setLoading(false)
    }
  }

  const getDateClasses = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const hasCustomPrice = customPrices.has(dateStr)
    const isSelected = selectedDates.has(dateStr)
    
    const baseClasses = 'w-full h-16 p-2 border border-gray-200 text-left hover:bg-gray-50 transition-colors cursor-pointer'
    
    return cn(
      baseClasses,
      !isSameMonth(date, currentDate) && 'opacity-40',
      isToday(date) && 'ring-2 ring-coral',
      hasCustomPrice && 'bg-green-50 border-green-200',
      isSelected && 'ring-2 ring-blue-500 bg-blue-50'
    )
  }

  return (
    <Card key={refreshKey}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t('pricing.customDatePricing.title')}
        </CardTitle>
        <CardDescription>
          {t('pricing.customDatePricing.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {getTranslatedMonth(currentDate)} {format(currentDate, 'yyyy')}
          </h3>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentDate(new Date())}
            >
              {t('pricing.customDatePricing.today')}
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {[
            t('pricing.customDatePricing.dayNames.sunday'),
            t('pricing.customDatePricing.dayNames.monday'), 
            t('pricing.customDatePricing.dayNames.tuesday'),
            t('pricing.customDatePricing.dayNames.wednesday'),
            t('pricing.customDatePricing.dayNames.thursday'),
            t('pricing.customDatePricing.dayNames.friday'),
            t('pricing.customDatePricing.dayNames.saturday')
          ].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-gray-200 mb-4">
          {monthDays.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const customPrice = customPrices.get(dateStr)
            
            return (
              <button
                key={dateStr}
                className={getDateClasses(date)}
                onClick={() => handleDateClick(date)}
                disabled={loading}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      'text-sm font-medium',
                      !isSameMonth(date, currentDate) && 'text-gray-400',
                      isToday(date) && 'text-coral font-bold'
                    )}>
                      {format(date, 'd')}
                    </span>
                  </div>
                  
                  {customPrice && (
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-green-700">
                        ₪{customPrice.price_per_night}
                      </div>
                      {customPrice.notes && (
                        <div className="text-xs text-gray-500 truncate" title={customPrice.notes}>
                          {customPrice.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selection Info and Actions */}
        {selectedDates.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">
                  {selectedDates.size} {selectedDates.size === 1 ? t('pricing.customDatePricing.dateSelected') : t('pricing.customDatePricing.datesSelected')}
                </p>
                <p className="text-sm text-blue-700">
                  {Array.from(selectedDates).slice(0, 3).join(', ')}
                  {selectedDates.size > 3 && `, +${selectedDates.size - 3} more`}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => setShowBulkEditor(!showBulkEditor)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('pricing.customDatePricing.setPrice')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemovePricing}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t('pricing.customDatePricing.remove')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDates(new Set())}
                >
                  {t('pricing.customDatePricing.clearSelection')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Pricing Editor */}
        {showBulkEditor && (
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3">Set Custom Pricing</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bulk-price">{t('pricing.customDatePricing.pricePerNight')} *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="bulk-price"
                    type="number"
                    placeholder="500"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bulk-notes">{t('pricing.customDatePricing.notesOptional')}</Label>
                <Input
                  id="bulk-notes"
                  placeholder="Holiday pricing, etc."
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleBulkPricing}
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? t('pricing.customDatePricing.saving') : t('pricing.customDatePricing.applyToSelectedDates')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="space-y-2">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span>{t('pricing.customDatePricing.hasCustomPricing')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded"></div>
              <span>{t('pricing.customDatePricing.selected')}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Custom pricing shows: Base price per night
          </div>
        </div>
      </CardContent>
    </Card>
  )
}