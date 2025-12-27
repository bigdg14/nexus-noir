import nodemailer from 'nodemailer'

// Configure email transporter
const getTransporter = () => {
  // For development, use a test account or console logging
  if (process.env.NODE_ENV === 'development') {
    // Log emails to console in development
    return {
      sendMail: async (options: any) => {
        console.log('📧 Email would be sent:')
        console.log('To:', options.to)
        console.log('Subject:', options.subject)
        console.log('Body:', options.html || options.text)
        return { messageId: 'dev-' + Date.now() }
      },
    }
  }

  // Production email configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(to: string, token: string) {
  const transporter = getTransporter()
  const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@nexusnoir.com',
    to,
    subject: 'Verify your Nexus Noir email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Nexus Noir</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for signing up! Please verify your email address to activate your account.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Nexus Noir. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to: string, token: string) {
  const transporter = getTransporter()
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@nexusnoir.com',
    to,
    subject: 'Reset your Nexus Noir password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <div class="warning">
                <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and consider changing your password to ensure your account security.
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Nexus Noir. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(to: string, displayName: string) {
  const transporter = getTransporter()
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@nexusnoir.com',
    to,
    subject: 'Welcome to Nexus Noir!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-item { margin: 15px 0; padding-left: 25px; position: relative; }
            .feature-item::before { content: '✓'; position: absolute; left: 0; color: #2563eb; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Nexus Noir!</h1>
            </div>
            <div class="content">
              <p>Hi ${displayName},</p>
              <p>Your email has been verified! You're now part of the Nexus Noir community - where Black excellence connects.</p>

              <div class="features">
                <h3>Get started with Nexus Noir:</h3>
                <div class="feature-item">Complete your profile to stand out</div>
                <div class="feature-item">Connect with professionals in your field</div>
                <div class="feature-item">Share your insights and experiences</div>
                <div class="feature-item">Discover opportunities and collaborations</div>
              </div>

              <p style="text-align: center;">
                <a href="${appUrl}/feed" class="button">Go to Your Feed</a>
              </p>

              <p>We're excited to have you here!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Nexus Noir. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
