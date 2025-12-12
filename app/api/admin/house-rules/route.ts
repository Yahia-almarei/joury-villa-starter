import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { data: houseRules, error } = await supabase
      .from('house_rules')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching house rules:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, houseRules })
  } catch (error) {
    console.error('Error fetching house rules:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch house rules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description_en, description_ar, icon, is_active, order_index } = body

    // Validate required fields
    if (!description_en || !description_ar) {
      return NextResponse.json({
        success: false,
        error: 'Both English and Arabic descriptions are required'
      }, { status: 400 })
    }


    const { data: houseRule, error } = await supabase
      .from('house_rules')
      .insert({
        title: description_en.slice(0, 50) + (description_en.length > 50 ? '...' : ''),
        description: description_en,
        description_en,
        description_ar,
        icon: icon || 'Clock',
        is_active: is_active !== false,
        order_index: order_index || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating house rule:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, houseRule })
  } catch (error) {
    console.error('Error creating house rule:', error)
    return NextResponse.json({ success: false, error: 'Failed to create house rule' }, { status: 500 })
  }
}