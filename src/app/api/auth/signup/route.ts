import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { hashPassword, validatePassword } from '@/lib/auth/password'
import { createEmailVerificationToken } from '@/lib/auth/tokens'
import { sendVerificationEmail } from '@/lib/auth/email'
import { checkRateLimit, recordLoginAttempt } from '@/lib/auth/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, username, displayName } = body

    // Validate required fields
    if (!email || !password || !username || !displayName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
          error: 'Too many signup attempts. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter,
        },
        { status: 429 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      await recordLoginAttempt(clientIp, false)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      await recordLoginAttempt(clientIp, false)
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      await recordLoginAttempt(clientIp, false)
      return NextResponse.json(
        { error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingEmail) {
      await recordLoginAttempt(clientIp, false)
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    })

    if (existingUsername) {
      await recordLoginAttempt(clientIp, false)
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user (auto-verify if email not configured)
    const autoVerify = !process.env.SMTP_USER
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        username: username.toLowerCase(),
        displayName,
        emailVerified: autoVerify,
      },
    })

    // Only send email if SMTP is configured
    if (!autoVerify) {
      try {
        // Create verification token
        const token = await createEmailVerificationToken(user.id)

        // Send verification email
        await sendVerificationEmail(user.email, token)
      } catch (emailError) {
        console.error('Email send failed, but user created:', emailError)
        // Auto-verify if email fails
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        })
      }
    }

    // Record successful signup attempt
    await recordLoginAttempt(clientIp, true)

    const message = autoVerify
      ? 'Account created successfully. You can now sign in.'
      : 'Account created successfully. Please check your email to verify your account.'

    return NextResponse.json(
      {
        message,
        email: user.email,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
