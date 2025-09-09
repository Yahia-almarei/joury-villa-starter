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
  Mail,
  Save,
  Edit,
  Plus,
  Trash2,
  Eye,
  Send,
  Calendar,
  User,
  CreditCard,
  FileText,
  Clock,
  Settings
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EmailTemplate {
  id: string
  name: string
  type: string
  subject: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const defaultTemplates = [
  {
    type: 'booking_confirmation',
    name: 'Booking Confirmation',
    subject: 'Booking Confirmed - Joury Villa {{reservation_id}}',
    content: `Hello {{guest_name}},

Thank you for booking with Joury Villa! Your reservation has been confirmed.

Booking Details:
- Reservation ID: {{reservation_id}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Guests: {{guest_count}}
- Total: {{total_amount}}

We&apos;re excited to host you at our beautiful villa in Jericho. If you have any questions or special requests, please don&apos;t hesitate to contact us.

Best regards,
The Joury Villa Team`
  },
  {
    type: 'booking_pending',
    name: 'Booking Pending Approval',
    subject: 'Booking Request Received - Joury Villa {{reservation_id}}',
    content: `Hello {{guest_name}},

Thank you for your booking request at Joury Villa. We have received your reservation and it is currently under review.

Booking Details:
- Reservation ID: {{reservation_id}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Guests: {{guest_count}}
- Total: {{total_amount}}

We will review your request and get back to you within 24 hours. You will receive another email once your booking is confirmed.

Best regards,
The Joury Villa Team`
  },
  {
    type: 'payment_received',
    name: 'Payment Confirmation',
    subject: 'Payment Received - Joury Villa {{reservation_id}}',
    content: `Hello {{guest_name}},

We have successfully received your payment for reservation {{reservation_id}}.

Payment Details:
- Amount: {{payment_amount}}
- Payment Method: {{payment_method}}
- Transaction ID: {{transaction_id}}
- Date: {{payment_date}}

Your booking is now fully confirmed. We look forward to welcoming you to Joury Villa!

Best regards,
The Joury Villa Team`
  },
  {
    type: 'cancellation',
    name: 'Booking Cancellation',
    subject: 'Booking Cancelled - Joury Villa {{reservation_id}}',
    content: `Hello {{guest_name}},

Your booking {{reservation_id}} has been cancelled as requested.

Cancelled Booking Details:
- Check-in Date: {{check_in_date}}
- Check-out Date: {{check_out_date}}
- Cancellation Date: {{cancellation_date}}

If this cancellation was made in error or if you have any questions, please contact us immediately.

We hope to welcome you to Joury Villa in the future.

Best regards,
The Joury Villa Team`
  },
  {
    type: 'check_in_reminder',
    name: 'Check-in Reminder',
    subject: 'Check-in Tomorrow - Joury Villa {{reservation_id}}',
    content: `Hello {{guest_name}},

This is a friendly reminder that your check-in at Joury Villa is tomorrow!

Arrival Details:
- Check-in Date: {{check_in_date}}
- Check-in Time: 3:00 PM
- Address: {{property_address}}
- Reservation ID: {{reservation_id}}

Important Information:
- Please bring a valid ID for all guests
- Check-in instructions will be sent separately
- Contact us if your arrival time changes

We&apos;re excited to welcome you to Joury Villa!

Best regards,
The Joury Villa Team`
  }
]

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'booking_confirmation',
    subject: '',
    content: '',
    is_active: true
  })
  
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    fetchTemplates()
  }, [])
  
  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('type', { ascending: true })
      
      if (error) {
        console.error('Error fetching templates:', error)
        // If no templates exist, create default ones
        if (error.code === 'PGRST116') {
          await createDefaultTemplates()
        }
        return
      }
      
      if (!data || data.length === 0) {
        await createDefaultTemplates()
        return
      }
      
      setTemplates(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const createDefaultTemplates = async () => {
    try {
      const templatesData = defaultTemplates.map(template => ({
        ...template,
        is_active: true
      }))
      
      const { error } = await supabase
        .from('email_templates')
        .insert(templatesData)
      
      if (!error) {
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error creating default templates:', error)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const templateData = {
        ...formData,
        updated_at: new Date().toISOString()
      }
      
      if (selectedTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id)
        
        if (error) {
          console.error('Error updating template:', error)
          return
        }
        
        // Log the action
        await supabase.from('audit_logs').insert({
          action: 'EMAIL_TEMPLATE_UPDATED',
          target_type: 'email_template',
          target_id: selectedTemplate.id,
          payload: templateData
        })
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert([templateData])
        
        if (error) {
          console.error('Error creating template:', error)
          return
        }
        
        // Log the action
        await supabase.from('audit_logs').insert({
          action: 'EMAIL_TEMPLATE_CREATED',
          target_type: 'email_template',
          target_id: templateData.name,
          payload: templateData
        })
      }
      
      fetchTemplates()
      resetForm()
      alert('Template saved successfully!')
      
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'booking_confirmation',
      subject: '',
      content: '',
      is_active: true
    })
    setShowEditor(false)
    setSelectedTemplate(null)
  }
  
  const handleEdit = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      content: template.content,
      is_active: template.is_active
    })
    setSelectedTemplate(template)
    setShowEditor(true)
  }
  
  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this email template?')) return
    
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)
      
      if (error) {
        console.error('Error deleting template:', error)
        return
      }
      
      fetchTemplates()
      
      // Log the action
      await supabase.from('audit_logs').insert({
        action: 'EMAIL_TEMPLATE_DELETED',
        target_type: 'email_template',
        target_id: templateId
      })
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  const sendTestEmail = async (template: EmailTemplate) => {
    if (!testEmail) {
      alert('Please enter a test email address')
      return
    }
    
    try {
      const response = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          template: template,
          testData: {
            guest_name: 'John Doe',
            reservation_id: 'RES-12345',
            check_in_date: 'December 25, 2024',
            check_out_date: 'December 30, 2024',
            guest_count: '4 guests (3 adults, 1 child)',
            total_amount: '₪3,500',
            payment_amount: '₪3,500',
            payment_method: 'PayPal',
            transaction_id: 'TXN-67890',
            payment_date: 'December 20, 2024',
            cancellation_date: 'December 22, 2024',
            property_address: 'Jericho, Palestinian Territories'
          }
        })
      })
      
      if (response.ok) {
        alert(`Test email sent to ${testEmail}`)
        setTestEmail('')
      } else {
        alert('Failed to send test email')
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      alert('Error sending test email')
    }
  }
  
  const toggleTemplate = async (templateId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !currentActive })
        .eq('id', templateId)
      
      if (error) {
        console.error('Error toggling template:', error)
        return
      }
      
      fetchTemplates()
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmation': return <Calendar className="w-4 h-4" />
      case 'booking_pending': return <Clock className="w-4 h-4" />
      case 'payment_received': return <CreditCard className="w-4 h-4" />
      case 'cancellation': return <FileText className="w-4 h-4" />
      case 'check_in_reminder': return <User className="w-4 h-4" />
      default: return <Mail className="w-4 h-4" />
    }
  }
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking_confirmation': return 'bg-green-100 text-green-800'
      case 'booking_pending': return 'bg-yellow-100 text-yellow-800'
      case 'payment_received': return 'bg-blue-100 text-blue-800'
      case 'cancellation': return 'bg-red-100 text-red-800'
      case 'check_in_reminder': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600">Manage automated email templates and notifications</p>
        </div>
        <Button
          onClick={() => setShowEditor(true)}
          className="bg-coral hover:bg-coral/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>
      
      {/* Email Template Editor */}
      {showEditor && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTemplate ? 'Edit Template' : 'Create New Template'}</CardTitle>
            <CardDescription>
              Design email templates with dynamic variables for automated notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Booking Confirmation"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-type">Template Type</Label>
                  <select
                    id="template-type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                  >
                    <option value="booking_confirmation">Booking Confirmation</option>
                    <option value="booking_pending">Booking Pending</option>
                    <option value="payment_received">Payment Received</option>
                    <option value="cancellation">Cancellation</option>
                    <option value="check_in_reminder">Check-in Reminder</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input
                  id="template-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Subject line with {{variables}}"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="template-content">Email Content</Label>
                <Textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Email body with {{variables}} for dynamic content..."
                  rows={12}
                  required
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
                <Label htmlFor="is_active">Active (will be used for automated emails)</Label>
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-coral hover:bg-coral/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : (selectedTemplate ? 'Update Template' : 'Create Template')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Templates List */}
      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading email templates...</p>
            </CardContent>
          </Card>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No email templates configured</p>
              <Button 
                onClick={() => setShowEditor(true)}
                className="mt-4"
                variant="outline"
              >
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(template.type)}
                        {template.name}
                      </CardTitle>
                      <Badge className={getTypeColor(template.type)}>
                        {template.type.replace('_', ' ')}
                      </Badge>
                      {!template.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Subject: {template.subject}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{template.name} Preview</DialogTitle>
                          <DialogDescription>
                            Preview how this email will look to recipients
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Subject:</Label>
                            <p className="text-sm bg-gray-50 p-2 rounded">{template.subject}</p>
                          </div>
                          <div>
                            <Label>Content:</Label>
                            <div className="text-sm bg-gray-50 p-4 rounded whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {template.content}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="test@example.com"
                              value={testEmail}
                              onChange={(e) => setTestEmail(e.target.value)}
                              type="email"
                            />
                            <Button onClick={() => sendTestEmail(template)}>
                              <Send className="w-4 h-4 mr-2" />
                              Send Test
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleTemplate(template.id, template.is_active)}
                    >
                      {template.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="text-sm text-gray-700 line-clamp-3">
                  {template.content.substring(0, 200)}...
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Last updated: {new Date(template.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Available Variables Help */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Available Template Variables:</strong>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Guest Info:</strong> {`{{guest_name}}, {{guest_count}}`}
            </div>
            <div>
              <strong>Booking:</strong> {`{{reservation_id}}, {{check_in_date}}, {{check_out_date}}`}
            </div>
            <div>
              <strong>Payment:</strong> {`{{total_amount}}, {{payment_method}}, {{transaction_id}}`}
            </div>
            <div>
              <strong>Property:</strong> {`{{property_address}}, {{property_name}}`}
            </div>
          </div>
          <p className="mt-2 text-sm">
            Variables will be automatically replaced with actual values when emails are sent.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}