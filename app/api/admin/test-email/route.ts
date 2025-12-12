import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  sendBookingConfirmation,
  sendApprovalRequired,
  sendBookingApproved,
  sendBookingDeclined,
  sendBookingCancelled,
  sendBookingRescheduled,
  sendBookingReminder
} from '@/lib/email-service'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const { emailType, reservationId, reason, oldCheckIn, oldCheckOut } = await req.json()

    if (!emailType || !reservationId) {
      return NextResponse.json({
        success: false,
        error: 'Email type and reservation ID are required'
      }, { status: 400 })
    }

    let result

    switch (emailType) {
      case 'confirmation':
        result = await sendBookingConfirmation(reservationId)
        break
      case 'approval_required':
        result = await sendApprovalRequired(reservationId)
        break
      case 'approved':
        result = await sendBookingApproved(reservationId)
        break
      case 'declined':
        result = await sendBookingDeclined(reservationId, reason)
        break
      case 'cancelled':
        result = await sendBookingCancelled(reservationId, reason)
        break
      case 'rescheduled':
        if (!oldCheckIn || !oldCheckOut) {
          return NextResponse.json({
            success: false,
            error: 'Old check-in and check-out dates are required for reschedule emails'
          }, { status: 400 })
        }
        result = await sendBookingRescheduled(reservationId, oldCheckIn, oldCheckOut, reason)
        break
      case 'reminder':
        result = await sendBookingReminder(reservationId)
        break
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid email type'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `${emailType} email sent successfully`,
      emailResult: result
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email'
    }, { status: 500 })
  }
}