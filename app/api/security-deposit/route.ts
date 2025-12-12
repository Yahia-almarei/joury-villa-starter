import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

// Declare global type for security deposit cache
declare global {
  var securityDepositCache: Map<string, any> | undefined
}

export async function GET() {
  try {
    // Get property settings from the properties table
    const property = await db.getProperty()

    if (!property) {
      return NextResponse.json({
        success: true,
        settings: { enabled: false }
      })
    }

    // Get security deposit settings from the property's security_deposit_json field
    let settings = property.security_deposit_json || null

    // If not found in database, check memory cache as fallback
    if (!settings && global.securityDepositCache) {
      settings = global.securityDepositCache.get(property.id)
    }

    // Use default settings if still not found
    settings = settings || { enabled: false }

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