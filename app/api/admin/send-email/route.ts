import { NextRequest, NextResponse } from 'next/server'
import { sendCustomEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    console.log('📧 Admin send email API called:', { to, subject })

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, or message' },
        { status: 400 }
      )
    }

    // Send email using the email service
    await sendCustomEmail(to, subject, message)

    console.log('✅ Email sent successfully to:', to)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: String(error) },
      { status: 500 }
    )
  }
}
