import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    // Get all properties
    const properties = await db.getAllProperties()
    
    // Get seasons, blocked periods, etc.
    const { data: seasons } = await db.supabase
      .from('seasons')
      .select('*')
    
    const { data: blocked } = await db.supabase
      .from('blocked_periods')
      .select('*')
    
    const { data: reservations } = await db.supabase
      .from('reservations')
      .select('*')
    
    // Get a sample reservation to see column structure
    const { data: sampleReservation, error: schemaError } = await db.supabase
      .from('reservations')
      .select('*')
      .limit(1)
      .maybeSingle()
    
    console.log('Sample reservation structure:', sampleReservation)
    console.log('Schema error (if any):', schemaError)
    
    return NextResponse.json({
      properties,
      seasons: seasons || [],
      blocked_periods: blocked || [],
      reservations: reservations || [],
      database_status: 'connected'
    })
  } catch (error) {
    console.error('Database debug error:', error)
    return NextResponse.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}