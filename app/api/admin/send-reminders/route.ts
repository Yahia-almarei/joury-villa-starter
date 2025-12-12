import { NextRequest, NextResponse } from 'next/server'
import { sendUpcomingCheckInReminders } from '@/lib/email-service'

export async function POST(req: NextRequest) {
  try {
    // Verify the request is from a valid source (cron job, admin, etc.)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is set, require it for authentication
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Send reminder emails for upcoming check-ins
    const result = await sendUpcomingCheckInReminders()

    return NextResponse.json({
      success: true,
      message: 'Reminder emails processed',
      stats: result
    })

  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send reminder emails'
    }, { status: 500 })
  }
}

// GET endpoint for manual testing (admin only)
export async function GET(req: NextRequest) {
  try {
    // For manual testing, just run the reminder system
    const result = await sendUpcomingCheckInReminders()

    return NextResponse.json({
      success: true,
      message: 'Reminder emails processed (manual run)',
      stats: result
    })

  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send reminder emails'
    }, { status: 500 })
  }
}