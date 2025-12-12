import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('lang') || 'en'

    const { data: houseRules, error } = await supabase
      .from('house_rules')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching house rules:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Map rules to show appropriate language with fallback
    const localizedRules = houseRules.map(rule => {
      let title, description;
      
      if (language === 'ar') {
        // For Arabic: use Arabic version if available, otherwise fallback to English or original
        title = rule.title_ar || rule.title_en || rule.title;
        description = rule.description_ar || rule.description_en || rule.description;
      } else {
        // For English: use English version if available, otherwise fallback to original
        title = rule.title_en || rule.title;
        description = rule.description_en || rule.description;
      }
      
      return {
        ...rule,
        title,
        description
      }
    })

    return NextResponse.json({ success: true, houseRules: localizedRules })
  } catch (error) {
    console.error('Error fetching house rules:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch house rules' }, { status: 500 })
  }
}