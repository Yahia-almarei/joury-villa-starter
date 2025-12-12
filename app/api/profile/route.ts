import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

const supabase = createServerClient()

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  country: z.string().optional()
})

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (!profile) {
      // Create customer profile if it doesn't exist for customers
      if (session.user.role === 'CUSTOMER') {
        console.log('📝 Creating missing customer profile for:', session.user.email)
        
        const { data: newProfile, error: createError } = await supabase
          .from('customer_profiles')
          .insert({
            user_id: session.user.id,
            full_name: session.user.name || session.user.email || '',
            phone: '',
            country: ''
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating customer profile:', createError)
          // Return empty profile if creation fails
          return NextResponse.json({
            full_name: session.user.name || session.user.email || '',
            phone: '',
            country: ''
          })
        }

        return NextResponse.json({
          full_name: newProfile.full_name || '',
          phone: newProfile.phone || '',
          country: newProfile.country || ''
        })
      }

      // Return empty profile for admins or if profile creation fails
      return NextResponse.json({
        full_name: session.user.name || session.user.email || '',
        phone: '',
        country: ''
      })
    }

    return NextResponse.json({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      country: profile.country || ''
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch profile' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    // Check if customer profile exists
    const { data: existingProfile } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    const updateData = {
      ...validatedData
    }

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('customer_profiles')
        .update(updateData)
        .eq('user_id', session.user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update profile' 
        }, { status: 500 })
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('customer_profiles')
        .insert({
          user_id: session.user.id,
          ...updateData
        })

      if (insertError) {
        console.error('Profile creation error:', insertError)
        return NextResponse.json({ 
          error: 'Failed to create profile' 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Profile updated successfully' 
    })
  } catch (error) {
    console.error('Update profile error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: error.errors[0].message 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to update profile' 
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has any active reservations
    const { data: activeReservations } = await supabase
      .from('reservations')
      .select('id')
      .eq('user_id', session.user.id)
      .in('status', ['PENDING', 'AWAITING_APPROVAL', 'APPROVED', 'PAID'])
      .gt('check_in', new Date().toISOString())

    if (activeReservations && activeReservations.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete account with active reservations. Please cancel or complete your reservations first.' 
      }, { status: 400 })
    }

    // Delete in order to respect foreign key constraints
    // 1. Delete customer profile
    const { error: profileError } = await supabase
      .from('customer_profiles')
      .delete()
      .eq('user_id', session.user.id)

    if (profileError) {
      console.error('Error deleting customer profile:', profileError)
    }

    // 2. Delete user reservations (past ones)
    const { error: reservationsError } = await supabase
      .from('reservations')
      .delete()
      .eq('user_id', session.user.id)

    if (reservationsError) {
      console.error('Error deleting reservations:', reservationsError)
    }

    // 3. Delete the user account
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', session.user.id)

    if (userError) {
      console.error('Error deleting user:', userError)
      return NextResponse.json({ 
        error: 'Failed to delete account' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete account' 
    }, { status: 500 })
  }
}