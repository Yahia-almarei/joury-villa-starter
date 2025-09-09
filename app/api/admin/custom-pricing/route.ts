import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const propertyId = searchParams.get('propertyId')
    
    if (!startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: 'Start date and end date are required'
      }, { status: 400 })
    }
    
    // Get property ID if not provided
    let actualPropertyId = propertyId
    if (!actualPropertyId) {
      const property = await db.getProperty()
      if (!property) {
        return NextResponse.json({
          success: false,
          error: 'No property found'
        }, { status: 400 })
      }
      actualPropertyId = property.id
    }
    
    const customPricing = await db.getCustomPricingForDateRange(
      actualPropertyId,
      startDate,
      endDate
    )
    
    
    return NextResponse.json({
      success: true,
      customPricing
    })
  } catch (error) {
    console.error('Error fetching custom pricing:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || error.message.includes('Admin access required')) {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized'
        }, { status: 401 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch custom pricing'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Custom pricing POST request received');
    await requireAdmin()
    console.log('Admin authentication verified');
    
    const body = await req.json()
    const { dates, pricePerNight, pricePerAdult, pricePerChild, notes, propertyId } = body
    
    console.log('Request body:', { dates, pricePerNight, pricePerAdult, pricePerChild, notes, propertyId });
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      console.log('Error: Dates array is required');
      return NextResponse.json({
        success: false,
        error: 'Dates array is required'
      }, { status: 400 })
    }
    
    if (!pricePerNight || pricePerNight <= 0) {
      console.log('Error: Valid price per night is required');
      return NextResponse.json({
        success: false,
        error: 'Valid price per night is required'
      }, { status: 400 })
    }
    
    // Get property ID if not provided
    let actualPropertyId = propertyId
    console.log('Initial propertyId:', propertyId);
    if (!actualPropertyId) {
      console.log('Getting property from database...');
      const property = await db.getProperty()
      console.log('Property from DB:', property);
      if (!property) {
        console.log('Error: No property found in database');
        return NextResponse.json({
          success: false,
          error: 'No property found'
        }, { status: 400 })
      }
      actualPropertyId = property.id
      console.log('Using property ID:', actualPropertyId);
    }
    
    // Create pricing entries for all selected dates
    const pricingEntries = dates.map(date => ({
      property_id: actualPropertyId,
      date,
      price_per_night: pricePerNight,
      notes: notes || null
    }))
    
    // Check if any dates already have custom pricing - if so, we'll overwrite them
    console.log('Processing', dates.length, 'dates for property', actualPropertyId);
    for (const date of dates) {
      console.log('Processing date:', date);
      const existing = await db.getCustomPricingForDateRange(actualPropertyId, date, date)
      console.log('Existing pricing for', date, ':', existing);
      if (existing.length > 0) {
        console.log('Updating existing entry for', date);
        // Update existing entry
        await db.updateCustomPricing(existing[0].id, {
          price_per_night: pricePerNight,
          price_per_adult: pricePerAdult || null,
          price_per_child: pricePerChild || null,
          notes: notes || null
        })
      } else {
        console.log('Creating new entry for', date);
        // Create new entry
        const result = await db.createCustomPricing({
          property_id: actualPropertyId,
          date,
          price_per_night: pricePerNight,
          price_per_adult: pricePerAdult || null,
          price_per_child: pricePerChild || null,
          notes: notes || null
        })
        console.log('Created entry result:', result);
      }
    }
    
    // Log the action
    await db.createAuditLog({
      action: 'CUSTOM_PRICING_UPDATED',
      target_type: 'custom_pricing',
      target_id: actualPropertyId,
      payload: { dates, pricePerNight, pricePerAdult, pricePerChild, notes },
      created_at: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: `Custom pricing set for ${dates.length} date(s)`
    })
  } catch (error) {
    console.error('Error creating custom pricing:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.message.includes('Authentication required') || error.message.includes('Admin access required')) {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized'
        }, { status: 401 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create custom pricing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(req.url)
    const dates = searchParams.get('dates')?.split(',')
    const propertyId = searchParams.get('propertyId')
    
    if (!dates || dates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Dates are required'
      }, { status: 400 })
    }
    
    // Get property ID if not provided
    let actualPropertyId = propertyId
    if (!actualPropertyId) {
      const property = await db.getProperty()
      if (!property) {
        return NextResponse.json({
          success: false,
          error: 'No property found'
        }, { status: 400 })
      }
      actualPropertyId = property.id
    }
    
    // Delete custom pricing for selected dates
    for (const date of dates) {
      const existing = await db.getCustomPricingForDateRange(actualPropertyId, date, date)
      for (const pricing of existing) {
        await db.deleteCustomPricing(pricing.id)
      }
    }
    
    // Log the action
    await db.createAuditLog({
      action: 'CUSTOM_PRICING_DELETED',
      target_type: 'custom_pricing',
      target_id: actualPropertyId,
      payload: { dates },
      created_at: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: `Custom pricing removed for ${dates.length} date(s)`
    })
  } catch (error) {
    console.error('Error deleting custom pricing:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') || error.message.includes('Admin access required')) {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized'
        }, { status: 401 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete custom pricing'
    }, { status: 500 })
  }
}