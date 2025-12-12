'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from '@/lib/use-translation'
import { Shield, Save, Eye, Languages } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

interface SecurityDepositSettings {
  enabled: boolean
  amount: number
  currency: string
  title_en: string
  title_ar: string
  message_en: string
  message_ar: string
  bankAccountInfo_en: string
  bankAccountInfo_ar: string
  confirmationText_en: string
  confirmationText_ar: string
}

export default function AdminSecurityDepositPage() {
  const { t, language } = useTranslation('admin')
  const [settings, setSettings] = useState<SecurityDepositSettings>({
    enabled: false,
    amount: 500,
    currency: 'ILS',
    title_en: 'Security Deposit Required',
    title_ar: 'مطلوب دفع تأمين',
    message_en: 'A security deposit is required to complete your booking. Please transfer the amount below to our bank account and confirm that you have sent the payment.',
    message_ar: 'مطلوب دفع تأمين لإتمام حجزك. يرجى تحويل المبلغ أدناه إلى حسابنا المصرفي وتأكيد أنك قمت بإرسال الدفعة.',
    bankAccountInfo_en: 'Bank: Example Bank\nAccount Number: 123-456789\nAccount Name: Joury Villa\nBranch: Main Branch',
    bankAccountInfo_ar: 'البنك: بنك المثال\nرقم الحساب: 123-456789\nاسم الحساب: فيلا جوري\nالفرع: الفرع الرئيسي',
    confirmationText_en: 'I confirm that I have transferred the security deposit',
    confirmationText_ar: 'أؤكد أنني قمت بتحويل مبلغ التأمين'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/security-deposit')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Error fetching security deposit settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/security-deposit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (data.success) {
        alert(t('securityDeposit.alerts.saveSuccess'))
      } else {
        alert(t('securityDeposit.alerts.saveError') + ': ' + data.error)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(t('securityDeposit.alerts.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof SecurityDepositSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">{t('securityDeposit.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('securityDeposit.title')}</h1>
          <p className="text-muted-foreground">
            {t('securityDeposit.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                {t('securityDeposit.preview')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  {language === 'ar' ? settings.title_ar : settings.title_en}
                </DialogTitle>
                <DialogDescription className="text-left whitespace-pre-line">
                  {language === 'ar' ? settings.message_ar : settings.message_en}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">{t('securityDeposit.preview.depositAmount')}</h4>
                  <p className="text-2xl font-bold text-blue-700">
                    {settings.currency} {settings.amount.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{t('securityDeposit.preview.bankAccountDetails')}</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {language === 'ar' ? settings.bankAccountInfo_ar : settings.bankAccountInfo_en}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="preview-confirm" className="border-2 border-gray-400" />
                  <label htmlFor="preview-confirm" className="text-sm text-gray-900 cursor-pointer">
                    {language === 'ar' ? settings.confirmationText_ar : settings.confirmationText_en}
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  {t('securityDeposit.preview.closePreview')}
                </Button>
                <Button disabled>
                  {t('securityDeposit.preview.submitBookingRequest')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('securityDeposit.saving') : t('securityDeposit.saveSettings')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('securityDeposit.configuration.title')}
            </CardTitle>
            <CardDescription>
              {t('securityDeposit.configuration.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled" className="text-base font-medium">
                  {t('securityDeposit.configuration.enable')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('securityDeposit.configuration.enableDescription')}
                </p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => handleInputChange('enabled', checked)}
              />
            </div>

            {settings.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">{t('securityDeposit.configuration.amount')}</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={settings.amount}
                      onChange={(e) => handleInputChange('amount', Number(e.target.value))}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">{t('securityDeposit.configuration.currency')}</Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      placeholder="ILS"
                    />
                  </div>
                </div>

                <Tabs defaultValue="en" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en" className="flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      {t('securityDeposit.content.english')}
                    </TabsTrigger>
                    <TabsTrigger value="ar" className="flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      {t('securityDeposit.content.arabic')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="space-y-4">
                    <div>
                      <Label htmlFor="title_en">{t('securityDeposit.content.popupTitle')}</Label>
                      <Input
                        id="title_en"
                        value={settings.title_en}
                        onChange={(e) => handleInputChange('title_en', e.target.value)}
                        placeholder={t('securityDeposit.content.placeholders.popupTitle')}
                      />
                    </div>

                    <div>
                      <Label htmlFor="message_en">{t('securityDeposit.content.messageToCustomer')}</Label>
                      <Textarea
                        id="message_en"
                        value={settings.message_en}
                        onChange={(e) => handleInputChange('message_en', e.target.value)}
                        placeholder={t('securityDeposit.content.placeholders.messageToCustomer')}
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bankAccountInfo_en">{t('securityDeposit.content.bankAccountInfo')}</Label>
                      <Textarea
                        id="bankAccountInfo_en"
                        value={settings.bankAccountInfo_en}
                        onChange={(e) => handleInputChange('bankAccountInfo_en', e.target.value)}
                        placeholder={t('securityDeposit.content.placeholders.bankAccountInfo')}
                        rows={6}
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmationText_en">{t('securityDeposit.content.confirmationText')}</Label>
                      <Input
                        id="confirmationText_en"
                        value={settings.confirmationText_en}
                        onChange={(e) => handleInputChange('confirmationText_en', e.target.value)}
                        placeholder={t('securityDeposit.content.placeholders.confirmationText')}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="ar" className="space-y-4">
                    <div>
                      <Label htmlFor="title_ar">{t('securityDeposit.content.popupTitleArabic')}</Label>
                      <Input
                        id="title_ar"
                        value={settings.title_ar}
                        onChange={(e) => handleInputChange('title_ar', e.target.value)}
                        placeholder={t('securityDeposit.content.placeholders.popupTitleArabic')}
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message_ar">{t('securityDeposit.content.messageToCustomerArabic')}</Label>
                      <Textarea
                        id="message_ar"
                        value={settings.message_ar}
                        onChange={(e) => handleInputChange('message_ar', e.target.value)}
                        placeholder="اشرح سبب الحاجة لدفع التأمين وما يجب على العملاء فعله"
                        rows={4}
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bankAccountInfo_ar">معلومات الحساب المصرفي (العربية)</Label>
                      <Textarea
                        id="bankAccountInfo_ar"
                        value={settings.bankAccountInfo_ar}
                        onChange={(e) => handleInputChange('bankAccountInfo_ar', e.target.value)}
                        placeholder="تفاصيل البنك حيث يجب على العملاء تحويل مبلغ التأمين"
                        rows={6}
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmationText_ar">نص مربع التأكيد (العربية)</Label>
                      <Input
                        id="confirmationText_ar"
                        value={settings.confirmationText_ar}
                        onChange={(e) => handleInputChange('confirmationText_ar', e.target.value)}
                        placeholder="أؤكد أنني قمت بتحويل مبلغ التأمين"
                        dir="rtl"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>

        {!settings.enabled && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">{t('securityDeposit.configuration.disabled.title')}</h3>
                <p>{t('securityDeposit.configuration.disabled.description')}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}