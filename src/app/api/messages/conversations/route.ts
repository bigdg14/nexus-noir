import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createConversationSchema = z.object({
  participantId: z.string().uuid(),
})

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: session.user.id }, { participant2Id: session.user.id }],
      },
      include: {
        participant1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        participant2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            content: true,
            createdAt: true,
            read: true,
            senderId: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    })

    const enrichedConversations = conversations.map((conv) => {
      const otherParticipant =
        conv.participant1Id === session.user.id ? conv.participant2 : conv.participant1
      return {
        id: conv.id,
        otherParticipant,
        lastMessage: conv.messages[0] || null,
        lastMessageAt: conv.lastMessageAt,
      }
    })

    return NextResponse.json(enrichedConversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
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
    const { participantId } = createConversationSchema.parse(body)

    if (participantId === session.user.id) {
      return NextResponse.json({ error: 'Cannot create conversation with yourself' }, { status: 400 })
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: session.user.id, participant2Id: participantId },
          { participant1Id: participantId, participant2Id: session.user.id },
        ],
      },
    })

    if (existingConversation) {
      return NextResponse.json(existingConversation)
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participant1Id: session.user.id,
        participant2Id: participantId,
      },
      include: {
        participant1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        participant2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
