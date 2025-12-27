import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const receivedRequests = await prisma.friendship.findMany({
      where: {
        addresseeId: session.user.id,
        status: 'PENDING',
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const sentRequests = await prisma.friendship.findMany({
      where: {
        requesterId: session.user.id,
        status: 'PENDING',
      },
      include: {
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      received: receivedRequests,
      sent: sentRequests,
    })
  } catch (error) {
    console.error('Error fetching friend requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
