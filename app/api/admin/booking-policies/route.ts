import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET - Fetch all booking policies
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: policies, error } = await supabase
      .from('booking_policies')
      .select('*')

    if (error) {
      console.error('Error fetching booking policies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch booking policies' },
        { status: 500 }
      )
    }

    return NextResponse.json({ policies })
  } catch (error) {
    console.error('Error in GET /api/admin/booking-policies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new booking policy
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const {
      description_en,
      description_ar,
      is_active = true
    } = body

    // Validate required fields
    if (!description_en) {
      return NextResponse.json(
        { error: 'Missing required field: description_en' },
        { status: 400 }
      )
    }

    const { data: policy, error } = await supabase
      .from('booking_policies')
      .insert({
        description_en,
        description_ar,
        is_active
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating booking policy:', error)
      return NextResponse.json(
        { error: 'Failed to create booking policy', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ policy }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/booking-policies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}