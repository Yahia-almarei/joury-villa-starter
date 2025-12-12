'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/use-translation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Home,
  Save,
  Edit,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Languages
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface HouseRule {
  id: string
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string
  icon: string
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

const ICON_OPTIONS = [
  { value: 'Clock', label: 'Clock', icon: Clock },
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'AlertCircle', label: 'Alert', icon: AlertCircle }
]

export default function HouseRulesPage() {
  const { t } = useTranslation('admin');
  const [houseRules, setHouseRules] = useState<HouseRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<HouseRule | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    description_en: '',
    description_ar: '',
    is_active: true
  })

  // Fetch house rules
  const fetchHouseRules = async () => {
    try {
      const response = await fetch('/api/admin/house-rules')
      if (response.ok) {
        const data = await response.json()
        setHouseRules(data.houseRules || [])
      }
    } catch (error) {
      console.error('Failed to fetch house rules:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHouseRules()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingRule ? `/api/admin/house-rules/${editingRule.id}` : '/api/admin/house-rules'
      const method = editingRule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description_en: formData.description_en,
          description_ar: formData.description_ar,
          icon: 'Clock',
          is_active: formData.is_active,
          order_index: editingRule?.order_index || houseRules.length
        })
      })

      if (response.ok) {
        fetchHouseRules()
        resetForm()
        alert(editingRule ? t('policies.alerts.updateSuccess') : t('policies.alerts.createSuccess'))
      } else {
        const error = await response.json()
        alert(t('policies.alerts.createError') + ': ' + error.message)
      }
    } catch (error) {
      alert(t('policies.alerts.createError'))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (rule: HouseRule) => {
    setEditingRule(rule)
    setFormData({
      description_en: rule.description_en || '',
      description_ar: rule.description_ar || '',
      is_active: rule.is_active
    })
    setIsCreating(true)
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm(t('policies.alerts.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/admin/house-rules/${ruleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchHouseRules()
        alert(t('policies.alerts.deleteSuccess'))
      } else {
        alert(t('policies.alerts.deleteError'))
      }
    } catch (error) {
      alert(t('policies.alerts.deleteError'))
    }
  }

  const toggleActive = async (rule: HouseRule) => {
    try {
      const response = await fetch(`/api/admin/house-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, is_active: !rule.is_active })
      })

      if (response.ok) {
        fetchHouseRules()
      }
    } catch (error) {
      alert(t('policies.alerts.updateError'))
    }
  }

  const resetForm = () => {
    setFormData({
      description_en: '',
      description_ar: '',
      is_active: true
    })
    setEditingRule(null)
    setIsCreating(false)
  }

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName)
    return iconOption ? iconOption.icon : Clock
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">{t('policies.loading')}</div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('policies.title')}</h1>
          <p className="text-muted-foreground">
            {t('policies.subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('policies.addHouseRule')}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule ? t('policies.form.editTitle') : t('policies.form.createTitle')}</CardTitle>
            <CardDescription>
              {t('policies.form.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* English Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Languages className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">{t('policies.form.englishVersion')}</h3>
                </div>
                <div>
                  <Label htmlFor="description_en">{t('policies.form.houseRuleEnglish')}</Label>
                  <Input
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder={t('policies.form.enterRuleEnglish')}
                    required
                  />
                </div>
              </div>

              {/* Arabic Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Languages className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">{t('policies.form.arabicVersion')}</h3>
                </div>
                <div>
                  <Label htmlFor="description_ar">{t('policies.form.houseRuleArabic')}</Label>
                  <Input
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    placeholder={t('policies.form.enterRuleArabic')}
                    className="text-right"
                    dir="rtl"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">{t('policies.form.active')}</Label>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('policies.form.saving') : (editingRule ? t('policies.form.updateRule') : t('policies.form.createRule'))}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t('policies.form.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* House Rules List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('policies.list.currentRules')}</h2>
            <p className="text-muted-foreground">
              {houseRules.length} {houseRules.length !== 1 ? t('policies.list.rulesConfigured') : t('policies.list.ruleConfigured')}
            </p>
          </div>
        </div>

        {houseRules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Home className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">{t('policies.list.noRules')}</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('policies.list.createFirst')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {houseRules.map((rule) => {
              const IconComponent = getIconComponent(rule.icon)
              return (
                <div key={rule.id} className="space-y-4">
                  {/* Rule Management Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? t('policies.list.active') : t('policies.list.inactive')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(rule)}
                      >
                        {rule.is_active ? t('policies.list.deactivate') : t('policies.list.activate')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
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
                          <CardTitle className="text-sm">{t('policies.list.englishVersion')}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{rule.description_en || t('policies.list.noEnglishDescription')}</p>
                      </CardContent>
                    </Card>

                    {/* Arabic Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Languages className="w-4 h-4" />
                          <CardTitle className="text-sm">{t('policies.list.arabicVersion')}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 text-right" dir="rtl">{rule.description_ar || t('policies.list.noArabicDescription')}</p>
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