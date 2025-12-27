import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sendFriendRequestSchema = z.object({
  addresseeId: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            profession: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            profession: true,
          },
        },
      },
    })

    const friends = friendships.map((friendship) => {
      const friend =
        friendship.requesterId === session.user.id ? friendship.addressee : friendship.requester
      return {
        ...friend,
        friendshipId: friendship.id,
        friendSince: friendship.createdAt,
      }
    })

    return NextResponse.json(friends)
  } catch (error) {
    console.error('Error fetching friends:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { addresseeId } = sendFriendRequestSchema.parse(body)

    if (addresseeId === session.user.id) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 })
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId },
          { requesterId: addresseeId, addresseeId: session.user.id },
        ],
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 })
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: session.user.id,
        addresseeId,
        status: 'PENDING',
      },
      include: {
        addressee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: addresseeId,
        type: 'FRIEND_REQUEST',
        actorId: session.user.id,
      },
    })

    return NextResponse.json(friendship, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error sending friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
