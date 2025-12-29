import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions)
  const { userId } = params

  // Check cache first
  const cacheKey = `user:${userId}`
  const cachedUser = await cache.get(cacheKey)
  if (cachedUser) {
    return NextResponse.json(cachedUser)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        profession: true,
        location: true,
        privacyLevel: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check privacy settings
    if (user.privacyLevel === 'PRIVATE' && session?.user?.id !== userId) {
      // Check if they're friends
      const areFriends = session?.user?.id
        ? await prisma.friendship.findFirst({
            where: {
              status: 'ACCEPTED',
              OR: [
                { requesterId: session.user.id, addresseeId: userId },
                { requesterId: userId, addresseeId: session.user.id },
              ],
            },
          })
        : null

      if (!areFriends) {
        return NextResponse.json(
          { error: 'This profile is private' },
          { status: 403 }
        )
      }
    }

    // Check if current user is following/friends with this user
    let relationship = null
    if (session?.user?.id && session.user.id !== userId) {
      const [friendship, following] = await Promise.all([
        prisma.friendship.findFirst({
          where: {
            OR: [
              { requesterId: session.user.id, addresseeId: userId },
              { requesterId: userId, addresseeId: session.user.id },
            ],
          },
        }),
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: userId,
            },
          },
        }),
      ])

      relationship = {
        isFriend: friendship?.status === 'ACCEPTED',
        friendshipStatus: friendship?.status,
        isFollowing: !!following,
      }
    }

    const response = {
      ...user,
      relationship,
    }

    // Cache for 1 hour
    await cache.set(cacheKey, response, 3600)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
