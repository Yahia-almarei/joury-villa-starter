import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all policies
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    console.log('📄 Fetching policies via API...')

    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .order('type', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching policies:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ Successfully fetched policies:', data?.length || 0)
    return NextResponse.json({ 
      success: true, 
      data: data || [] 
    })

  } catch (error) {
    console.error('💥 Error in policies GET:', error)
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 })
  }
}

// POST - Create new policy
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    console.log('➕ Creating policy via API...')
    const policyData = await request.json()

    console.log('📝 Policy data to create:', policyData)

    const { data: insertedData, error } = await supabase
      .from('policies')
      .insert([policyData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating policy:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ Policy created successfully:', insertedData)

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        action: 'POLICY_CREATED',
        target_type: 'policy',
        target_id: insertedData.id,
        payload: policyData,
        actor_user_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // Use proper UUID format for admin
      })
    } catch (auditError) {
      console.log('⚠️ Audit log failed (but policy was created):', auditError)
    }
    
    return NextResponse.json({ 
      success: true, 
      data: insertedData 
    })

  } catch (error) {
    console.error('💥 Error in policies POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 })
  }
}

// PUT - Update existing policy
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()

    console.log('✏️ Updating policy via API...')
    const { id, ...policyData } = await request.json()

    console.log('📝 Policy data to update:', { id, ...policyData })

    const { data: updatedData, error } = await supabase
      .from('policies')
      .update(policyData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating policy:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ Policy updated successfully:', updatedData)

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        action: 'POLICY_UPDATED',
        target_type: 'policy',
        target_id: id,
        payload: policyData,
        actor_user_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // Use proper UUID format for admin
      })
    } catch (auditError) {
      console.log('⚠️ Audit log failed (but policy was updated):', auditError)
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedData 
    })

  } catch (error) {
    console.error('💥 Error in policies PUT:', error)
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 })
  }
}

// DELETE - Delete policy
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Policy ID is required' 
      }, { status: 400 })
    }

    console.log('🗑️ Deleting policy via API:', id)

    const { error } = await supabase
      .from('policies')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error deleting policy:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ Policy deleted successfully')

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        action: 'POLICY_DELETED',
        target_type: 'policy',
        target_id: id,
        actor_user_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // Use proper UUID format for admin
      })
    } catch (auditError) {
      console.log('⚠️ Audit log failed (but policy was deleted):', auditError)
    }
    
    return NextResponse.json({ 
      success: true 
    })

  } catch (error) {
    console.error('💥 Error in policies DELETE:', error)
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 })
  }
}