import { createServerClient } from "@/lib/supabase"
import { randomBytes, createHash } from "crypto"
import { addHours } from "date-fns"
import { Resend } from "resend"

const supabase = createServerClient()
const resend = new Resend(process.env.RESEND_API_KEY || 'fake-key-for-build')

export async function createVerificationToken(email: string): Promise<string> {
  // Clean up expired tokens first
  await supabase
    .from('verification_tokens')
    .delete()
    .eq('email', email)
    .lt('expires', new Date().toISOString())

  // Generate secure token
  const token = randomBytes(32).toString('hex')
  const hashedToken = createHash('sha256').update(token).digest('hex')

  // Store hashed token in database
  await supabase
    .from('verification_tokens')
    .insert({
      email,
      token: hashedToken,
      type: 'email_verification',
      expires: addHours(new Date(), 24).toISOString(), // 24 hour expiry
    })

  return token // Return unhashed token for email
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const hashedToken = createHash('sha256').update(token).digest('hex')

    const { data: verificationTokens } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', hashedToken)
      .eq('type', 'email_verification')
      .eq('used', false)
      .gt('expires', new Date().toISOString())
      .limit(1)

    const verificationToken = verificationTokens?.[0]

    if (!verificationToken) {
      return {
        success: false,
        error: 'Invalid or expired verification token'
      }
    }

    // Mark token as used
    await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('id', verificationToken.id)

    // Mark user as verified
    await supabase
      .from('users')
      .update({ email_verified: new Date().toISOString() })
      .eq('email', verificationToken.email)

    // Log the verification
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', verificationToken.email)
      .limit(1)

    const user = users?.[0]

    if (user) {
      await supabase
        .from('audit_logs')
        .insert({
          actor_user_id: user.id,
          action: 'EMAIL_VERIFIED',
          target_type: 'User',
          target_id: user.id,
          payload: {
            email: user.email,
            verifiedAt: new Date()
          }
        })
    }

    return {
      success: true,
      email: verificationToken.email
    }

  } catch (error) {
    console.error('Email verification error:', error)
    return {
      success: false,
      error: 'Failed to verify email'
    }
  }
}

export async function sendVerificationEmail(email: string, name?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await createVerificationToken(email)
    const verificationUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/auth/verify?token=${token}`

    const { data, error } = await resend.emails.send({
      from: 'Joury Villa <noreply@jouryvilla.com>',
      to: email,
      subject: 'Verify your email address - Joury Villa',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Joury Villa</h1>
          </div>
          <div class="content">
            <h2>Verify your email address</h2>
            <p>Hi${name ? ` ${name}` : ''},</p>
            <p>Thank you for signing up for Joury Villa! To complete your registration and start booking your stay, please verify your email address by clicking the button below:</p>
            
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p class="code">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with Joury Villa, you can safely ignore this email.</p>
            
            <p>Best regards,<br>
            The Joury Villa Team</p>
          </div>
          <div class="footer">
            <p>Joury Villa - Jericho, Palestinian Territories<br>
            Questions? Reply to this email or visit our website.</p>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Failed to send verification email:', error)
      return {
        success: false,
        error: 'Failed to send verification email'
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Email verification error:', error)
    return {
      success: false,
      error: 'Failed to send verification email'
    }
  }
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists and is not already verified
    const { data: users } = await supabase
      .from('users')
      .select(`
        *,
        customer_profiles(
          full_name
        )
      `)
      .eq('email', email)
      .limit(1)

    const user = users?.[0]

    if (!user) {
      return {
        success: false,
        error: 'No account found with this email address'
      }
    }

    if (user.email_verified) {
      return {
        success: false,
        error: 'Email address is already verified'
      }
    }

    // Check rate limiting (max 3 verification emails per hour)
    const oneHourAgo = addHours(new Date(), -1)
    const { count } = await supabase
      .from('verification_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('type', 'email_verification')
      .gt('created_at', oneHourAgo.toISOString())

    if ((count || 0) >= 3) {
      return {
        success: false,
        error: 'Too many verification emails sent. Please wait before requesting another.'
      }
    }

    return await sendVerificationEmail(email, user.customer_profiles?.[0]?.full_name)

  } catch (error) {
    console.error('Resend verification error:', error)
    return {
      success: false,
      error: 'Failed to resend verification email'
    }
  }
}