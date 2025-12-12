'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/use-translation'

import {
  DollarSign,
  Save,
  Calculator,
  Settings,
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CustomPricingCalendar } from '@/components/admin/custom-pricing-calendar'



interface PropertySettings {
  id: string
  property_id: string
  weekday_price_night: number
  weekend_price_night: number
  cleaning_fee: number
  vat_percent: number
  min_nights: number
  max_nights: number
  max_adults: number
  max_children: number
}

export default function AdminPricingPage() {
  const { t } = useTranslation('admin')
  const [baseSettings, setBaseSettings] = useState<PropertySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const supabase = createClientComponentClient()
  
  // Simulator state
  const [simCheckIn, setSimCheckIn] = useState('')
  const [simCheckOut, setSimCheckOut] = useState('')
  const [simAdults, setSimAdults] = useState(2)
  const [simulatedPrice, setSimulatedPrice] = useState<any>(null)
  
  useEffect(() => {
    fetchPricingData()
  }, [])
  
  const fetchPricingData = async () => {
    setLoading(true)
    try {
      // Fetch base property settings
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .limit(1)
        .single()

      if (property) {
        setBaseSettings(property)
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const saveBaseSettings = async () => {
    if (!baseSettings) return
    
    setSaving(true)
    try {
      // Use API route for proper database handling
      const response = await fetch('/api/admin/property/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekdayPriceNight: baseSettings.weekday_price_night,
          weekendPriceNight: baseSettings.weekend_price_night,
          cleaningFee: baseSettings.cleaning_fee,
          vatPercent: baseSettings.vat_percent,
          minNights: baseSettings.min_nights,
          maxNights: baseSettings.max_nights,
          maxAdults: baseSettings.max_adults,
          maxChildren: baseSettings.max_children,
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('Error updating settings:', result.error)
        alert('Error saving settings: ' + result.error)
        return
      }
      
      alert('Settings saved successfully!')
      
      // Refresh the data
      fetchPricingData()
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }
  

  
  const simulatePrice = () => {
    if (!baseSettings || !simCheckIn || !simCheckOut) return
    
    const checkIn = new Date(simCheckIn)
    const checkOut = new Date(simCheckOut)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    if (nights <= 0) {
      alert('Check-out must be after check-in')
      return
    }
    
    // Calculate weekday/weekend pricing
    // Weekend is Thursday, Friday, Saturday (4, 5, 6)
    let totalNightly = 0
    let weekdayNights = 0
    let weekendNights = 0
    
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkIn)
      currentDate.setDate(currentDate.getDate() + i)
      const dayOfWeek = currentDate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Weekend: Thursday (4), Friday (5), Saturday (6)
      if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) {
        weekendNights++
        totalNightly += baseSettings.weekend_price_night
      } else {
        weekdayNights++
        totalNightly += baseSettings.weekday_price_night
      }
    }
    
    let cleaningFee = baseSettings.cleaning_fee
    let subtotal = totalNightly + cleaningFee
    let vat = subtotal * (baseSettings.vat_percent / 100)
    let total = subtotal + vat
    
    setSimulatedPrice({
      nights,
      weekdayNights,
      weekendNights,
      weekdayRate: baseSettings.weekday_price_night,
      weekendRate: baseSettings.weekend_price_night,
      totalNightly,
      cleaningFee,
      subtotal,
      vat,
      total: Math.round(total),
      appliedRules: [`${weekdayNights} weekday nights, ${weekendNights} weekend nights`]
    })
  }
  

  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('pricing.title')}</h1>
          <p className="text-gray-600">{t('pricing.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setSimulatorOpen(!simulatorOpen)}
          >
            <Calculator className="w-4 h-4 mr-2" />
            {t('pricing.simulator.button')}
          </Button>
        </div>
      </div>
      
      {/* Price Simulator */}
      {simulatorOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              {t('pricing.simulator.title')}
            </CardTitle>
            <CardDescription>{t('pricing.simulator.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sim-checkin">{t('pricing.simulator.checkIn')}</Label>
                    <Input
                      id="sim-checkin"
                      type="date"
                      value={simCheckIn}
                      onChange={(e) => setSimCheckIn(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sim-checkout">{t('pricing.simulator.checkOut')}</Label>
                    <Input
                      id="sim-checkout"
                      type="date"
                      value={simCheckOut}
                      onChange={(e) => setSimCheckOut(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sim-adults">{t('pricing.simulator.adults')}</Label>
                  <Input
                    id="sim-adults"
                    type="number"
                    min="1"
                    value={simAdults}
                    onChange={(e) => setSimAdults(parseInt(e.target.value) || 0)}
                  />
                </div>
                <Button onClick={simulatePrice} className="w-full">
                  {t('pricing.simulator.calculate')}
                </Button>
              </div>
              
              {simulatedPrice && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">{t('pricing.simulator.breakdown.title')}</h4>
                  <div className="space-y-2 text-sm">
                    {simulatedPrice.weekdayNights > 0 && (
                      <div className="flex justify-between">
                        <span>{simulatedPrice.weekdayNights} weekday nights × ₪{simulatedPrice.weekdayRate}</span>
                        <span>₪{(simulatedPrice.weekdayNights * simulatedPrice.weekdayRate).toLocaleString()}</span>
                      </div>
                    )}
                    {simulatedPrice.weekendNights > 0 && (
                      <div className="flex justify-between">
                        <span>{simulatedPrice.weekendNights} weekend nights × ₪{simulatedPrice.weekendRate}</span>
                        <span>₪{(simulatedPrice.weekendNights * simulatedPrice.weekendRate).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t('pricing.simulator.breakdown.cleaningFee')}</span>
                      <span>₪{simulatedPrice.cleaningFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>{t('pricing.simulator.breakdown.subtotal')}</span>
                      <span>₪{simulatedPrice.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('pricing.simulator.breakdown.vat')} ({baseSettings?.vat_percent}%)</span>
                      <span>₪{simulatedPrice.vat.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>{t('pricing.simulator.breakdown.total')}</span>
                      <span>₪{simulatedPrice.total.toLocaleString()}</span>
                    </div>
                    {simulatedPrice.appliedRules.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600 mb-1">{t('pricing.simulator.breakdown.appliedRules')}</p>
                        {simulatedPrice.appliedRules.map((rule: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs mr-1">
                            {rule}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Pricing Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekday Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              {t('pricing.weekdayPricing.title')}
            </CardTitle>
            <CardDescription>{t('pricing.weekdayPricing.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {baseSettings && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="weekday-price">{t('pricing.weekdayPricing.pricePerNight')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="weekday-price"
                      type="number"
                      placeholder="500"
                      value={baseSettings.weekday_price_night}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        weekday_price_night: parseInt(e.target.value) || 0
                      })}
                      className="pl-10 text-lg font-semibold"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('pricing.weekdayPricing.appliedTo')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekend Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              {t('pricing.weekendPricing.title')}
            </CardTitle>
            <CardDescription>{t('pricing.weekendPricing.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {baseSettings && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="weekend-price">{t('pricing.weekendPricing.pricePerNight')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="weekend-price"
                      type="number"
                      placeholder="600"
                      value={baseSettings.weekend_price_night}
                      onChange={(e) => setBaseSettings({
                        ...baseSettings,
                        weekend_price_night: parseInt(e.target.value) || 0
                      })}
                      className="pl-10 text-lg font-semibold"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('pricing.weekendPricing.appliedTo')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('pricing.additionalSettings.title')}
          </CardTitle>
          <CardDescription>{t('pricing.additionalSettings.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {baseSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="cleaning-fee">{t('pricing.baseSettings.cleaningFee')}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="cleaning-fee"
                    type="number"
                    placeholder="100"
                    value={baseSettings.cleaning_fee}
                    onChange={(e) => setBaseSettings({
                      ...baseSettings,
                      cleaning_fee: parseInt(e.target.value) || 0
                    })}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="vat-percent">{t('pricing.baseSettings.vatPercent')}</Label>
                <Input
                  id="vat-percent"
                  type="number"
                  placeholder="17"
                  value={baseSettings.vat_percent}
                  onChange={(e) => setBaseSettings({
                    ...baseSettings,
                    vat_percent: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="min-nights">{t('pricing.baseSettings.minNights')}</Label>
                <Input
                  id="min-nights"
                  type="number"
                  placeholder="2"
                  value={baseSettings.min_nights}
                  onChange={(e) => setBaseSettings({
                    ...baseSettings,
                    min_nights: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="max-nights">{t('pricing.baseSettings.maxNights')}</Label>
                <Input
                  id="max-nights"
                  type="number"
                  placeholder="14"
                  value={baseSettings.max_nights}
                  onChange={(e) => setBaseSettings({
                    ...baseSettings,
                    max_nights: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="max-guests">{t('pricing.baseSettings.maxGuests')}</Label>
                <Input
                  id="max-guests"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="8"
                  value={baseSettings.max_adults || 0}
                  onChange={(e) => {
                    const totalGuests = parseInt(e.target.value) || 0
                    setBaseSettings({
                      ...baseSettings,
                      max_adults: totalGuests,
                      max_children: 0 // Set children to 0, total is controlled by max_adults
                    })
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('pricing.baseSettings.maxGuestsNote').replace('{count}', (baseSettings.max_adults || 0).toString())}
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={saveBaseSettings}
              disabled={saving}
              className="bg-coral hover:bg-coral/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? t('pricing.baseSettings.saving') : t('pricing.baseSettings.saveSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Custom Date Pricing */}
      <CustomPricingCalendar onPricingUpdate={() => console.log('Custom pricing updated')} />
      
    </div>
  )
}