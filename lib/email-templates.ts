import { Resend } from 'resend'
import { format, addDays } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailType = 
  | 'confirmation'
  | 'approval_required'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'reminder'
  | 'verification'
  | 'password_reset'

export interface EmailContext {
  to: string
  data: {
    reservation?: any
    property?: any
    user?: any
    verificationUrl?: string
    resetUrl?: string
    [key: string]: any
  }
}

export async function sendEmail(
  type: EmailType, 
  context: EmailContext
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = getEmailTemplate(type, context)
    const attachments: any[] = []

    // Add ICS calendar file for reservation confirmations
    if (type === 'confirmation' && context.data.reservation) {
      const icsContent = generateICS(context.data.reservation, context.data.property)
      attachments.push({
        filename: 'reservation.ics',
        content: Buffer.from(icsContent),
        type: 'text/calendar'
      })
    }

    const { data, error } = await resend.emails.send({
      from: 'Joury Villa <noreply@jouryvilla.com>',
      to: context.to,
      subject: template.subject,
      html: template.html,
      attachments: attachments.length > 0 ? attachments : undefined
    })

    if (error) {
      console.error('Email sending failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true }

  } catch (error) {
    console.error('Email sending error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

function getEmailTemplate(
  type: EmailType, 
  context: EmailContext
): { subject: string; html: string } {
  const { reservation, property, user } = context.data

  const baseStyles = `
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 20px;
        background: #f9f9f9;
      }
      .container { 
        background: white; 
        padding: 30px; 
        border-radius: 8px; 
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      .header { 
        text-align: center; 
        border-bottom: 2px solid #007bff; 
        padding-bottom: 20px; 
        margin-bottom: 30px;
      }
      .logo { 
        font-size: 24px; 
        font-weight: bold; 
        color: #007bff; 
      }
      .content { 
        margin-bottom: 30px; 
      }
      .reservation-details {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 6px;
        margin: 20px 0;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding: 5px 0;
        border-bottom: 1px solid #eee;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .label {
        font-weight: 600;
        color: #666;
      }
      .value {
        color: #333;
      }
      .cta-button {
        display: inline-block;
        background: #007bff;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 20px 0;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        font-size: 14px;
        color: #666;
        text-align: center;
      }
      .warning {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
      }
      .success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
      }
    </style>
  `

  switch (type) {
    case 'confirmation':
      return {
        subject: `Booking Confirmation - Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa</div>
                <h1>Booking Confirmation</h1>
              </div>
              
              <div class="content">
                <div class="success">
                  <strong>Great news!</strong> Your reservation has been confirmed.
                </div>
                
                <p>Dear ${user?.full_name || 'Guest'},</p>
                
                <p>Thank you for choosing Joury Villa for your stay in historic Jericho. We're excited to welcome you!</p>
                
                ${reservation ? `
                <div class="reservation-details">
                  <h3>Reservation Details</h3>
                  <div class="detail-row">
                    <span class="label">Reservation ID:</span>
                    <span class="value">${reservation.id}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-in:</span>
                    <span class="value">${format(new Date(reservation.check_in), 'EEEE, MMMM do, yyyy')}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-out:</span>
                    <span class="value">${format(new Date(reservation.check_out), 'EEEE, MMMM do, yyyy')}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Nights:</span>
                    <span class="value">${reservation.nights}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Guests:</span>
                    <span class="value">${reservation.adults} adults${reservation.children > 0 ? `, ${reservation.children} children` : ''}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Total Amount:</span>
                    <span class="value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: property?.currency || 'ILS' }).format(reservation.total / 100)}</span>
                  </div>
                </div>
                ` : ''}
                
                <h3>What's Next?</h3>
                <ul>
                  <li>A calendar invitation (.ics file) is attached to this email</li>
                  <li>You'll receive check-in instructions 24 hours before your arrival</li>
                  <li>Feel free to contact us with any questions</li>
                </ul>
                
                <p>We look forward to hosting you at Joury Villa!</p>
              </div>
              
              <div class="footer">
                <p>Joury Villa - Historic Jericho, Palestinian Territories</p>
                <p>Questions? Reply to this email or contact us directly.</p>
              </div>
            </div>
          </body>
        `
      }

    case 'approval_required':
      return {
        subject: `Booking Request Received - Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa</div>
                <h1>Booking Request Received</h1>
              </div>
              
              <div class="content">
                <div class="warning">
                  <strong>Pending Approval:</strong> Your booking request is being reviewed.
                </div>
                
                <p>Dear ${user?.full_name || 'Guest'},</p>
                
                <p>Thank you for your interest in staying at Joury Villa. We have received your booking request and are currently reviewing it.</p>
                
                ${reservation ? `
                <div class="reservation-details">
                  <h3>Requested Booking Details</h3>
                  <div class="detail-row">
                    <span class="label">Request ID:</span>
                    <span class="value">${reservation.id}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-in:</span>
                    <span class="value">${format(new Date(reservation.check_in), 'EEEE, MMMM do, yyyy')}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Check-out:</span>
                    <span class="value">${format(new Date(reservation.check_out), 'EEEE, MMMM do, yyyy')}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Guests:</span>
                    <span class="value">${reservation.adults} adults${reservation.children > 0 ? `, ${reservation.children} children` : ''}</span>
                  </div>
                </div>
                ` : ''}
                
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>We'll review your request within 24 hours</li>
                  <li>You'll receive a confirmation email once approved</li>
                  <li>Payment instructions will be included with your confirmation</li>
                </ul>
                
                <p>Thank you for your patience!</p>
              </div>
              
              <div class="footer">
                <p>Joury Villa - Historic Jericho, Palestinian Territories</p>
              </div>
            </div>
          </body>
        `
      }

    case 'verification':
      return {
        subject: `Verify Your Email - Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa</div>
                <h1>Email Verification</h1>
              </div>
              
              <div class="content">
                <p>Hello,</p>
                
                <p>Welcome to Joury Villa! Please verify your email address to complete your account setup.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${context.data.verificationUrl}" class="cta-button">Verify Email Address</a>
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 14px;">${context.data.verificationUrl}</p>
                
                <p><strong>This link will expire in 24 hours.</strong></p>
                
                <p>If you didn't create an account with us, please ignore this email.</p>
              </div>
              
              <div class="footer">
                <p>Joury Villa - Historic Jericho, Palestinian Territories</p>
              </div>
            </div>
          </body>
        `
      }

    default:
      return {
        subject: `Joury Villa Notification`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa</div>
                <h1>Notification</h1>
              </div>
              
              <div class="content">
                <p>This is a notification from Joury Villa.</p>
              </div>
              
              <div class="footer">
                <p>Joury Villa - Historic Jericho, Palestinian Territories</p>
              </div>
            </div>
          </body>
        `
      }
  }
}

function generateICS(reservation: any, property: any): string {
  const startDate = new Date(reservation.check_in)
  const endDate = new Date(reservation.check_out)
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Joury Villa//Reservation//EN',
    'BEGIN:VEVENT',
    `UID:reservation-${reservation.id}@jouryvilla.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART;VALUE=DATE:${startDate.toISOString().split('T')[0].replace(/[-]/g, '')}`,
    `DTEND;VALUE=DATE:${endDate.toISOString().split('T')[0].replace(/[-]/g, '')}`,
    `SUMMARY:Joury Villa Reservation`,
    `DESCRIPTION:Your stay at Joury Villa\\nReservation ID: ${reservation.id}\\nGuests: ${reservation.adults} adults${reservation.children > 0 ? `, ${reservation.children} children` : ''}`,
    `LOCATION:${property?.address || 'Jericho, Palestinian Territories'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  
  return icsContent
}