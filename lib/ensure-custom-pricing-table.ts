import { createServerClient } from './supabase'

const supabase = createServerClient()

export async function ensureCustomPricingTable() {
  try {
    // First, try to query the table to see if it exists
    const { error: testError } = await supabase
      .from('custom_pricing')
      .select('count')
      .limit(1)

    // If no error, table exists
    if (!testError) {
      return true
    }

    // If table doesn't exist, create it
    const createTableSQL = `
      -- Create custom_pricing table
      CREATE TABLE IF NOT EXISTS public.custom_pricing (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          price_per_night INTEGER NOT NULL,
          price_per_adult INTEGER,
          price_per_child INTEGER,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(property_id, date)
      );

      -- Create index for faster lookups
      CREATE INDEX IF NOT EXISTS custom_pricing_property_date_idx 
      ON public.custom_pricing (property_id, date);

      -- Enable RLS (Row Level Security)
      ALTER TABLE public.custom_pricing ENABLE ROW LEVEL SECURITY;

      -- Create policies for admin access
      CREATE POLICY IF NOT EXISTS "Enable read access for authenticated users" ON public.custom_pricing
          FOR SELECT USING (auth.role() = 'authenticated');

      CREATE POLICY IF NOT EXISTS "Enable all access for service role" ON public.custom_pricing
          FOR ALL USING (auth.role() = 'service_role');
    `

    // Execute the SQL to create the table
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (createError) {
      console.error('Error creating custom_pricing table:', createError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error ensuring custom_pricing table:', error)
    return false
  }
}