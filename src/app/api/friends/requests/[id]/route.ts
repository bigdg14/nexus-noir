import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const respondToRequestSchema = z.object({
  action: z.enum(['accept', 'reject']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = respondToRequestSchema.parse(body)
    const requestId = params.id

    // Verify the request exists and is addressed to the user
    const friendRequest = await prisma.friendship.findFirst({
      where: {
        id: requestId,
        addresseeId: session.user.id,
        status: 'PENDING',
      },
    })

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    if (action === 'accept') {
      // Accept the friend request
      const updatedFriendship = await prisma.friendship.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      })

      // Create notification for the requester
      await prisma.notification.create({
        data: {
          userId: friendRequest.requesterId,
          type: 'FRIEND_ACCEPT',
          actorId: session.user.id,
        },
      })

      return NextResponse.json(updatedFriendship)
    } else {
      // Reject the friend request
      await prisma.friendship.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error responding to friend request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
    const requestId = params.id

    // Verify the user is the requester
    const friendRequest = await prisma.friendship.findFirst({
      where: {
        id: requestId,
        requesterId: session.user.id,
        status: 'PENDING',
      },
    })

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    // Delete the friend request
    await prisma.friendship.delete({
      where: { id: requestId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling friend request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
