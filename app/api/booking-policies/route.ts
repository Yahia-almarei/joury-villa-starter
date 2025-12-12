import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch active booking policies for public display
export async function GET() {
  try {
    const { data: policies, error } = await supabase
      .from('booking_policies')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching booking policies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch booking policies' },
        { status: 500 }
      )
    }

    return NextResponse.json({ policies })
  } catch (error) {
    console.error('Error in GET /api/booking-policies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}