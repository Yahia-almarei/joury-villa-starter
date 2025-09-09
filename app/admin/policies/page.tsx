'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  FileText,
  Save,
  Edit,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTranslation } from '@/lib/use-translation'

interface Policy {
  id: string
  title: string
  type: string
  content: string
  is_active: boolean
  version: number
  effective_date?: string
  created_at: string
  updated_at: string
}

export default function AdminPoliciesPage() {
  const { t } = useTranslation('admin')
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [showNewPolicy, setShowNewPolicy] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'cancellation',
    content: '',
    is_active: true,
    effective_date: ''
  })
  
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    fetchPolicies()
  }, [])
  
  const fetchPolicies = async () => {
    setLoading(true)
    console.log('🔍 Fetching policies via API...')
    try {
      const response = await fetch('/api/admin/policies')
      const result = await response.json()
      
      if (!result.success) {
        console.error('❌ Error fetching policies:', result.error)
        alert('Error fetching policies: ' + result.error)
        return
      }
      
      console.log('📄 Fetched policies:', result.data)
      setPolicies(result.data || [])
    } catch (error) {
      console.error('💥 Unexpected error fetching policies:', error)
      alert('Unexpected error fetching policies: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    console.log('🚀 Starting policy creation/update...')
    console.log('📝 Form data:', formData)
    
    try {
      const policyData = {
        ...formData,
        effective_date: formData.effective_date || null,
        version: editingPolicy ? editingPolicy.version + 1 : 1
      }
      
      console.log('💾 Policy data to save:', policyData)
      
      if (editingPolicy) {
        console.log('✏️ Updating existing policy via API...')
        const response = await fetch('/api/admin/policies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPolicy.id, ...policyData })
        })
        
        const result = await response.json()
        
        if (!result.success) {
          console.error('❌ Error updating policy:', result.error)
          alert('Error updating policy: ' + result.error)
          return
        }
        console.log('✅ Policy updated successfully!')
      } else {
        console.log('➕ Creating new policy via API...')
        const response = await fetch('/api/admin/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(policyData)
        })
        
        const result = await response.json()
        
        if (!result.success) {
          console.error('❌ Error creating policy:', result.error)
          alert('Error creating policy: ' + result.error)
          return
        }
        console.log('✅ Policy created successfully!', result.data)
      }
      
      console.log('🔄 Refreshing policies list...')
      await fetchPolicies()
      resetForm()
      alert(t('policies.alerts.policySuccess'))
      
    } catch (error) {
      console.error('💥 Unexpected error:', error)
      alert('Unexpected error: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }
  
  const resetForm = () => {
    setFormData({
      title: '',
      type: 'cancellation',
      content: '',
      is_active: true,
      effective_date: ''
    })
    setShowNewPolicy(false)
    setEditingPolicy(null)
  }
  
  const handleEdit = (policy: Policy) => {
    setFormData({
      title: policy.title,
      type: policy.type,
      content: policy.content,
      is_active: policy.is_active,
      effective_date: policy.effective_date ? new Date(policy.effective_date).toISOString().split('T')[0] : ''
    })
    setEditingPolicy(policy)
    setShowNewPolicy(true)
  }
  
  const handleDelete = async (policyId: string) => {
    if (!confirm(t('policies.alerts.deleteConfirm'))) return
    
    try {
      console.log('🗑️ Deleting policy via API:', policyId)
      
      const response = await fetch(`/api/admin/policies?id=${policyId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        console.error('❌ Error deleting policy:', result.error)
        alert('Error deleting policy: ' + result.error)
        return
      }
      
      console.log('✅ Policy deleted successfully')
      fetchPolicies()
    } catch (error) {
      console.error('💥 Unexpected error deleting policy:', error)
      alert('Unexpected error: ' + (error as Error).message)
    }
  }
  
  const togglePolicy = async (policyId: string, currentActive: boolean) => {
    try {
      console.log('🔄 Toggling policy status via API:', policyId)
      
      const response = await fetch('/api/admin/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: policyId, 
          is_active: !currentActive 
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        console.error('❌ Error toggling policy:', result.error)
        alert('Error toggling policy: ' + result.error)
        return
      }
      
      console.log('✅ Policy status toggled successfully')
      fetchPolicies()
    } catch (error) {
      console.error('💥 Unexpected error toggling policy:', error)
      alert('Unexpected error: ' + (error as Error).message)
    }
  }
  
  const getPolicyTypeColor = (type: string) => {
    switch (type) {
      case 'cancellation': return 'bg-red-100 text-red-800'
      case 'terms': return 'bg-blue-100 text-blue-800'
      case 'privacy': return 'bg-purple-100 text-purple-800'
      case 'house_rules': return 'bg-green-100 text-green-800'
      case 'damage': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getPolicyTypeIcon = (type: string) => {
    switch (type) {
      case 'cancellation': return <AlertCircle className="w-4 h-4" />
      case 'terms': return <FileText className="w-4 h-4" />
      case 'privacy': return <Eye className="w-4 h-4" />
      case 'house_rules': return <CheckCircle className="w-4 h-4" />
      case 'damage': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }
  
  const getPolicyTypeName = (type: string) => {
    return t(`policies.types.${type}` as any) || type.replace('_', ' ')
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('policies.title')}</h1>
          <p className="text-gray-600">{t('policies.subtitle')}</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/policies/setup', { method: 'POST' })
                const result = await response.json()
                console.log('🧪 Database test result:', result)
                alert(result.success ? `✅ ${t('policies.alerts.testSuccess')}` : `❌ ${t('policies.alerts.testFail')} ${result.error}`)
              } catch (error) {
                console.error('Test failed:', error)
                alert(`❌ ${t('policies.alerts.testError')} ${(error as Error).message}`)
              }
            }}
          >
            🧪 {t('policies.actions.testDB')}
          </Button>
          <Button
            onClick={() => setShowNewPolicy(true)}
            className="bg-coral hover:bg-coral/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('policies.actions.newPolicy')}
          </Button>
        </div>
      </div>
      
      {/* New/Edit Policy Form */}
      {showNewPolicy && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPolicy ? t('policies.form.editTitle') : t('policies.form.createTitle')}</CardTitle>
            <CardDescription>
              {t('policies.form.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">{t('policies.form.policyTitle')}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('policies.form.policyTitlePlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">{t('policies.form.policyType')}</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                  >
                    <option value="cancellation">{t('policies.types.cancellation')}</option>
                    <option value="terms">{t('policies.types.terms')}</option>
                    <option value="privacy">{t('policies.types.privacy')}</option>
                    <option value="house_rules">{t('policies.types.house_rules')}</option>
                    <option value="damage">{t('policies.types.damage')}</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="effective_date">{t('policies.form.effectiveDate')}</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_active">{t('policies.form.isActive')}</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="content">{t('policies.form.policyContent')}</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={t('policies.form.policyContentPlaceholder')}
                  rows={10}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('policies.form.htmlFormatting')}
                </p>
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-coral hover:bg-coral/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? t('policies.form.saving') : (editingPolicy ? t('policies.form.updatePolicy') : t('policies.form.createPolicy'))}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t('policies.form.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Policies List */}
      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('policies.list.loading')}</p>
            </CardContent>
          </Card>
        ) : policies.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('policies.list.noPolicies')}</p>
              <Button 
                onClick={() => setShowNewPolicy(true)}
                className="mt-4"
                variant="outline"
              >
                {t('policies.list.createFirst')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          policies.map((policy) => (
            <Card key={policy.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="flex items-center gap-2">
                        {getPolicyTypeIcon(policy.type)}
                        {policy.title}
                      </CardTitle>
                      <Badge className={getPolicyTypeColor(policy.type)}>
                        {getPolicyTypeName(policy.type)}
                      </Badge>
                      {!policy.is_active && (
                        <Badge variant="secondary">{t('policies.list.inactive')}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{t('policies.list.version')} {policy.version}</span>
                      {policy.effective_date && (
                        <span>{t('policies.list.effective')} {new Date(policy.effective_date).toLocaleDateString()}</span>
                      )}
                      <span>{t('policies.list.updated')} {new Date(policy.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePolicy(policy.id, policy.is_active)}
                    >
                      {policy.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {policy.is_active ? t('policies.list.hide') : t('policies.list.show')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(policy)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(policy.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div 
                    className="text-sm text-gray-700 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: policy.content.substring(0, 200) + '...' }}
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3 p-0 h-auto"
                  onClick={() => handleEdit(policy)}
                >
                  <Globe className="w-4 h-4 mr-1" />
                  {t('policies.list.viewFull')}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Policy Management Help */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>{t('policies.help.title')}</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>{t('policies.help.versioning')}</li>
            <li>{t('policies.help.effectiveDates')}</li>
            <li>{t('policies.help.htmlFormatting')}</li>
            <li>{t('policies.help.activeStatus')}</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}