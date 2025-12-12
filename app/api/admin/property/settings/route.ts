import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    // For now, skip admin verification during development
    // TODO: Implement proper admin authentication
    // await requireAdmin()
    
    const data = await req.json()
    console.log('📝 Received pricing data:', data)
    
    // Get or create property record
    let property = await db.getProperty()
    console.log('📊 Current property:', property)
    
    if (!property) {
      // Create default property if it doesn't exist
      property = await db.createProperty({
        name: 'Joury Villa',
        address: 'Jericho, Palestinian Territories',
        timezone: 'Asia/Jerusalem',
        currency: 'ILS',
        weekday_price_night: data.weekdayPriceNight,
        weekend_price_night: data.weekendPriceNight,
        cleaning_fee: data.cleaningFee ?? 100,
        vat_percent: data.vatPercent ?? 17,
        min_nights: data.minNights ?? 2,
        max_nights: data.maxNights ?? 14,
        max_adults: data.maxAdults ?? 8,
        max_children: data.maxChildren ?? 0
      })
    } else {
      // Update existing property
      property = await db.updateProperty(property.id, {
        weekday_price_night: data.weekdayPriceNight,
        weekend_price_night: data.weekendPriceNight,
        cleaning_fee: data.cleaningFee,
        vat_percent: data.vatPercent,
        min_nights: data.minNights,
        max_nights: data.maxNights,
        max_adults: data.maxAdults,
        max_children: data.maxChildren
      })
    }
    
    console.log('✅ Updated property:', property)
    
    // Log the action (skip for now since we don't have authenticated admin user)
    try {
      // TODO: Get actual admin user ID from session when authentication is implemented
      // For now, we'll skip the audit log to avoid UUID errors
      // await db.createAuditLog({
      //   actor_user_id: adminUserId,
      //   action: 'PROPERTY_SETTINGS_UPDATED',
      //   target_type: 'Property',
      //   target_id: property.id,
      //   payload: data
      // })
    } catch (error) {
      console.warn('Could not create audit log:', error)
    }
    
    return NextResponse.json({
      success: true,
      property
    })
    
  } catch (error) {
    console.error('Error updating property settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update property settings'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // For now, skip admin verification during development
    // TODO: Implement proper admin authentication
    // await requireAdmin()
    
    const property = await db.getProperty()
    console.log('📊 Retrieved property for GET:', property)
    
    return NextResponse.json({
      success: true,
      property: property ? {
        ...property,
        weekdayPriceNight: property.weekday_price_night,
        weekendPriceNight: property.weekend_price_night,
        cleaningFee: property.cleaning_fee || 100,
        vatPercent: property.vat_percent || 17,
        minNights: property.min_nights || 2,
        maxNights: property.max_nights || 14,
        maxAdults: property.max_adults || 8,
        maxChildren: property.max_children || 0
      } : {
        name: 'Joury Villa',
        weekdayPriceNight: null,
        weekendPriceNight: null,
        cleaningFee: 100,
        vatPercent: 17,
        minNights: 2,
        maxNights: 14,
        maxAdults: 8,
        maxChildren: 0
      }
    })
    
  } catch (error) {
    console.error('Error fetching property settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch property settings'
    }, { status: 500 })
  }
}