import { prisma } from '@/lib/prisma'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const CLEANUP_WINDOW = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Check if an identifier (email or IP) is rate limited
 */
export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remainingAttempts?: number; retryAfter?: number }> {
  // Clean up old attempts
  await prisma.loginAttempt.deleteMany({
    where: {
      attemptedAt: {
        lt: new Date(Date.now() - CLEANUP_WINDOW),
      },
    },
  })

  // Get recent attempts
  const recentAttempts = await prisma.loginAttempt.findMany({
    where: {
      identifier,
      attemptedAt: {
        gte: new Date(Date.now() - LOCKOUT_DURATION),
      },
    },
    orderBy: {
      attemptedAt: 'desc',
    },
  })

  // Count failed attempts
  const failedAttempts = recentAttempts.filter(attempt => !attempt.successful)

  if (failedAttempts.length >= MAX_ATTEMPTS) {
    const oldestFailedAttempt = failedAttempts[failedAttempts.length - 1]
    const retryAfter = Math.ceil((oldestFailedAttempt.attemptedAt.getTime() + LOCKOUT_DURATION - Date.now()) / 1000)

    return {
      allowed: false,
      retryAfter: Math.max(0, retryAfter),
    }
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - failedAttempts.length,
  }
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(identifier: string, successful: boolean): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      identifier,
      successful,
    },
  })
}

/**
 * Clear login attempts for an identifier (e.g., after successful login)
 */
export async function clearLoginAttempts(identifier: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: {
      identifier,
    },
  })
}
