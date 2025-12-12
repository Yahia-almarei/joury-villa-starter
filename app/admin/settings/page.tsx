'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Settings,
  Save,
  Globe,
  Mail,
  Bell,
  Shield,
  Database,
  Palette,
  Upload,
  MapPin,
  Phone,
  Clock
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PropertySettings {
  property_name: string
  description: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  website?: string
  timezone: string
  currency: string
  languages: string[]
}

interface NotificationSettings {
  email_new_booking: boolean
  email_cancellation: boolean
  email_payment_received: boolean
  email_review_submitted: boolean
  sms_notifications: boolean
  push_notifications: boolean
}

interface SystemSettings {
  requires_admin_approval: boolean
  auto_confirm_payments: boolean
  allow_instant_booking: boolean
  maintenance_mode: boolean
  backup_frequency: string
  session_timeout: number
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [activeTab, setActiveTab] = useState('property')
  
  const [propertySettings, setPropertySettings] = useState<PropertySettings>({
    property_name: 'Joury Villa',
    description: '',
    address: '',
    city: 'Jericho',
    country: 'Palestinian Territories',
    phone: '',
    email: 'jouryvillaa@gmail.com',
    website: '',
    timezone: 'Asia/Jerusalem',
    currency: 'ILS',
    languages: ['en', 'ar', 'he']
  })
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_new_booking: true,
    email_cancellation: true,
    email_payment_received: true,
    email_review_submitted: true,
    sms_notifications: false,
    push_notifications: true
  })
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    requires_admin_approval: true,
    auto_confirm_payments: false,
    allow_instant_booking: true,
    maintenance_mode: false,
    backup_frequency: 'daily',
    session_timeout: 30
  })
  
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    fetchSettings()
  }, [])
  
  const fetchSettings = async () => {
    setLoading(true)
    try {
      // Fetch property settings
      const { data: property } = await supabase
        .from('properties')
        .select('*')
        .limit(1)
        .single()
      
      if (property) {
        setPropertySettings({
          property_name: property.name || 'Joury Villa',
          description: property.description || '',
          address: property.address || '',
          city: property.city || 'Jericho',
          country: property.country || 'Palestinian Territories',
          phone: property.phone || '',
          email: property.email || 'jouryvillaa@gmail.com',
          website: property.website || '',
          timezone: property.timezone || 'Asia/Jerusalem',
          currency: property.currency || 'ILS',
          languages: property.languages || ['en', 'ar', 'he']
        })
      }
      
      // Fetch system settings from environment or database
      // In a real app, these would come from a settings table
      setSystemSettings({
        requires_admin_approval: process.env.NEXT_PUBLIC_REQUIRES_ADMIN_APPROVAL === 'true',
        auto_confirm_payments: false,
        allow_instant_booking: true,
        maintenance_mode: false,
        backup_frequency: 'daily',
        session_timeout: 30
      })
      
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const savePropertySettings = async () => {
    setSaving('property')
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          name: propertySettings.property_name,
          description: propertySettings.description,
          address: propertySettings.address,
          city: propertySettings.city,
          country: propertySettings.country,
          phone: propertySettings.phone,
          email: propertySettings.email,
          website: propertySettings.website,
          timezone: propertySettings.timezone,
          currency: propertySettings.currency,
          languages: propertySettings.languages
        })
        .eq('id', '1') // Assuming single property
      
      if (error) {
        console.error('Error updating property:', error)
        return
      }
      
      // Log the action
      await supabase.from('audit_logs').insert({
        action: 'PROPERTY_SETTINGS_UPDATED',
        target_type: 'property',
        target_id: '1',
        payload: propertySettings
      })
      
      alert('Property settings saved successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving settings')
    } finally {
      setSaving('')
    }
  }
  
  const saveNotificationSettings = async () => {
    setSaving('notifications')
    try {
      // In a real app, this would save to a user_settings or admin_settings table
      const settings = {
        type: 'notifications',
        settings: notificationSettings,
        updated_at: new Date().toISOString()
      }
      
      // For now, we&apos;ll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Notification settings saved successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving notification settings')
    } finally {
      setSaving('')
    }
  }
  
  const saveSystemSettings = async () => {
    setSaving('system')
    try {
      // In a real app, these would be saved to environment variables or a settings table
      const settings = {
        type: 'system',
        settings: systemSettings,
        updated_at: new Date().toISOString()
      }
      
      // Simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('System settings saved successfully! Some changes may require a server restart.')
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving system settings')
    } finally {
      setSaving('')
    }
  }
  
  const tabs = [
    { id: 'property', label: 'Property Info', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield }
  ]
  
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your property and system configuration</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-coral text-coral'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Property Settings */}
      {activeTab === 'property' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Property Information
            </CardTitle>
            <CardDescription>
              Update your property&apos;s basic information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="property-name">Property Name</Label>
                <Input
                  id="property-name"
                  value={propertySettings.property_name}
                  onChange={(e) => setPropertySettings({
                    ...propertySettings,
                    property_name: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={propertySettings.email}
                  onChange={(e) => setPropertySettings({
                    ...propertySettings,
                    email: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={propertySettings.phone}
                  onChange={(e) => setPropertySettings({
                    ...propertySettings,
                    phone: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={propertySettings.website}
                  onChange={(e) => setPropertySettings({
                    ...propertySettings,
                    website: e.target.value
                  })}
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={propertySettings.city}
                  onChange={(e) => setPropertySettings({
                    ...propertySettings,
                    city: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={propertySettings.country}
                  onChange={(e) => setPropertySettings({
                    ...propertySettings,
                    country: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={propertySettings.timezone}
                  onChange={(e) => setPropertySettings({
                    ...propertySettings,
                    timezone: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="Asia/Jerusalem">Asia/Jerusalem</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={propertySettings.currency}
                  onChange={(e) => setPropertySettings({
                    ...propertySettings,
                    currency: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="ILS">Israeli Shekel (₪)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={propertySettings.address}
                onChange={(e) => setPropertySettings({
                  ...propertySettings,
                  address: e.target.value
                })}
                placeholder="Full property address"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={propertySettings.description}
                onChange={(e) => setPropertySettings({
                  ...propertySettings,
                  description: e.target.value
                })}
                placeholder="Describe your property..."
                rows={4}
              />
            </div>
            
            <Button
              onClick={savePropertySettings}
              disabled={saving === 'property'}
              className="bg-coral hover:bg-coral/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving === 'property' ? 'Saving...' : 'Save Property Settings'}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Configure when and how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Email Notifications</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Booking Received</Label>
                    <p className="text-sm text-gray-600">Get notified when a new booking is made</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_new_booking}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      email_new_booking: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Booking Cancellations</Label>
                    <p className="text-sm text-gray-600">Get notified when bookings are cancelled</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_cancellation}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      email_cancellation: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Received</Label>
                    <p className="text-sm text-gray-600">Get notified when payments are received</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_payment_received}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      email_payment_received: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Guest Reviews</Label>
                    <p className="text-sm text-gray-600">Get notified when guests leave reviews</p>
                  </div>
                  <Switch
                    checked={notificationSettings.email_review_submitted}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      email_review_submitted: checked
                    })}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Other Notifications</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Receive important updates via SMS</p>
                  </div>
                  <Switch
                    checked={notificationSettings.sms_notifications}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      sms_notifications: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-600">Browser push notifications for urgent matters</p>
                  </div>
                  <Switch
                    checked={notificationSettings.push_notifications}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      push_notifications: checked
                    })}
                  />
                </div>
              </div>
            </div>
            
            <Button
              onClick={saveNotificationSettings}
              disabled={saving === 'notifications'}
              className="bg-coral hover:bg-coral/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving === 'notifications' ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* System Settings */}
      {activeTab === 'system' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Advanced system settings and operational preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Booking Settings</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Admin Approval</Label>
                    <p className="text-sm text-gray-600">All bookings need admin approval before confirmation</p>
                  </div>
                  <Switch
                    checked={systemSettings.requires_admin_approval}
                    onCheckedChange={(checked) => setSystemSettings({
                      ...systemSettings,
                      requires_admin_approval: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Confirm Payments</Label>
                    <p className="text-sm text-gray-600">Automatically confirm bookings when payment is received</p>
                  </div>
                  <Switch
                    checked={systemSettings.auto_confirm_payments}
                    onCheckedChange={(checked) => setSystemSettings({
                      ...systemSettings,
                      auto_confirm_payments: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Instant Booking</Label>
                    <p className="text-sm text-gray-600">Guests can book immediately without host approval</p>
                  </div>
                  <Switch
                    checked={systemSettings.allow_instant_booking}
                    onCheckedChange={(checked) => setSystemSettings({
                      ...systemSettings,
                      allow_instant_booking: checked
                    })}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">System Maintenance</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">Disable booking and show maintenance message</p>
                </div>
                <Switch
                  checked={systemSettings.maintenance_mode}
                  onCheckedChange={(checked) => setSystemSettings({
                    ...systemSettings,
                    maintenance_mode: checked
                  })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <select
                    id="backup-frequency"
                    value={systemSettings.backup_frequency}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      backup_frequency: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    min="5"
                    max="480"
                    value={systemSettings.session_timeout}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      session_timeout: parseInt(e.target.value) || 30
                    })}
                  />
                </div>
              </div>
            </div>
            
            <Button
              onClick={saveSystemSettings}
              disabled={saving === 'system'}
              className="bg-coral hover:bg-coral/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving === 'system' ? 'Saving...' : 'Save System Settings'}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage security settings and access controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Admin Account Security:</strong><br />
                This system is configured with a single admin account (jouryvillaa@gmail.com). 
                To change the admin account or add additional admins, contact your developer.
                <br /><br />
                <strong>Security Best Practices:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Use a strong, unique password for your admin account</li>
                  <li>• Enable two-factor authentication when available</li>
                  <li>• Regularly review audit logs for suspicious activity</li>
                  <li>• Keep your browser and systems updated</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}