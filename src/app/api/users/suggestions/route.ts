import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    // Check total user count to determine if we should prioritize new members
    const totalUserCount = await prisma.user.count()
    const isEarlyStage = totalUserCount < 1000

    // Get current user's friend IDs
    const currentFriendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    })

    const friendIds = currentFriendships.map((f) =>
      f.requesterId === session.user.id ? f.addresseeId : f.requesterId
    )

    // Get pending friend requests (sent or received)
    const pendingRequests = await prisma.friendship.findMany({
      where: {
        status: 'PENDING',
        OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    })

    const pendingUserIds = pendingRequests.map((f) =>
      f.requesterId === session.user.id ? f.addresseeId : f.requesterId
    )

    // Combine all user IDs to exclude (friends, pending requests, and self)
    const excludeUserIds = [...friendIds, ...pendingUserIds, session.user.id]

    let suggestions: Array<{
      id: string
      username: string
      displayName: string
      avatar: string | null
      profession: string | null
      mutualFriends: number
    }> = []

    // Only search for users with mutual friends if the user has friends
    if (friendIds.length > 0) {
      const usersWithMutualFriends = await prisma.user.findMany({
        where: {
          id: {
            notIn: excludeUserIds,
          },
          OR: [
            {
              sentFriendRequests: {
                some: {
                  status: 'ACCEPTED',
                  addresseeId: {
                    in: friendIds,
                  },
                },
              },
            },
            {
              receivedFriendRequests: {
                some: {
                  status: 'ACCEPTED',
                  requesterId: {
                    in: friendIds,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          profession: true,
          sentFriendRequests: {
            where: {
              status: 'ACCEPTED',
              addresseeId: {
                in: friendIds,
              },
            },
            select: {
              addresseeId: true,
            },
          },
          receivedFriendRequests: {
            where: {
              status: 'ACCEPTED',
              requesterId: {
                in: friendIds,
              },
            },
            select: {
              requesterId: true,
            },
          },
        },
        take: limit * 2, // Get more to filter and sort
      })

      // Calculate mutual friends count for each user
      suggestions = usersWithMutualFriends
        .map((user) => {
          const mutualFriendIds = new Set([
            ...user.sentFriendRequests.map((f) => f.addresseeId),
            ...user.receivedFriendRequests.map((f) => f.requesterId),
          ])

          return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            profession: user.profession,
            mutualFriends: mutualFriendIds.size,
          }
        })
        .sort((a, b) => b.mutualFriends - a.mutualFriends) // Sort by mutual friends count
        .slice(0, limit)
    }

    // If we don't have enough suggestions from mutual friends, add additional users
    if (suggestions.length < limit) {
      const remainingLimit = limit - suggestions.length
      const suggestedUserIds = suggestions.map((s) => s.id)

      // For early-stage platform (< 1000 users), prioritize new members
      // After reaching 1000 users, prioritize recently active users
      const additionalUsers = await prisma.user.findMany({
        where: {
          id: {
            notIn: [...excludeUserIds, ...suggestedUserIds],
          },
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          profession: true,
          createdAt: true,
        },
        take: remainingLimit,
        orderBy: isEarlyStage
          ? { createdAt: 'desc' } // Early stage: Show newest members first to help build community
          : [
              { updatedAt: 'desc' }, // Later stage: Show recently active users
              { createdAt: 'desc' },
            ],
      })

      suggestions.push(
        ...additionalUsers.map((user) => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          profession: user.profession,
          mutualFriends: 0,
        }))
      )
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error fetching friend suggestions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
