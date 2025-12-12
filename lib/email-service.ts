import { sendEmail, EmailType } from './email-templates'
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()

export interface BookingEmailData {
  reservationId: string
  userId?: string
  reason?: string
  oldCheckIn?: string
  oldCheckOut?: string
  adminEmail?: string
}

/**
 * Send email notification for booking events
 */
export async function sendBookingEmail(
  type: EmailType,
  data: BookingEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get reservation details with user information
    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        users!inner (
          id,
          email,
          customer_profiles (
            full_name,
            phone
          )
        )
      `)
      .eq('id', data.reservationId)
      .single()

    if (reservationError || !reservationData) {
      console.error('Failed to fetch reservation:', reservationError)
      return { success: false, error: 'Reservation not found' }
    }

    // Get property information
    const { data: property, error: propertyError } = await supabase
      .from('property_settings')
      .select('*')
      .single()

    if (propertyError) {
      console.error('Failed to fetch property data:', propertyError)
    }

    const user = {
      full_name: reservationData.users.customer_profiles?.[0]?.full_name || 'Guest',
      email: reservationData.users.email
    }

    // Check if this is an admin-only notification
    const isAdminOnly = ['admin_new_booking', 'admin_booking_cancelled'].includes(type)

    let customerResult = { success: true }

    if (!isAdminOnly) {
      // Send customer email for non-admin-only events
      const emailContext = {
        to: user.email,
        data: {
          reservation: reservationData,
          property: property || {},
          user: user,
          reason: data.reason,
          oldCheckIn: data.oldCheckIn,
          oldCheckOut: data.oldCheckOut
        }
      }

      customerResult = await sendEmail(type, emailContext)

      // Log email activity
      await logEmailActivity(type, data.reservationId, user.email, customerResult.success)
    } else {
      // Send admin notification only
      const adminEmail = data.adminEmail || process.env.ADMIN_EMAIL || 'admin@jouryvilla.com'

      const adminContext = {
        to: adminEmail,
        data: {
          reservation: reservationData,
          property: property || {},
          user: user,
          reason: data.reason
        }
      }

      customerResult = await sendEmail(type, adminContext)

      // Log email activity
      await logEmailActivity(type, data.reservationId, adminEmail, customerResult.success)
    }

    return customerResult

  } catch (error) {
    console.error('Email service error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send booking confirmation email (for immediate confirmations)
 */
export async function sendBookingConfirmation(reservationId: string): Promise<{ success: boolean; error?: string }> {
  return sendBookingEmail('confirmation', { reservationId })
}

/**
 * Send approval required email (for bookings requiring admin approval)
 */
export async function sendApprovalRequired(reservationId: string): Promise<{ success: boolean; error?: string }> {
  const customerResult = await sendBookingEmail('approval_required', { reservationId })

  // Also notify admin of new booking
  await sendBookingEmail('admin_new_booking', { reservationId })

  return customerResult
}

/**
 * Send booking approved email
 */
export async function sendBookingApproved(reservationId: string): Promise<{ success: boolean; error?: string }> {
  return sendBookingEmail('approved', { reservationId })
}

/**
 * Send booking declined email
 */
export async function sendBookingDeclined(reservationId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  return sendBookingEmail('declined', { reservationId, reason })
}

/**
 * Send booking cancelled email
 */
export async function sendBookingCancelled(reservationId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  const customerResult = await sendBookingEmail('cancelled', { reservationId, reason })

  // Also notify admin of cancellation
  await sendBookingEmail('admin_booking_cancelled', { reservationId, reason })

  return customerResult
}

/**
 * Send booking rescheduled email
 */
export async function sendBookingRescheduled(
  reservationId: string,
  oldCheckIn: string,
  oldCheckOut: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return sendBookingEmail('rescheduled', {
    reservationId,
    reason,
    oldCheckIn,
    oldCheckOut
  })
}

/**
 * Send reminder email (for upcoming stays)
 */
export async function sendBookingReminder(reservationId: string): Promise<{ success: boolean; error?: string }> {
  return sendBookingEmail('reminder', { reservationId })
}

/**
 * Log email activity to audit trail
 */
async function logEmailActivity(
  emailType: string,
  reservationId: string,
  recipientEmail: string,
  success: boolean
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: null, // System action
        action: 'EMAIL_SENT',
        target_type: 'Reservation',
        target_id: reservationId,
        payload: {
          email_type: emailType,
          recipient: recipientEmail,
          success: success,
          timestamp: new Date().toISOString()
        }
      })
  } catch (error) {
    console.error('Failed to log email activity:', error)
    // Don't throw error for logging failures
  }
}

/**
 * Send administrative email notifications
 */
export async function sendAdminEmail(
  type: 'admin_new_booking' | 'admin_booking_cancelled',
  reservationId: string,
  adminEmail?: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return sendBookingEmail(type, {
    reservationId,
    adminEmail: adminEmail || process.env.ADMIN_EMAIL || 'admin@jouryvilla.com',
    reason
  })
}

/**
 * Batch send reminders for upcoming check-ins
 */
export async function sendUpcomingCheckInReminders(): Promise<{ sent: number; failed: number }> {
  try {
    // Get reservations checking in tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: upcomingReservations, error } = await supabase
      .from('reservations')
      .select('id')
      .eq('check_in', tomorrowStr)
      .eq('status', 'APPROVED')

    if (error) {
      console.error('Failed to fetch upcoming reservations:', error)
      return { sent: 0, failed: 0 }
    }

    let sent = 0
    let failed = 0

    for (const reservation of upcomingReservations || []) {
      const result = await sendBookingReminder(reservation.id)
      if (result.success) {
        sent++
      } else {
        failed++
      }
    }

    return { sent, failed }

  } catch (error) {
    console.error('Batch reminder error:', error)
    return { sent: 0, failed: 0 }
  }
}

/**
 * Send custom email from admin
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: 'Joury Villa <noreply@resend.dev>',
      to: to,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: white;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
                border-radius: 0 0 8px 8px;
              }
              .message {
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Joury Villa</h1>
            </div>
            <div class="content">
              <div class="message">${message.replace(/\n/g, '<br>')}</div>
              <div class="footer">
                <p>This email was sent by the Joury Villa administration team.</p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send custom email:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Custom email sent successfully to:', to)
    return { success: true }

  } catch (error) {
    console.error('Custom email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}