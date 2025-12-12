const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function createHouseRulesTable() {
  try {
    console.log('Creating house_rules table...')
    
    // Create the table
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        -- Create house rules table if it doesn't exist
        CREATE TABLE IF NOT EXISTS house_rules (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            icon VARCHAR(50) DEFAULT 'Clock',
            is_active BOOLEAN DEFAULT true,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_house_rules_order ON house_rules(order_index);
        CREATE INDEX IF NOT EXISTS idx_house_rules_active ON house_rules(is_active);
      `
    })
    
    if (error) {
      console.error('Error creating table:', error)
    } else {
      console.log('Table created successfully!')
    }

    // Insert default house rules
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

    for (const rule of defaultRules) {
      const { error: insertError } = await supabase
        .from('house_rules')
        .insert(rule)
      
      if (insertError && !insertError.message.includes('duplicate')) {
        console.error(`Error inserting rule "${rule.title}":`, insertError)
      } else {
        console.log(`✓ Inserted rule: ${rule.title}`)
      }
    }
    
    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Error running migration:', error)
  }
}

createHouseRulesTable()