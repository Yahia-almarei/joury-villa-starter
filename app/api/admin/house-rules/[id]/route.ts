import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const { description_en, description_ar, icon, is_active, order_index } = body

    const updateData: any = {
      icon: icon || 'Clock',
      is_active: is_active !== false
    }

    if (order_index !== undefined) {
      updateData.order_index = order_index
    }

    // If description fields are provided, use them
    if (description_en && description_ar) {
      updateData.title = description_en.slice(0, 50) + (description_en.length > 50 ? '...' : '')
      updateData.description = description_en
      updateData.description_en = description_en
      updateData.description_ar = description_ar
    }

    const { data: houseRule, error } = await supabase
      .from('house_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating house rule:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!houseRule) {
      return NextResponse.json({ success: false, error: 'House rule not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, houseRule })
  } catch (error) {
    console.error('Error updating house rule:', error)
    return NextResponse.json({ success: false, error: 'Failed to update house rule' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const { data: houseRule, error } = await supabase
      .from('house_rules')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error deleting house rule:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!houseRule) {
      return NextResponse.json({ success: false, error: 'House rule not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting house rule:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete house rule' }, { status: 500 })
  }
}