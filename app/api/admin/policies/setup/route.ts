import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    console.log('🧪 Testing policies table access...')

    // Test if we can read from the policies table
    const { data: policies, error: readError } = await supabase
      .from('policies')
      .select('id, title, type, is_active, created_at')
      .limit(10)

    if (readError) {
      console.error('❌ Error reading from policies table:', readError)
      return NextResponse.json({
        success: false,
        error: 'Cannot read from policies table: ' + readError.message,
        suggestion: 'Make sure you created the table in Supabase SQL Editor'
      }, { status: 500 })
    }

    console.log('✅ Successfully read from policies table, found:', policies?.length || 0, 'policies')

    // Test if we can write to the policies table
    const testPolicy = {
      title: 'Database Test Policy',
      type: 'terms',
      content: '<p>This is a test policy to verify write access. It will be deleted immediately.</p>',
      is_active: false, // Don't make it visible to customers
      version: 1
    }

    const { data: insertedPolicy, error: insertError } = await supabase
      .from('policies')
      .insert([testPolicy])
      .select('id')
      .single()

    if (insertError) {
      console.error('❌ Error inserting test policy:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Cannot write to policies table: ' + insertError.message,
        readable_policies: policies?.length || 0
      }, { status: 500 })
    }

    console.log('✅ Successfully inserted test policy with ID:', insertedPolicy.id)

    // Clean up the test policy
    const { error: deleteError } = await supabase
      .from('policies')
      .delete()
      .eq('id', insertedPolicy.id)

    if (deleteError) {
      console.log('⚠️ Warning: Could not delete test policy, but that\'s OK')
    } else {
      console.log('🧹 Test policy cleaned up successfully')
    }

    return NextResponse.json({
      success: true,
      message: '🎉 Policies table is working perfectly!',
      details: {
        existing_policies: policies?.length || 0,
        read_access: '✅ Working',
        write_access: '✅ Working',
        delete_access: deleteError ? '⚠️ Limited' : '✅ Working'
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error in policies test:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error: ' + (error as Error).message 
    }, { status: 500 })
  }
}