import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create an email verification token
 */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      type: 'email-verification',
      expiresAt,
    },
  })

  return token
}

/**
 * Create a password reset token
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Delete any existing password reset tokens for this user
  await prisma.verificationToken.deleteMany({
    where: {
      userId,
      type: 'password-reset',
    },
  })

  const token = generateToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      type: 'password-reset',
      expiresAt,
    },
  })

  return token
}

/**
 * Verify an email verification token
 */
export async function verifyEmailToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return { valid: false }
  }

  if (verificationToken.type !== 'email-verification') {
    return { valid: false }
  }

  if (verificationToken.expiresAt < new Date()) {
    // Token expired, delete it
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    })
    return { valid: false }
  }

  // Token is valid, delete it (one-time use)
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  })

  return { valid: true, userId: verificationToken.userId }
}

/**
 * Verify a password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return { valid: false }
  }

  if (verificationToken.type !== 'password-reset') {
    return { valid: false }
  }

  if (verificationToken.expiresAt < new Date()) {
    // Token expired, delete it
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    })
    return { valid: false }
  }

  return { valid: true, userId: verificationToken.userId }
}

/**
 * Delete a token after use
 */
export async function deleteToken(token: string): Promise<void> {
  await prisma.verificationToken.delete({
    where: { token },
  }).catch(() => {
    // Token may already be deleted, ignore error
  })
}
