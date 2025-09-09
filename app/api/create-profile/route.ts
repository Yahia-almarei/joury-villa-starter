import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Only customers can create profiles' }, { status: 400 })
    }

    console.log('🔧 Force creating customer profile for:', session.user.email)

    // Delete existing profile if any (to avoid conflicts)
    await supabase
      .from('customer_profiles')
      .delete()
      .eq('user_id', session.user.id)

    // Create new profile
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
      return NextResponse.json({ error: 'Failed to create profile', details: createError }, { status: 500 })
    }

    console.log('✅ Customer profile created:', newProfile)

    return NextResponse.json({ 
      success: true, 
      profile: newProfile,
      message: 'Profile created successfully' 
    })
  } catch (error) {
    console.error('Create profile error:', error)
    return NextResponse.json({ 
      error: 'Failed to create profile' 
    }, { status: 500 })
  }
}