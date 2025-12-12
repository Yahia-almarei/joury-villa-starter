import { Resend } from 'resend'
import { format, addDays } from 'date-fns'
import { ar } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailType =
  | 'confirmation'
  | 'approval_required'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'rescheduled'
  | 'reminder'
  | 'admin_new_booking'
  | 'admin_booking_cancelled'
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
    console.log(`📧 Attempting to send email: ${type} to ${context.to}`)

    const template = getEmailTemplate(type, context)
    const attachments: any[] = []

    // Add ICS calendar file for reservation emails
    if (['confirmation', 'approved', 'rescheduled'].includes(type) && context.data.reservation) {
      const icsContent = generateICS(context.data.reservation, context.data.property)
      attachments.push({
        filename: 'reservation.ics',
        content: Buffer.from(icsContent),
        type: 'text/calendar'
      })
    }

    // Use Resend's onboarding domain for testing until custom domain is verified
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Joury Villa <onboarding@resend.dev>'

    console.log(`📧 Email config - From: ${fromEmail}, To: ${context.to}, Type: ${type}`)

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: context.to,
      subject: template.subject,
      html: template.html,
      attachments: attachments.length > 0 ? attachments : undefined
    })

    if (error) {
      console.error('❌ Email sending failed:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Email sent successfully: ${type} to ${context.to}`, data)
    return { success: true }

  } catch (error) {
    console.error('Email sending error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Helper function to format dates in both English and Arabic
function formatDateEnglish(date: Date): string {
  return format(date, 'EEEE, MMMM do, yyyy')
}

function formatDateArabic(date: Date): string {
  return format(date, 'EEEE، do MMMM، yyyy', { locale: ar })
}

function getEmailTemplate(
  type: EmailType,
  context: EmailContext
): { subject: string; html: string } {
  const { reservation, property, user } = context.data

  const baseStyles = `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Arabic', sans-serif;
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
      .language-section {
        margin-bottom: 40px;
        padding-bottom: 40px;
        border-bottom: 2px dashed #ddd;
      }
      .language-section:last-of-type {
        border-bottom: none;
        padding-bottom: 0;
      }
      .language-label {
        display: inline-block;
        background: #007bff;
        color: white;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 15px;
        text-transform: uppercase;
      }
      .rtl {
        direction: rtl;
        text-align: right;
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
        subject: `Booking Confirmation - تأكيد الحجز | Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa - فيلا جوري</div>
                <h1>Booking Confirmation - تأكيد الحجز</h1>
              </div>

              <div class="content">
                <!-- English Section -->
                <div class="language-section">
                  <span class="language-label">English</span>

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
                    ${reservation.adults ? `
                    <div class="detail-row">
                      <span class="label">Guests:</span>
                      <span class="value">${reservation.adults} adults${reservation.children > 0 ? `, ${reservation.children} children` : ''}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                      <span class="label">Total Amount:</span>
                      <span class="value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: property?.currency || 'ILS' }).format(reservation.total)}</span>
                    </div>
                  </div>
                  ` : ''}

                  <h3>What's Next?</h3>
                  <ul>
                    <li>You'll receive check-in instructions 24 hours before your arrival</li>
                    <li>Feel free to contact us with any questions</li>
                  </ul>

                  <p>We look forward to hosting you at Joury Villa!</p>
                </div>

                <!-- Arabic Section -->
                <div class="language-section rtl">
                  <span class="language-label">العربية</span>

                  <div class="success">
                    <strong>أخبار رائعة!</strong> تم تأكيد حجزك.
                  </div>

                  <p>عزيزي/عزيزتي ${user?.full_name || 'الضيف'},</p>

                  <p>شكراً لاختيارك فيلا جوري لإقامتك في أريحا التاريخية. نحن متحمسون للترحيب بك!</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>تفاصيل الحجز</h3>
                    <div class="detail-row">
                      <span class="label">رقم الحجز:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ الوصول:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_in))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ المغادرة:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_out))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">عدد الليالي:</span>
                      <span class="value">${reservation.nights}</span>
                    </div>
                    ${reservation.adults ? `
                    <div class="detail-row">
                      <span class="label">عدد الضيوف:</span>
                      <span class="value">${reservation.adults} بالغين${reservation.children > 0 ? `، ${reservation.children} أطفال` : ''}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                      <span class="label">المبلغ الإجمالي:</span>
                      <span class="value">${new Intl.NumberFormat('ar-PS', { style: 'currency', currency: property?.currency || 'ILS' }).format(reservation.total)}</span>
                    </div>
                  </div>
                  ` : ''}

                  <h3>ما التالي؟</h3>
                  <ul>
                    <li>ستتلقى تعليمات تسجيل الوصول قبل 24 ساعة من موعد وصولك</li>
                    <li>لا تتردد في التواصل معنا إذا كان لديك أي أسئلة</li>
                  </ul>

                  <p>نتطلع لاستضافتك في فيلا جوري!</p>
                </div>
              </div>

              <div class="footer">
                <p>Joury Villa - فيلا جوري</p>
                <p>Historic Jericho, Palestinian Territories - أريحا التاريخية، فلسطين</p>
                <p>Questions? Reply to this email - أسئلة؟ قم بالرد على هذا البريد الإلكتروني</p>
              </div>
            </div>
          </body>
        `
      }

    case 'approval_required':
      return {
        subject: `Booking Request Received - تم استلام طلب الحجز | Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa - فيلا جوري</div>
                <h1>Booking Request Received - تم استلام طلب الحجز</h1>
              </div>

              <div class="content">
                <!-- English Section -->
                <div class="language-section">
                  <span class="language-label">English</span>

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
                    ${reservation.adults ? `
                    <div class="detail-row">
                      <span class="label">Guests:</span>
                      <span class="value">${reservation.adults} adults${reservation.children > 0 ? `, ${reservation.children} children` : ''}</span>
                    </div>
                    ` : ''}
                  </div>
                  ` : ''}

                  <p><strong>What happens next?</strong></p>
                  <ul>
                    <li>We'll review your request within 24 hours</li>
                    <li>You'll receive a confirmation email once approved</li>
                  </ul>

                  <p>Thank you for your patience!</p>
                </div>

                <!-- Arabic Section -->
                <div class="language-section rtl">
                  <span class="language-label">العربية</span>

                  <div class="warning">
                    <strong>في انتظار الموافقة:</strong> جاري مراجعة طلب الحجز الخاص بك.
                  </div>

                  <p>عزيزي/عزيزتي ${user?.full_name || 'الضيف'},</p>

                  <p>شكراً لاهتمامك بالإقامة في فيلا جوري. لقد استلمنا طلب حجزك ونحن نقوم حالياً بمراجعته.</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>تفاصيل الحجز المطلوب</h3>
                    <div class="detail-row">
                      <span class="label">رقم الطلب:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ الوصول:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_in))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ المغادرة:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_out))}</span>
                    </div>
                    ${reservation.adults ? `
                    <div class="detail-row">
                      <span class="label">عدد الضيوف:</span>
                      <span class="value">${reservation.adults} بالغين${reservation.children > 0 ? `، ${reservation.children} أطفال` : ''}</span>
                    </div>
                    ` : ''}
                  </div>
                  ` : ''}

                  <p><strong>ما التالي؟</strong></p>
                  <ul>
                    <li>سنقوم بمراجعة طلبك خلال 24 ساعة</li>
                    <li>ستتلقى بريداً إلكترونياً للتأكيد بمجرد الموافقة</li>
                  </ul>

                  <p>شكراً لصبرك!</p>
                </div>
              </div>

              <div class="footer">
                <p>Joury Villa - فيلا جوري</p>
                <p>Historic Jericho, Palestinian Territories - أريحا التاريخية، فلسطين</p>
              </div>
            </div>
          </body>
        `
      }

    case 'approved':
      return {
        subject: `Booking Approved - تمت الموافقة على الحجز | Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa - فيلا جوري</div>
                <h1>Booking Approved! - تمت الموافقة على الحجز!</h1>
              </div>

              <div class="content">
                <!-- English Section -->
                <div class="language-section">
                  <span class="language-label">English</span>

                  <div class="success">
                    <strong>Great news!</strong> Your booking request has been approved.
                  </div>

                  <p>Dear ${user?.full_name || 'Guest'},</p>

                  <p>We're delighted to inform you that your booking request for Joury Villa has been approved! We're excited to welcome you to historic Jericho.</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>Confirmed Reservation Details</h3>
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
                    ${reservation.adults ? `
                    <div class="detail-row">
                      <span class="label">Guests:</span>
                      <span class="value">${reservation.adults} adults${reservation.children > 0 ? `, ${reservation.children} children` : ''}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                      <span class="label">Total Amount:</span>
                      <span class="value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: property?.currency || 'ILS' }).format(reservation.total)}</span>
                    </div>
                  </div>
                  ` : ''}

                  <h3>What's Next?</h3>
                  <ul>
                    <li>You'll receive check-in instructions 24 hours before your arrival</li>
                    <li>Feel free to contact us with any questions</li>
                  </ul>

                  <p>We look forward to hosting you at Joury Villa!</p>
                </div>

                <!-- Arabic Section -->
                <div class="language-section rtl">
                  <span class="language-label">العربية</span>

                  <div class="success">
                    <strong>أخبار رائعة!</strong> تمت الموافقة على طلب حجزك.
                  </div>

                  <p>عزيزي/عزيزتي ${user?.full_name || 'الضيف'},</p>

                  <p>يسرنا إبلاغك بأنه تمت الموافقة على طلب حجزك في فيلا جوري! نحن متحمسون للترحيب بك في أريحا التاريخية.</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>تفاصيل الحجز المؤكد</h3>
                    <div class="detail-row">
                      <span class="label">رقم الحجز:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ الوصول:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_in))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ المغادرة:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_out))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">عدد الليالي:</span>
                      <span class="value">${reservation.nights}</span>
                    </div>
                    ${reservation.adults ? `
                    <div class="detail-row">
                      <span class="label">عدد الضيوف:</span>
                      <span class="value">${reservation.adults} بالغين${reservation.children > 0 ? `، ${reservation.children} أطفال` : ''}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                      <span class="label">المبلغ الإجمالي:</span>
                      <span class="value">${new Intl.NumberFormat('ar-PS', { style: 'currency', currency: property?.currency || 'ILS' }).format(reservation.total)}</span>
                    </div>
                  </div>
                  ` : ''}

                  <h3>ما التالي؟</h3>
                  <ul>
                    <li>ستتلقى تعليمات تسجيل الوصول قبل 24 ساعة من موعد وصولك</li>
                    <li>لا تتردد في التواصل معنا إذا كان لديك أي أسئلة</li>
                  </ul>

                  <p>نتطلع لاستضافتك في فيلا جوري!</p>
                </div>
              </div>

              <div class="footer">
                <p>Joury Villa - فيلا جوري</p>
                <p>Historic Jericho, Palestinian Territories - أريحا التاريخية، فلسطين</p>
                <p>Questions? Reply to this email - أسئلة؟ قم بالرد على هذا البريد الإلكتروني</p>
              </div>
            </div>
          </body>
        `
      }

    case 'declined':
      return {
        subject: `Booking Request Update - تحديث طلب الحجز | Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa - فيلا جوري</div>
                <h1>Booking Request Update - تحديث طلب الحجز</h1>
              </div>

              <div class="content">
                <!-- English Section -->
                <div class="language-section">
                  <span class="language-label">English</span>

                  <div class="warning">
                    We're sorry, but we cannot accommodate your booking request at this time.
                  </div>

                  <p>Dear ${user?.full_name || 'Guest'},</p>

                  <p>Thank you for your interest in staying at Joury Villa. Unfortunately, we are unable to confirm your booking request for the selected dates.</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>Requested Booking Details</h3>
                    <div class="detail-row">
                      <span class="label">Request ID:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Requested Check-in:</span>
                      <span class="value">${format(new Date(reservation.check_in), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Requested Check-out:</span>
                      <span class="value">${format(new Date(reservation.check_out), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                  </div>
                  ` : ''}

                  ${context.data.reason ? `<p><strong>Reason:</strong> ${context.data.reason}</p>` : ''}

                  <p><strong>What you can do:</strong></p>
                  <ul>
                    <li>Try different dates using our availability calendar</li>
                    <li>Contact us directly to discuss alternative options</li>
                    <li>Sign up for notifications when your preferred dates become available</li>
                  </ul>

                  <p>We appreciate your understanding and hope to accommodate you in the future.</p>
                </div>

                <!-- Arabic Section -->
                <div class="language-section rtl">
                  <span class="language-label">العربية</span>

                  <div class="warning">
                    نأسف، لكننا غير قادرين على استيعاب طلب حجزك في هذا الوقت.
                  </div>

                  <p>عزيزي/عزيزتي ${user?.full_name || 'الضيف'},</p>

                  <p>شكراً لاهتمامك بالإقامة في فيلا جوري. للأسف، لا يمكننا تأكيد طلب حجزك للتواريخ المحددة.</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>تفاصيل الحجز المطلوب</h3>
                    <div class="detail-row">
                      <span class="label">رقم الطلب:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ الوصول المطلوب:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_in))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ المغادرة المطلوب:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_out))}</span>
                    </div>
                  </div>
                  ` : ''}

                  ${context.data.reason ? `<p><strong>السبب:</strong> ${context.data.reason}</p>` : ''}

                  <p><strong>ما يمكنك فعله:</strong></p>
                  <ul>
                    <li>جرب تواريخ مختلفة باستخدام تقويم التوفر الخاص بنا</li>
                    <li>اتصل بنا مباشرة لمناقشة الخيارات البديلة</li>
                    <li>سجل للحصول على إشعارات عندما تصبح التواريخ المفضلة لديك متاحة</li>
                  </ul>

                  <p>نحن نقدر تفهمك ونأمل أن نستضيفك في المستقبل.</p>
                </div>
              </div>

              <div class="footer">
                <p>Joury Villa - فيلا جوري</p>
                <p>Historic Jericho, Palestinian Territories - أريحا التاريخية، فلسطين</p>
                <p>Questions? Reply to this email - أسئلة؟ قم بالرد على هذا البريد الإلكتروني</p>
              </div>
            </div>
          </body>
        `
      }

    case 'cancelled':
      return {
        subject: `Booking Cancelled - تم إلغاء الحجز | Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa - فيلا جوري</div>
                <h1>Booking Cancelled - تم إلغاء الحجز</h1>
              </div>

              <div class="content">
                <!-- English Section -->
                <div class="language-section">
                  <span class="language-label">English</span>

                  <div class="warning">
                    Your reservation has been cancelled.
                  </div>

                  <p>Dear ${user?.full_name || 'Guest'},</p>

                  <p>This email confirms that your reservation at Joury Villa has been cancelled.</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>Cancelled Reservation Details</h3>
                    <div class="detail-row">
                      <span class="label">Reservation ID:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Original Check-in:</span>
                      <span class="value">${format(new Date(reservation.check_in), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Original Check-out:</span>
                      <span class="value">${format(new Date(reservation.check_out), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Cancellation Date:</span>
                      <span class="value">${format(new Date(), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                  </div>
                  ` : ''}

                  ${context.data.reason ? `<p><strong>Reason for cancellation:</strong> ${context.data.reason}</p>` : ''}

                  <h3>Refund Information</h3>
                  <p>Any applicable refunds will be processed according to our cancellation policy. You can expect to see the refund in your original payment method within 5-10 business days.</p>

                  <p>We're sorry to see your plans change and hope to welcome you to Joury Villa in the future.</p>
                </div>

                <!-- Arabic Section -->
                <div class="language-section rtl">
                  <span class="language-label">العربية</span>

                  <div class="warning">
                    تم إلغاء حجزك.
                  </div>

                  <p>عزيزي/عزيزتي ${user?.full_name || 'الضيف'},</p>

                  <p>يؤكد هذا البريد الإلكتروني أنه تم إلغاء حجزك في فيلا جوري.</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>تفاصيل الحجز الملغى</h3>
                    <div class="detail-row">
                      <span class="label">رقم الحجز:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ الوصول الأصلي:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_in))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ المغادرة الأصلي:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_out))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ الإلغاء:</span>
                      <span class="value">${formatDateArabic(new Date())}</span>
                    </div>
                  </div>
                  ` : ''}

                  ${context.data.reason ? `<p><strong>سبب الإلغاء:</strong> ${context.data.reason}</p>` : ''}

                  <h3>معلومات الاسترداد</h3>
                  <p>سيتم معالجة أي مبالغ مستردة وفقاً لسياسة الإلغاء الخاصة بنا. يمكنك توقع رؤية المبلغ المسترد في طريقة الدفع الأصلية خلال 5-10 أيام عمل.</p>

                  <p>نأسف لرؤية تغيير خططك ونأمل أن نرحب بك في فيلا جوري في المستقبل.</p>
                </div>
              </div>

              <div class="footer">
                <p>Joury Villa - فيلا جوري</p>
                <p>Historic Jericho, Palestinian Territories - أريحا التاريخية، فلسطين</p>
                <p>Questions? Reply to this email - أسئلة؟ قم بالرد على هذا البريد الإلكتروني</p>
              </div>
            </div>
          </body>
        `
      }

    case 'rescheduled':
      return {
        subject: `Booking Rescheduled - تم إعادة جدولة الحجز | Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa - فيلا جوري</div>
                <h1>Booking Rescheduled - تم إعادة جدولة الحجز</h1>
              </div>

              <div class="content">
                <!-- English Section -->
                <div class="language-section">
                  <span class="language-label">English</span>

                  <div class="success">
                    <strong>Good news!</strong> Your reservation has been successfully rescheduled.
                  </div>

                  <p>Dear ${user?.full_name || 'Guest'},</p>

                  <p>Your reservation at Joury Villa has been rescheduled to new dates. Please update your calendar with the new information below.</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>Updated Reservation Details</h3>
                    <div class="detail-row">
                      <span class="label">Reservation ID:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">New Check-in:</span>
                      <span class="value">${format(new Date(reservation.check_in), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">New Check-out:</span>
                      <span class="value">${format(new Date(reservation.check_out), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Nights:</span>
                      <span class="value">${reservation.nights}</span>
                    </div>
                    ${context.data.oldCheckIn ? `
                    <div class="detail-row">
                      <span class="label">Previous Check-in:</span>
                      <span class="value">${format(new Date(context.data.oldCheckIn), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Previous Check-out:</span>
                      <span class="value">${format(new Date(context.data.oldCheckOut), 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                    ` : ''}
                  </div>
                  ` : ''}

                  ${context.data.reason ? `<p><strong>Reason for reschedule:</strong> ${context.data.reason}</p>` : ''}

                  <h3>What's Next?</h3>
                  <ul>
                    <li>An updated calendar invitation (.ics file) is attached to this email</li>
                    <li>Please update your travel plans accordingly</li>
                    <li>Any price differences will be adjusted and communicated separately if applicable</li>
                    <li>You'll receive check-in instructions 24 hours before your new arrival date</li>
                  </ul>

                  <p>Thank you for your flexibility, and we look forward to welcoming you on your new dates!</p>
                </div>

                <!-- Arabic Section -->
                <div class="language-section rtl">
                  <span class="language-label">العربية</span>

                  <div class="success">
                    <strong>أخبار سارة!</strong> تمت إعادة جدولة حجزك بنجاح.
                  </div>

                  <p>عزيزي/عزيزتي ${user?.full_name || 'الضيف'},</p>

                  <p>تمت إعادة جدولة حجزك في فيلا جوري إلى تواريخ جديدة. يرجى تحديث تقويمك بالمعلومات الجديدة أدناه.</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>تفاصيل الحجز المحدثة</h3>
                    <div class="detail-row">
                      <span class="label">رقم الحجز:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ الوصول الجديد:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_in))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ المغادرة الجديد:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_out))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">عدد الليالي:</span>
                      <span class="value">${reservation.nights}</span>
                    </div>
                    ${context.data.oldCheckIn ? `
                    <div class="detail-row">
                      <span class="label">تاريخ الوصول السابق:</span>
                      <span class="value">${formatDateArabic(new Date(context.data.oldCheckIn))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ المغادرة السابق:</span>
                      <span class="value">${formatDateArabic(new Date(context.data.oldCheckOut))}</span>
                    </div>
                    ` : ''}
                  </div>
                  ` : ''}

                  ${context.data.reason ? `<p><strong>سبب إعادة الجدولة:</strong> ${context.data.reason}</p>` : ''}

                  <h3>ما التالي؟</h3>
                  <ul>
                    <li>تم إرفاق دعوة تقويم محدثة (ملف .ics) بهذا البريد الإلكتروني</li>
                    <li>يرجى تحديث خطط سفرك وفقاً لذلك</li>
                    <li>سيتم تعديل أي فروق في الأسعار والإبلاغ عنها بشكل منفصل إن أمكن</li>
                    <li>ستتلقى تعليمات تسجيل الوصول قبل 24 ساعة من تاريخ وصولك الجديد</li>
                  </ul>

                  <p>شكراً لمرونتك، ونتطلع للترحيب بك في تواريخك الجديدة!</p>
                </div>
              </div>

              <div class="footer">
                <p>Joury Villa - فيلا جوري</p>
                <p>Historic Jericho, Palestinian Territories - أريحا التاريخية، فلسطين</p>
                <p>Questions? Reply to this email - أسئلة؟ قم بالرد على هذا البريد الإلكتروني</p>
              </div>
            </div>
          </body>
        `
      }

    case 'admin_new_booking':
      return {
        subject: `🔔 New Booking Request - طلب حجز جديد | Joury Villa Admin`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa Admin - إدارة فيلا جوري</div>
                <h1>🔔 New Booking Request - طلب حجز جديد</h1>
              </div>

              <div class="content">
                <div class="warning">
                  <strong>Action Required - مطلوب اتخاذ إجراء:</strong> A new booking request requires your review - طلب حجز جديد يتطلب المراجعة.
                </div>

                <p>Hello Admin - مرحباً المسؤول,</p>

                <p>A new booking request has been submitted and is pending your approval.</p>
                <p>تم تقديم طلب حجز جديد وهو بانتظار موافقتك.</p>

                ${reservation ? `
                <div class="reservation-details">
                  <h3>Booking Request Details</h3>
                  <div class="detail-row">
                    <span class="label">Request ID:</span>
                    <span class="value">${reservation.id}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Guest Name:</span>
                    <span class="value">${user?.full_name || 'Unknown'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Guest Email:</span>
                    <span class="value">${user?.email || 'Unknown'}</span>
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
                    <span class="value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: property?.currency || 'ILS' }).format(reservation.total)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Submission Time:</span>
                    <span class="value">${format(new Date(reservation.created_at || new Date()), 'EEEE, MMMM do, yyyy \\at h:mm a')}</span>
                  </div>
                </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.SITE_URL || 'http://localhost:3000'}/admin/reservations/${reservation?.id}" class="cta-button">Review Booking Request</a>
                </div>

                <p>Please review this request promptly to ensure the guest receives timely confirmation.</p>
              </div>

              <div class="footer">
                <p>Joury Villa Admin Panel</p>
                <p>This is an automated notification for administrators.</p>
              </div>
            </div>
          </body>
        `
      }

    case 'admin_booking_cancelled':
      return {
        subject: `Booking Cancelled - Joury Villa Admin Alert`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa Admin</div>
                <h1>Booking Cancelled</h1>
              </div>

              <div class="content">
                <div class="warning">
                  <strong>FYI:</strong> A booking has been cancelled.
                </div>

                <p>Hello Admin,</p>

                <p>This is to inform you that a booking has been cancelled.</p>

                ${reservation ? `
                <div class="reservation-details">
                  <h3>Cancelled Booking Details</h3>
                  <div class="detail-row">
                    <span class="label">Reservation ID:</span>
                    <span class="value">${reservation.id}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Guest Name:</span>
                    <span class="value">${user?.full_name || 'Unknown'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Original Check-in:</span>
                    <span class="value">${format(new Date(reservation.check_in), 'EEEE, MMMM do, yyyy')}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Original Check-out:</span>
                    <span class="value">${format(new Date(reservation.check_out), 'EEEE, MMMM do, yyyy')}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Cancelled On:</span>
                    <span class="value">${format(new Date(), 'EEEE, MMMM do, yyyy \\at h:mm a')}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Revenue Lost:</span>
                    <span class="value">${new Intl.NumberFormat('en-US', { style: 'currency', currency: property?.currency || 'ILS' }).format(reservation.total)}</span>
                  </div>
                </div>
                ` : ''}

                ${context.data.reason ? `<p><strong>Cancellation reason:</strong> ${context.data.reason}</p>` : ''}

                <p>The dates are now available for new bookings.</p>
              </div>

              <div class="footer">
                <p>Joury Villa Admin Panel</p>
                <p>This is an automated notification for administrators.</p>
              </div>
            </div>
          </body>
        `
      }

    case 'reminder':
      return {
        subject: `Check-in Reminder - تذكير بتسجيل الوصول | Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa - فيلا جوري</div>
                <h1>Check-in Reminder - تذكير بتسجيل الوصول</h1>
              </div>

              <div class="content">
                <!-- English Section -->
                <div class="language-section">
                  <span class="language-label">English</span>

                  <div class="success">
                    <strong>Your stay is tomorrow!</strong> We're excited to welcome you.
                  </div>

                  <p>Dear ${user?.full_name || 'Guest'},</p>

                  <p>This is a friendly reminder that your check-in at Joury Villa is tomorrow. We're looking forward to welcoming you to historic Jericho!</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>Your Reservation Details</h3>
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
                      <span class="label">Guests:</span>
                      <span class="value">${reservation.adults} adults${reservation.children > 0 ? `, ${reservation.children} children` : ''}</span>
                    </div>
                  </div>
                  ` : ''}

                  <h3>Check-in Information</h3>
                  <ul>
                    <li><strong>Check-in time:</strong> 3:00 PM - 10:00 PM</li>
                    <li><strong>Early/late check-in:</strong> Please contact us to arrange</li>
                    <li><strong>Location:</strong> Jericho, Palestinian Territories</li>
                    <li><strong>What to bring:</strong> Valid ID and your confirmation details</li>
                  </ul>

                  <h3>Contact Information</h3>
                  <p>If you have any questions or need to adjust your arrival time, please don't hesitate to reach out:</p>
                  <ul>
                    <li>Reply to this email</li>
                    <li>Visit our website for more information</li>
                  </ul>

                  <p>We can't wait to host you at Joury Villa!</p>
                </div>

                <!-- Arabic Section -->
                <div class="language-section rtl">
                  <span class="language-label">العربية</span>

                  <div class="success">
                    <strong>إقامتك غداً!</strong> نحن متحمسون للترحيب بك.
                  </div>

                  <p>عزيزي/عزيزتي ${user?.full_name || 'الضيف'},</p>

                  <p>هذا تذكير ودي بأن موعد تسجيل وصولك في فيلا جوري هو غداً. نتطلع للترحيب بك في أريحا التاريخية!</p>

                  ${reservation ? `
                  <div class="reservation-details">
                    <h3>تفاصيل حجزك</h3>
                    <div class="detail-row">
                      <span class="label">رقم الحجز:</span>
                      <span class="value">${reservation.id}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ الوصول:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_in))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">تاريخ المغادرة:</span>
                      <span class="value">${formatDateArabic(new Date(reservation.check_out))}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">عدد الضيوف:</span>
                      <span class="value">${reservation.adults} بالغين${reservation.children > 0 ? `، ${reservation.children} أطفال` : ''}</span>
                    </div>
                  </div>
                  ` : ''}

                  <h3>معلومات تسجيل الوصول</h3>
                  <ul>
                    <li><strong>وقت تسجيل الوصول:</strong> 3:00 مساءً - 10:00 مساءً</li>
                    <li><strong>تسجيل الوصول المبكر/المتأخر:</strong> يرجى التواصل معنا لترتيب ذلك</li>
                    <li><strong>الموقع:</strong> أريحا، فلسطين</li>
                    <li><strong>ما يجب إحضاره:</strong> بطاقة هوية صالحة وتفاصيل التأكيد الخاصة بك</li>
                  </ul>

                  <h3>معلومات الاتصال</h3>
                  <p>إذا كان لديك أي أسئلة أو تحتاج إلى تعديل وقت وصولك، فلا تتردد في التواصل:</p>
                  <ul>
                    <li>قم بالرد على هذا البريد الإلكتروني</li>
                    <li>قم بزيارة موقعنا الإلكتروني لمزيد من المعلومات</li>
                  </ul>

                  <p>لا يمكننا الانتظار لاستضافتك في فيلا جوري!</p>
                </div>
              </div>

              <div class="footer">
                <p>Joury Villa - فيلا جوري</p>
                <p>Historic Jericho, Palestinian Territories - أريحا التاريخية، فلسطين</p>
                <p>Safe travels! - رحلة آمنة!</p>
              </div>
            </div>
          </body>
        `
      }

    case 'verification':
      return {
        subject: `Verify Your Email - تحقق من بريدك الإلكتروني | Joury Villa`,
        html: `
          ${baseStyles}
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Joury Villa - فيلا جوري</div>
                <h1>Email Verification - تحقق من البريد الإلكتروني</h1>
              </div>

              <div class="content">
                <!-- English Section -->
                <div class="language-section">
                  <span class="language-label">English</span>

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

                <!-- Arabic Section -->
                <div class="language-section rtl">
                  <span class="language-label">العربية</span>

                  <p>مرحباً،</p>

                  <p>مرحباً بك في فيلا جوري! يرجى التحقق من عنوان بريدك الإلكتروني لإكمال إعداد حسابك.</p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${context.data.verificationUrl}" class="cta-button">تحقق من البريد الإلكتروني</a>
                  </div>

                  <p>إذا لم يعمل الزر، انسخ والصق هذا الرابط في متصفحك:</p>
                  <p style="word-break: break-all; color: #666; font-size: 14px;">${context.data.verificationUrl}</p>

                  <p><strong>سينتهي صلاحية هذا الرابط خلال 24 ساعة.</strong></p>

                  <p>إذا لم تقم بإنشاء حساب معنا، يرجى تجاهل هذا البريد الإلكتروني.</p>
                </div>
              </div>

              <div class="footer">
                <p>Joury Villa - فيلا جوري</p>
                <p>Historic Jericho, Palestinian Territories - أريحا التاريخية، فلسطين</p>
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