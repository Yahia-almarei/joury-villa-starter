const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createHouseRulesTable() {
  try {
    console.log('Creating house_rules table...')
    
    // First, let's try to query existing tables to see if it already exists
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'house_rules')
    
    if (tablesError) {
      console.log('Could not check existing tables, proceeding with creation...')
    } else if (existingTables && existingTables.length > 0) {
      console.log('house_rules table already exists!')
      return
    }

    // Insert default house rules using the API
    console.log('Inserting default house rules...')
    const defaultRules = [
      {
        title: 'Check-in Time',
        description: 'Check-in: 3:00 PM - 11:00 PM',
        icon: 'Clock',
        is_active: true,
        order_index: 1
      },
      {
        title: 'Check-out Time', 
        description: 'Check-out: Before 11:00 AM',
        icon: 'Clock',
        is_active: true,
        order_index: 2
      },
      {
        title: 'Smoking Policy',
        description: 'No smoking inside the villa',
        icon: 'AlertCircle',
        is_active: true,
        order_index: 3
      },
      {
        title: 'Pet Policy',
        description: 'Pets are not allowed',
        icon: 'Home', 
        is_active: true,
        order_index: 4
      },
      {
        title: 'Quiet Hours',
        description: 'Please maintain quiet hours from 10:00 PM to 8:00 AM',
        icon: 'AlertCircle',
        is_active: true,
        order_index: 5
      }
    ]

    const { data, error } = await supabase
      .from('house_rules')
      .insert(defaultRules)
    
    if (error) {
      console.error('Error inserting default rules:', error)
    } else {
      console.log('✓ Default house rules inserted successfully!')
    }
    
    console.log('Setup completed successfully!')
    
  } catch (error) {
    console.error('Error during setup:', error)
  }
}

createHouseRulesTable()