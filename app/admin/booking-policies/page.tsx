'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText,
  Save,
  Edit,
  Plus,
  Trash2,
  Clock,
  CreditCard,
  Home,
  XCircle,
  Languages,
  Loader2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BookingPolicy {
  id: string
  description_en: string
  description_ar: string | null
  is_active: boolean
}

const POLICY_TYPES = [
  { value: 'cancellation', label: 'Cancellation Policy', icon: XCircle },
  { value: 'checkin', label: 'Check-in/Check-out', icon: Clock },
  { value: 'payment', label: 'Payment Terms', icon: CreditCard },
  { value: 'house_rules', label: 'House Rules', icon: Home }
]

export default function BookingPoliciesPage() {
  const { t } = useTranslation('admin')
  const [policies, setPolicies] = useState<BookingPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPolicy, setEditingPolicy] = useState<BookingPolicy | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    description_en: '',
    description_ar: '',
    is_active: true
  })

  // Fetch booking policies
  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/admin/booking-policies')
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.policies || [])
      }
    } catch (error) {
      console.error('Failed to fetch booking policies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingPolicy ? `/api/admin/booking-policies/${editingPolicy.id}` : '/api/admin/booking-policies'
      const method = editingPolicy ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description_en: formData.description_en,
          description_ar: formData.description_ar || null,
          is_active: formData.is_active
        })
      })

      if (response.ok) {
        fetchPolicies()
        resetForm()
        alert(editingPolicy ? t('bookingPolicies.alerts.updateSuccess') : t('bookingPolicies.alerts.createSuccess'))
      } else {
        const error = await response.json()
        console.error('API Error:', error)
        alert('Error: ' + (error.error || error.message || 'Unknown error') + (error.details ? '\nDetails: ' + error.details : ''))
      }
    } catch (error) {
      alert(editingPolicy ? t('bookingPolicies.alerts.updateError') : t('bookingPolicies.alerts.createError'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (policy: BookingPolicy) => {
    setEditingPolicy(policy)
    setFormData({
      description_en: policy.description_en,
      description_ar: policy.description_ar || '',
      is_active: policy.is_active
    })
    setIsCreating(true)
  }

  const handleDelete = async (policyId: string) => {
    if (!confirm(t('bookingPolicies.alerts.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/admin/booking-policies/${policyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchPolicies()
        alert(t('bookingPolicies.alerts.deleteSuccess'))
      } else {
        alert(t('bookingPolicies.alerts.deleteError'))
      }
    } catch (error) {
      alert(t('bookingPolicies.alerts.deleteError'))
    }
  }

  const toggleActive = async (policy: BookingPolicy) => {
    try {
      const response = await fetch(`/api/admin/booking-policies/${policy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...policy,
          is_active: !policy.is_active
        })
      })

      if (response.ok) {
        fetchPolicies()
      }
    } catch (error) {
      alert(t('bookingPolicies.alerts.statusUpdateError'))
    }
  }

  const resetForm = () => {
    setFormData({
      description_en: '',
      description_ar: '',
      is_active: true
    })
    setEditingPolicy(null)
    setIsCreating(false)
  }

  const getIconComponent = (type: string) => {
    const policyType = POLICY_TYPES.find(pt => pt.value === type)
    return policyType ? policyType.icon : FileText
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>{t('bookingPolicies.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <FileText className="h-8 w-8 mr-3 text-coral" />
            {t('bookingPolicies.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('bookingPolicies.subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('bookingPolicies.addPolicy')}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPolicy ? t('bookingPolicies.form.editTitle') : t('bookingPolicies.form.createTitle')}</CardTitle>
            <CardDescription>
              {t('bookingPolicies.form.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* English Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Languages className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">{t('bookingPolicies.form.englishVersion')}</h3>
                </div>
                <div>
                  <Label htmlFor="description_en">{t('bookingPolicies.form.descriptionEnglish')}</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder={t('bookingPolicies.form.enterDescriptionEnglish')}
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Arabic Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Languages className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">{t('bookingPolicies.form.arabicVersion')}</h3>
                </div>
                <div>
                  <Label htmlFor="description_ar">{t('bookingPolicies.form.descriptionArabic')}</Label>
                  <Textarea
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    placeholder={t('bookingPolicies.form.enterDescriptionArabic')}
                    className="text-right"
                    dir="rtl"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">{t('bookingPolicies.form.active')}</Label>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('bookingPolicies.form.saving') : (editingPolicy ? t('bookingPolicies.form.updatePolicy') : t('bookingPolicies.form.createPolicy'))}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t('bookingPolicies.form.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Policies List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('bookingPolicies.list.currentPolicies')}</h2>
            <p className="text-muted-foreground">
              {policies.length} {policies.length !== 1 ? t('bookingPolicies.list.policiesConfigured') : t('bookingPolicies.list.policyConfigured')}
            </p>
          </div>
        </div>

        {policies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">{t('bookingPolicies.list.noPolicies')}</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('bookingPolicies.list.createFirst')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {policies.map((policy) => {
              const IconComponent = getIconComponent(policy.type)
              return (
                <div key={policy.id} className="space-y-4">
                  {/* Policy Management Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium">Policy #{policies.indexOf(policy) + 1}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant={policy.is_active ? "default" : "secondary"}>
                            {policy.is_active ? t('bookingPolicies.list.active') : t('bookingPolicies.list.inactive')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(policy)}
                      >
                        {policy.is_active ? t('bookingPolicies.list.deactivate') : t('bookingPolicies.list.activate')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(policy)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(policy.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Language Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* English Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Languages className="w-4 h-4" />
                          <CardTitle className="text-sm">{t('bookingPolicies.list.englishVersion')}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{policy.description_en}</p>
                      </CardContent>
                    </Card>

                    {/* Arabic Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Languages className="w-4 h-4" />
                          <CardTitle className="text-sm">{t('bookingPolicies.list.arabicVersion')}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 text-right" dir="rtl">
                          {policy.description_ar || t('bookingPolicies.list.noArabicDescription')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}