'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/use-translation'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Ticket,
  Plus,
  Edit,
  Trash2,
  Save,
  Copy,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  CalendarIcon
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  percent_off?: number
  amount_off?: number
  valid_from?: string
  valid_to?: string
  min_nights?: number
  is_active: boolean
  is_public?: boolean
  created_at: string
}

export default function AdminCouponsPage() {
  const { t } = useTranslation('admin')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCoupon, setShowNewCoupon] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState('all')
  const [usageStats, setUsageStats] = useState({ count: 0, totalSaved: 0, loading: true })
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    percent_off: '',
    amount_off: '',
    valid_from: null as Date | null,
    valid_to: null as Date | null,
    min_nights: '',
    is_active: true,
    is_public: false
  })
  
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    fetchCoupons()
    fetchUsageStats()
  }, [])
  
  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/coupons')
      const result = await response.json()
      
      if (result.success) {
        setCoupons(result.coupons || [])
      } else {
        console.error('Error fetching coupons:', result.error)
        alert(`Failed to fetch coupons: ${result.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to fetch coupons')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchUsageStats = async () => {
    try {
      // Get current month start and end dates
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      
      // Query reservations that used coupons this month
      const { data, error } = await supabase
        .from('reservations')
        .select('coupon_code, coupon_discount_amount')
        .not('coupon_code', 'is', null)
        .not('coupon_discount_amount', 'is', null)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
      
      if (error) {
        console.error('Error fetching usage stats:', error)
        setUsageStats({ count: 0, totalSaved: 0, loading: false })
        return
      }
      
      const count = data?.length || 0
      const totalSaved = data?.reduce((sum, reservation) => {
        return sum + (reservation.coupon_discount_amount || 0)
      }, 0) || 0
      
      setUsageStats({ count, totalSaved, loading: false })
    } catch (error) {
      console.error('Error fetching usage stats:', error)
      setUsageStats({ count: 0, totalSaved: 0, loading: false })
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submitted with data:', formData)
    
    // Validate required fields
    if (!formData.code.trim()) {
      alert('Coupon code is required')
      return
    }
    
    if (formData.discount_type === 'percentage' && (!formData.percent_off || parseInt(formData.percent_off) <= 0)) {
      alert('Please enter a valid percentage')
      return
    }
    
    if (formData.discount_type === 'amount' && (!formData.amount_off || parseInt(formData.amount_off) <= 0)) {
      alert('Please enter a valid amount')
      return
    }
    
    try {
      const couponData: any = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        valid_from: formData.valid_from ? formData.valid_from.toISOString() : null,
        valid_to: formData.valid_to ? formData.valid_to.toISOString() : null,
        min_nights: formData.min_nights ? parseInt(formData.min_nights) : null,
        is_active: formData.is_active,
        is_public: formData.is_public
      }
      
      if (formData.discount_type === 'percentage') {
        couponData.percent_off = parseInt(formData.percent_off) || null
      } else {
        couponData.amount_off = parseInt(formData.amount_off) || null
      }
      
      console.log('Attempting to save coupon with data:', couponData)
      
      let response
      if (editingCoupon) {
        console.log('Updating existing coupon:', editingCoupon.id)
        couponData.id = editingCoupon.id
        
        response = await fetch('/api/admin/coupons', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(couponData),
        })
      } else {
        console.log('Creating new coupon')
        
        response = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(couponData),
        })
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log(editingCoupon ? 'Coupon updated successfully:' : 'Coupon created successfully:', result.coupon)
        await fetchCoupons()
        resetForm()
        alert(result.message)
      } else {
        console.error('Error saving coupon:', result.error)
        alert(result.error)
      }
      
    } catch (error) {
      console.error('Error:', error)
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      percent_off: '',
      amount_off: '',
      valid_from: null,
      valid_to: null,
      min_nights: '',
      is_active: true,
      is_public: false
    })
    setShowNewCoupon(false)
    setEditingCoupon(null)
  }
  
  const handleEdit = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discount_type: coupon.percent_off ? 'percentage' : 'amount',
      percent_off: coupon.percent_off?.toString() || '',
      amount_off: coupon.amount_off?.toString() || '',
      valid_from: coupon.valid_from ? new Date(coupon.valid_from) : null,
      valid_to: coupon.valid_to ? new Date(coupon.valid_to) : null,
      min_nights: coupon.min_nights?.toString() || '',
      is_active: coupon.is_active,
      is_public: coupon.is_public || false
    })
    setEditingCoupon(coupon)
    setShowNewCoupon(true)
  }
  
  const handleDelete = async (couponId: string) => {
    if (!confirm(t('coupons.alerts.deleteConfirm'))) return
    
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(result.message)
        fetchCoupons()
      } else {
        console.error('Error deleting coupon:', result.error)
        alert(result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete coupon')
    }
  }
  
  const toggleCoupon = async (couponId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentActive }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchCoupons()
      } else {
        console.error('Error toggling coupon:', result.error)
        alert(result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to toggle coupon')
    }
  }
  
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }
  
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = searchTerm === '' || 
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterActive === 'all' ||
      (filterActive === 'active' && coupon.is_active) ||
      (filterActive === 'inactive' && !coupon.is_active)
    
    return matchesSearch && matchesFilter
  })
  
  const getDiscountText = (coupon: Coupon) => {
    if (coupon.percent_off) {
      return `${coupon.percent_off}${t('coupons.table.discountText.percentOff')}`
    }
    if (coupon.amount_off) {
      return `₪${coupon.amount_off} ${t('coupons.table.discountText.amountOff')}`
    }
    return t('coupons.table.discountText.noDiscount')
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('coupons.title')}</h1>
          <p className="text-gray-600">{t('coupons.subtitle')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('coupons.actions.export')}
          </Button>
          <Button
            onClick={() => setShowNewCoupon(true)}
            className="bg-coral hover:bg-coral/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('coupons.actions.newCoupon')}
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
                placeholder={t('coupons.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
            >
              <option value="all">{t('coupons.filters.all')}</option>
              <option value="active">{t('coupons.filters.active')}</option>
              <option value="inactive">{t('coupons.filters.inactive')}</option>
            </select>
          </div>
        </CardContent>
      </Card>
      
      {/* New/Edit Coupon Form */}
      {showNewCoupon && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCoupon ? t('coupons.form.editTitle') : t('coupons.form.createTitle')}</CardTitle>
            <CardDescription>
              {t('coupons.form.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="code">{t('coupons.form.couponCode')}</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder={t('coupons.form.couponCodePlaceholder')}
                      required
                    />
                    <Button type="button" variant="outline" onClick={generateRandomCode}>
                      {t('coupons.form.generate')}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="discount_type">{t('coupons.form.discountType')}</Label>
                  <select
                    id="discount_type"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="percentage">{t('coupons.form.percentageOff')}</option>
                    <option value="amount">{t('coupons.form.fixedAmountOff')}</option>
                  </select>
                </div>
                
                {formData.discount_type === 'percentage' ? (
                  <div>
                    <Label htmlFor="percent_off">{t('coupons.form.percentageOffLabel')}</Label>
                    <Input
                      id="percent_off"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.percent_off}
                      onChange={(e) => setFormData({ ...formData, percent_off: e.target.value })}
                      placeholder="10"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="amount_off">{t('coupons.form.fixedAmountOffLabel')}</Label>
                    <Input
                      id="amount_off"
                      type="number"
                      min="1"
                      value={formData.amount_off}
                      onChange={(e) => setFormData({ ...formData, amount_off: e.target.value })}
                      placeholder="100"
                      required
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="min_nights">{t('coupons.form.minNights')}</Label>
                  <Input
                    id="min_nights"
                    type="number"
                    min="1"
                    value={formData.min_nights}
                    onChange={(e) => setFormData({ ...formData, min_nights: e.target.value })}
                    placeholder={t('coupons.form.minNightsPlaceholder')}
                  />
                </div>
                
                <div>
                  <Label>{t('coupons.form.validFrom')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.valid_from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.valid_from ? (
                          format(formData.valid_from, "PPP")
                        ) : (
                          <span>{t('coupons.form.selectStartDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.valid_from || undefined}
                        onSelect={(date) => setFormData({ ...formData, valid_from: date || null })}
                        disabled={(date) =>
                          date < new Date() && date.toDateString() !== new Date().toDateString()
                        }
                        initialFocus
                      />
                      {formData.valid_from && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setFormData({ ...formData, valid_from: null })}
                          >
                            {t('coupons.form.clearDate')}
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>{t('coupons.form.validUntil')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.valid_to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.valid_to ? (
                          format(formData.valid_to, "PPP")
                        ) : (
                          <span>{t('coupons.form.selectEndDate')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.valid_to || undefined}
                        onSelect={(date) => setFormData({ ...formData, valid_to: date || null })}
                        disabled={(date) =>
                          (date < new Date() && date.toDateString() !== new Date().toDateString()) ||
                          (formData.valid_from ? date < formData.valid_from : false)
                        }
                        initialFocus
                      />
                      {formData.valid_to && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setFormData({ ...formData, valid_to: null })}
                          >
                            {t('coupons.form.clearDate')}
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_active">{t('coupons.form.isActive')}</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_public" className="text-sm">
                    {t('coupons.form.isPublic')}
                    <div className="text-xs text-gray-500 mt-1">
                      {t('coupons.form.isPublicNote')}
                    </div>
                  </Label>
                </div>
                
              </div>
              
              <div className="flex space-x-4">
                <Button type="submit" className="bg-coral hover:bg-coral/90">
                  <Save className="w-4 h-4 mr-2" />
                  {editingCoupon ? t('coupons.form.updateCoupon') : t('coupons.form.createCoupon')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t('coupons.form.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('coupons.table.title')}</CardTitle>
          <CardDescription>
            {t('coupons.table.description').replace('{filtered}', filteredCoupons.length.toString()).replace('{total}', coupons.length.toString())}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('coupons.table.loading')}</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('coupons.table.noCoupons')}</p>
              {searchTerm && (
                <p className="text-sm">{t('coupons.table.adjustSearch')}</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">{t('coupons.table.headers.code')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('coupons.table.headers.discount')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('coupons.table.headers.validity')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('coupons.table.headers.minNights')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('coupons.table.headers.visibility')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('coupons.table.headers.status')}</th>
                    <th className="text-left p-4 font-medium text-gray-700">{t('coupons.table.headers.created')}</th>
                    <th className="text-right p-4 font-medium text-gray-700">{t('coupons.table.headers.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {coupon.code}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(coupon.code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-green-600">
                          {getDiscountText(coupon)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {coupon.valid_from && coupon.valid_to ? (
                            <div>
                              <div>{new Date(coupon.valid_from).toLocaleDateString()}</div>
                              <div className="text-gray-500">{t('coupons.table.validity.to')} {new Date(coupon.valid_to).toLocaleDateString()}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">{t('coupons.table.validity.noExpiry')}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {coupon.min_nights ? `${coupon.min_nights} ${t('coupons.table.nights')}` : '-'}
                      </td>
                      <td className="p-4">
                        <Badge className={`${coupon.is_public ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} flex items-center gap-1 w-fit`}>
                          {coupon.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {coupon.is_public ? t('coupons.table.visibility.public') : t('coupons.table.visibility.hidden')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={`${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} flex items-center gap-1 w-fit`}>
                          {coupon.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {coupon.is_active ? t('coupons.table.status.active') : t('coupons.table.status.inactive')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          {new Date(coupon.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleCoupon(coupon.id, coupon.is_active)}
                          >
                            {coupon.is_active ? t('coupons.table.actions.disable') : t('coupons.table.actions.enable')}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t('coupons.table.actions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(coupon.code)}>
                                <Copy className="w-4 h-4 mr-2" />
                                {t('coupons.table.actions.copyCode')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(coupon.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('coupons.table.actions.delete')}
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
      
      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('coupons.statistics.totalCoupons')}</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
              <Ticket className="w-8 h-8 text-coral" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('coupons.statistics.activeCoupons')}</p>
                <p className="text-2xl font-bold">{coupons.filter(c => c.is_active).length}</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('coupons.statistics.usageThisMonth')}</p>
                {usageStats.loading ? (
                  <p className="text-2xl font-bold animate-pulse text-gray-400">-</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{usageStats.count}</p>
                    <p className="text-xs text-gray-500">
                      {usageStats.totalSaved > 0 ? `₪${usageStats.totalSaved.toLocaleString()} ${t('coupons.statistics.saved')}` : t('coupons.statistics.noSavingsYet')}
                    </p>
                  </>
                )}
              </div>
              <Badge className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                %
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}