import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

// Declare global type for security deposit cache
declare global {
  var securityDepositCache: Map<string, any> | undefined
}

// Default security deposit settings
const DEFAULT_SETTINGS = {
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
}

export async function GET() {
  try {
    // Get property settings from the properties table
    const property = await db.getProperty()

    if (!property) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS
      })
    }

    // Get security deposit settings from the property's security_deposit_json field
    let settings = property.security_deposit_json || null

    // If not found in database, check memory cache as fallback
    if (!settings && global.securityDepositCache) {
      settings = global.securityDepositCache.get(property.id)
    }

    // Use default settings if still not found
    settings = settings || DEFAULT_SETTINGS

    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Error in security deposit GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const settings = await req.json()

    // Validate required fields
    if (typeof settings.enabled !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'Invalid enabled value'
      }, { status: 400 })
    }

    if (settings.enabled) {
      if (!settings.amount || settings.amount <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Amount must be greater than 0'
        }, { status: 400 })
      }

      if (!settings.title_en || !settings.title_ar || !settings.message_en || !settings.message_ar ||
          !settings.bankAccountInfo_en || !settings.bankAccountInfo_ar ||
          !settings.confirmationText_en || !settings.confirmationText_ar) {
        return NextResponse.json({
          success: false,
          error: 'All fields in both languages are required when security deposit is enabled'
        }, { status: 400 })
      }
    }

    // Get or create property
    let property = await db.getProperty()

    if (!property) {
      // Create default property if it doesn't exist
      try {
        property = await db.createProperty({
          name: 'Joury Villa',
          address: 'Jericho, Palestinian Territories',
          timezone: 'Asia/Jerusalem',
          currency: 'ILS',
          weekday_price_night: 300,
          weekend_price_night: 400,
          cleaning_fee: 100,
          vat_percent: 17,
          min_nights: 2,
          max_nights: 14,
          max_adults: 8,
          max_children: 0,
          security_deposit_json: settings
        })
      } catch (error: any) {
        if (error.message && error.message.includes('security_deposit_json')) {
          console.warn('security_deposit_json column does not exist, using fallback approach')
          // Create property without security_deposit_json and use memory storage
          property = await db.createProperty({
            name: 'Joury Villa',
            address: 'Jericho, Palestinian Territories',
            timezone: 'Asia/Jerusalem',
            currency: 'ILS',
            weekday_price_night: 300,
            weekend_price_night: 400,
            cleaning_fee: 100,
            vat_percent: 17,
            min_nights: 2,
            max_nights: 14,
            max_adults: 8,
            max_children: 0
          })
          // Store in memory as fallback
          if (!global.securityDepositCache) {
            global.securityDepositCache = new Map()
          }
          global.securityDepositCache.set(property.id, settings)
        } else {
          throw error
        }
      }
    } else {
      // Update existing property with security deposit settings
      try {
        property = await db.updateProperty(property.id, {
          security_deposit_json: settings
        })
      } catch (error: any) {
        if (error.message && error.message.includes('security_deposit_json')) {
          console.warn('security_deposit_json column does not exist, using memory storage')
          // Store in memory as fallback
          if (!global.securityDepositCache) {
            global.securityDepositCache = new Map()
          }
          global.securityDepositCache.set(property.id, settings)
        } else {
          throw error
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Security deposit settings saved successfully'
    })
  } catch (error) {
    console.error('Error in security deposit PUT:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}