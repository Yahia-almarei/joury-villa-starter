// Load environment variables first
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addSampleReservations() {
  console.log('🏠 Adding sample reservations for testing...')

  // Sample reservations data with various statuses and dates
  const sampleReservations = [
    {
      user_id: 'b9d64b8a-3b16-4b78-9f83-1234567890ab',
      property_id: 'prop-001',
      check_in: '2025-01-15',
      check_out: '2025-01-18',
      total: 1200,
      status: 'PAID'
    },
    {
      user_id: 'b9d64b8a-3b16-4b78-9f83-1234567890ab',
      property_id: 'prop-001',
      check_in: '2025-02-10',
      check_out: '2025-02-14',
      total: 2400,
      status: 'APPROVED'
    },
    {
      user_id: 'b9d64b8a-3b16-4b78-9f83-1234567890ab',
      property_id: 'prop-001',
      check_in: '2025-03-05',
      check_out: '2025-03-08',
      total: 1800,
      status: 'PAID'
    },
    {
      user_id: 'b9d64b8a-3b16-4b78-9f83-1234567890ab',
      property_id: 'prop-001',
      check_in: '2025-04-20',
      check_out: '2025-04-25',
      total: 3000,
      status: 'AWAITING_APPROVAL'
    },
    {
      user_id: 'b9d64b8a-3b16-4b78-9f83-1234567890ab',
      property_id: 'prop-001',
      check_in: '2024-12-20',
      check_out: '2024-12-24',
      total: 2800,
      status: 'PAID'
    },
    {
      user_id: 'b9d64b8a-3b16-4b78-9f83-1234567890ab',
      property_id: 'prop-001',
      check_in: '2024-11-15',
      check_out: '2024-11-18',
      total: 1500,
      status: 'CANCELLED'
    }
  ]

  try {
    // First, get an existing user ID from the database
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (userError) {
      console.error('Error fetching user:', userError)
      return
    }

    if (!users || users.length === 0) {
      console.error('No users found in database. Please create a user first.')
      return
    }

    const userId = users[0].id
    console.log('Using user ID:', userId)

    // Update sample reservations with real user ID
    const reservationsWithUserId = sampleReservations.map(res => ({
      ...res,
      user_id: userId
    }))

    // Insert sample reservations
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationsWithUserId)
      .select()

    if (error) {
      console.error('Error inserting reservations:', error)
      return
    }

    console.log(`✅ Successfully added ${data.length} sample reservations:`)
    data.forEach((res, index) => {
      console.log(`  ${index + 1}. ${res.id} - ${res.check_in} to ${res.check_out} - ₪${res.total} (${res.status})`)
    })

    // Calculate totals
    const totalRevenue = data
      .filter(r => r.status === 'PAID' || r.status === 'APPROVED')
      .reduce((sum, r) => sum + r.total, 0)

    console.log(`💰 Total revenue from sample data: ₪${totalRevenue.toLocaleString()}`)
    console.log('🎉 Sample reservations added successfully!')

  } catch (error) {
    console.error('Error adding sample reservations:', error)
  }
}

// Run the script
addSampleReservations()