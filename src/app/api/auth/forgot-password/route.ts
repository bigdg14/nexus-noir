import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPasswordResetToken } from '@/lib/auth/tokens'
import { sendPasswordResetEmail } from '@/lib/auth/email'
import { checkRateLimit, recordLoginAttempt } from '@/lib/auth/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(clientIp)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many password reset attempts. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success message to prevent email enumeration
    // But only send email if user exists
    if (user && user.password) {
      // Only send reset email if user has a password (not OAuth-only)
      const token = await createPasswordResetToken(user.id)
      await sendPasswordResetEmail(user.email, token)
      await recordLoginAttempt(clientIp, true)
    } else {
      // Add delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500))
      await recordLoginAttempt(clientIp, false)
    }

    return NextResponse.json(
      {
        message: 'If an account exists with this email, you will receive a password reset link shortly.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
