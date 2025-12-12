import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    console.log('🗑️ Admin delete user API: Deleting user', { userId })
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // First check if user has any active reservations
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['APPROVED', 'PAID', 'AWAITING_APPROVAL'])

    if (reservationsError) {
      console.error('❌ Error checking reservations:', reservationsError)
      return NextResponse.json(
        { error: 'Failed to check user reservations', details: reservationsError.message },
        { status: 500 }
      )
    }

    if (reservations && reservations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with active reservations' },
        { status: 400 }
      )
    }

    // Delete related data first (due to foreign key constraints)
    
    // Delete customer profiles
    const { error: profileError } = await supabase
      .from('customer_profiles')
      .delete()
      .eq('user_id', userId)

    if (profileError) {
      console.error('❌ Error deleting customer profile:', profileError)
    }

    // Delete audit logs related to this user
    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .eq('target_id', userId)

    if (auditError) {
      console.error('❌ Error deleting audit logs:', auditError)
    }

    // Delete any reservations (should be empty based on check above)
    const { error: reservationError } = await supabase
      .from('reservations')
      .delete()
      .eq('user_id', userId)

    if (reservationError) {
      console.error('❌ Error deleting reservations:', reservationError)
    }

    // Finally delete the user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (userError) {
      console.error('❌ Admin delete user error:', userError)
      return NextResponse.json(
        { error: 'Failed to delete user', details: userError.message },
        { status: 500 }
      )
    }

    // Log the deletion action
    await supabase.from('audit_logs').insert({
      action: 'USER_DELETED',
      target_type: 'user',
      target_id: userId,
      details: { deleted_by: 'admin' }
    })

    console.log('✅ Admin delete user: User deleted successfully', userId)
    return NextResponse.json({ success: true, message: 'User deleted successfully' })

  } catch (error) {
    console.error('❌ Admin delete user catch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}