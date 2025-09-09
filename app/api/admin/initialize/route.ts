import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(req: NextRequest) {
  try {
    // Check if property already exists
    let property = await db.getProperty()
    
    if (!property) {
      // Create initial property with default settings
      property = await db.createProperty({
        name: 'Joury Villa',
        address: 'Jericho, Palestinian Territories',
        timezone: 'Asia/Jerusalem',
        currency: 'ILS',
        base_price_night: 650,  // Base price per night in ILS
        price_per_adult: 350,   // Additional adult charge
        price_per_child: 250,   // Child charge
        cleaning_fee: 0,        // No cleaning fee
        vat_percent: 0,         // No VAT initially
        min_nights: 1,          // Minimum 1 night
        max_nights: 30,         // Maximum 30 nights
        max_adults: 10,         // Maximum 10 guests total
        max_children: 0         // Children count handled within max_adults
      })
      
      console.log('Created initial property:', property.id)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property initialized',
      property
    })
  } catch (error) {
    console.error('Initialize error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize property',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}