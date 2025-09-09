import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

const supabase = createServerClient()

const phoneSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  country: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Only customers can save phone numbers' }, { status: 400 })
    }

    const body = await request.json()
    const { phone, country } = phoneSchema.parse(body)

    console.log('📱 PERMANENT FIX - Saving phone for user:', session.user.email)
    console.log('📱 Phone number:', phone)

    // Step 1: Ensure customer profile exists
    let { data: existingProfile } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (!existingProfile) {
      console.log('📝 Creating customer profile as it doesn\'t exist')
      
      // Create the customer profile
      const { data: newProfile, error: createError } = await supabase
        .from('customer_profiles')
        .insert({
          user_id: session.user.id,
          full_name: session.user.name || session.user.email || '',
          phone: phone,
          country: country || ''
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating customer profile:', createError)
        return NextResponse.json({ 
          error: 'Failed to create customer profile',
          details: createError 
        }, { status: 500 })
      }

      console.log('✅ Customer profile created successfully:', newProfile)
      
      return NextResponse.json({ 
        success: true,
        message: 'Phone number saved and profile created',
        profile: newProfile
      })
    } else {
      // Update existing profile
      console.log('📝 Updating existing customer profile')
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('customer_profiles')
        .update({
          phone: phone,
          country: country || existingProfile.country
        })
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating customer profile:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update customer profile',
          details: updateError 
        }, { status: 500 })
      }

      console.log('✅ Customer profile updated successfully:', updatedProfile)
      
      return NextResponse.json({ 
        success: true,
        message: 'Phone number updated successfully',
        profile: updatedProfile
      })
    }

  } catch (error) {
    console.error('❌ Save phone error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: error.errors[0].message 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to save phone number' 
    }, { status: 500 })
  }
}