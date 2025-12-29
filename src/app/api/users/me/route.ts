import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  profession: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  avatar: z.string().url().nullable().optional(),
  privacyLevel: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        profession: true,
        location: true,
        privacyLevel: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get counts separately
    const postCount = await prisma.post.count({
      where: { authorId: session.user.id },
    })

    const followingCount = await prisma.follow.count({
      where: { followerId: session.user.id },
    })

    const followerCount = await prisma.follow.count({
      where: { followingId: session.user.id },
    })

    const friendCount = await prisma.friendship.count({
      where: {
        OR: [
          { requesterId: session.user.id, status: 'ACCEPTED' },
          { addresseeId: session.user.id, status: 'ACCEPTED' },
        ],
      },
    })

    return NextResponse.json({
      ...user,
      postCount,
      followingCount,
      followerCount,
      friendCount,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        profession: true,
        location: true,
        privacyLevel: true,
        createdAt: true,
      },
    })

    // Get counts separately
    const postCount = await prisma.post.count({
      where: { authorId: session.user.id },
    })

    const followingCount = await prisma.follow.count({
      where: { followerId: session.user.id },
    })

    const followerCount = await prisma.follow.count({
      where: { followingId: session.user.id },
    })

    const friendCount = await prisma.friendship.count({
      where: {
        OR: [
          { requesterId: session.user.id, status: 'ACCEPTED' },
          { addresseeId: session.user.id, status: 'ACCEPTED' },
        ],
      },
    })

    return NextResponse.json({
      ...updatedUser,
      postCount,
      followingCount,
      followerCount,
      friendCount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
