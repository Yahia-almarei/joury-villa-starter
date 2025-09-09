import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('🚀 Admin users API endpoint called!')
  try {
    console.log('🔍 Admin users API: Fetching users with service role...')
    console.log('🔑 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        customer_profiles (
          full_name,
          phone
        ),
        reservations (
          id,
          total,
          status
        )
      `)
      .order('created_at', { ascending: false })
    
    console.log('📊 Admin users API response:', { 
      data: data?.map(user => ({
        email: user.email,
        reservations: user.reservations?.length || 0,
        total_spent: user.reservations?.reduce((sum, res) => sum + res.total, 0) || 0
      })), 
      error, 
      count: data?.length 
    })
    
    if (error) {
      console.error('❌ Admin users API error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('✅ Admin users API: Successfully fetched', data?.length || 0, 'users')
    return NextResponse.json({ users: data || [] })
    
  } catch (error) {
    console.error('❌ Admin users API catch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, state } = await request.json()
    console.log('🔄 Admin users API: Updating user state', { userId, state })
    
    if (!userId || !state) {
      return NextResponse.json(
        { error: 'Missing userId or state' },
        { status: 400 }
      )
    }
    
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('users')
      .update({ state })
      .eq('id', userId)
      .select()
    
    if (error) {
      console.error('❌ Admin users API update error:', error)
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      )
    }
    
    // Log the action in audit logs
    await supabase.from('audit_logs').insert({
      action: state === 'blocked' ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
      target_type: 'user',
      target_id: userId
    })
    
    console.log('✅ Admin users API: User updated successfully', data)
    return NextResponse.json({ user: data[0] })
    
  } catch (error) {
    console.error('❌ Admin users API update catch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}