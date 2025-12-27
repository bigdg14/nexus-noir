import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEmailToken } from '@/lib/auth/tokens'
import { sendWelcomeEmail } from '@/lib/auth/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify the token
    const verification = await verifyEmailToken(token)

    if (!verification.valid || !verification.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Update user's email verified status
    const user = await prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    })

    // Send welcome email
    await sendWelcomeEmail(user.email, user.displayName)

    return NextResponse.json(
      {
        message: 'Email verified successfully! You can now sign in.',
        email: user.email,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support GET for URL-based verification
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return new Response('Missing verification token', { status: 400 })
    }

    // Verify the token
    const verification = await verifyEmailToken(token)

    if (!verification.valid || !verification.userId) {
      return new Response('Invalid or expired verification token', { status: 400 })
    }

    // Update user's email verified status
    const user = await prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    })

    // Send welcome email
    await sendWelcomeEmail(user.email, user.displayName)

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verified?success=true', req.url))
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/auth/verified?success=false', req.url))
  }
}
