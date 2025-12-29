import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, variant = 'default' } = await req.json()

    if (!['LOVE', 'APPLAUD', 'SALUTE', 'SHINE'].includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    const { id } = params

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create or update reaction
    const reaction = await prisma.postReaction.upsert({
      where: {
        postId_userId_type: {
          postId: id,
          userId: session.user.id,
          type,
        },
      },
      create: {
        postId: id,
        userId: session.user.id,
        type,
        variant,
      },
      update: {
        variant,
      },
    })

    return NextResponse.json(reaction)
  } catch (error) {
    console.error('Error creating reaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await req.json()

    if (!['LOVE', 'APPLAUD', 'SALUTE', 'SHINE'].includes(type)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
    }

    const { id } = params

    // Delete reaction
    await prisma.postReaction.delete({
      where: {
        postId_userId_type: {
          postId: id,
          userId: session.user.id,
          type,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
