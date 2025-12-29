import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateFriendshipSchema = z.object({
  action: z.enum(['accept', 'reject']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const friendshipId = params.id

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    if (friendship.addresseeId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = updateFriendshipSchema.parse(body)

    const updatedFriendship = await prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    })

    // Create notification if accepted
    if (action === 'accept') {
      await prisma.notification.create({
        data: {
          userId: friendship.requesterId,
          type: 'FRIEND_ACCEPT',
          actorId: session.user.id,
        },
      })
    }

    return NextResponse.json(updatedFriendship)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error updating friendship:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const friendshipId = params.id

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
    }

    if (
      friendship.requesterId !== session.user.id &&
      friendship.addresseeId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.friendship.delete({
      where: { id: friendshipId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting friendship:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
