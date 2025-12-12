import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env.local file.')
  process.exit(1)
}

console.log('🚀 Setting up house rules table...')
console.log('📡 Supabase URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupHouseRulesTable() {
  try {
    // Create the table using raw SQL
    console.log('🔧 Creating house_rules table...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
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

        CREATE INDEX IF NOT EXISTS idx_house_rules_order ON house_rules(order_index);
        CREATE INDEX IF NOT EXISTS idx_house_rules_active ON house_rules(is_active);
      `
    })

    if (error) {
      console.error('❌ Error creating table with exec_sql:', error)
      
      // Try alternative approach - direct SQL execution
      console.log('🔄 Trying alternative approach...')
      
      const createTableQuery = `
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
      `
      
      const response = await fetch(supabaseUrl + '/rest/v1/rpc/exec_sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ sql: createTableQuery })
      })
      
      if (!response.ok) {
        console.log('❌ Alternative approach failed. Trying to insert data directly...')
      }
    } else {
      console.log('✅ Table created successfully!')
    }

    // Try to insert default house rules
    console.log('📝 Inserting default house rules...')
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
      console.log(`➕ Inserting rule: ${rule.title}`)
      const { error: insertError } = await supabase
        .from('house_rules')
        .insert(rule)
      
      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique constraint')) {
          console.log(`⚠️ Rule "${rule.title}" already exists, skipping...`)
        } else if (insertError.message.includes('does not exist')) {
          console.log(`❌ Table doesn't exist yet. Rule "${rule.title}" not inserted.`)
        } else {
          console.error(`❌ Error inserting rule "${rule.title}":`, insertError.message)
        }
      } else {
        console.log(`✅ Inserted rule: ${rule.title}`)
      }
    }
    
    console.log('🎉 House rules setup completed!')
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message)
  }
}

setupHouseRulesTable()