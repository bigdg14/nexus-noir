import { NextRequest, NextResponse } from 'next/server'
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

    const { id } = params
    const body = await req.json().catch(() => ({}))
    const { comment } = body

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create repost with optional comment
    const repost = await prisma.repost.create({
      data: {
        postId: id,
        userId: session.user.id,
        comment: comment || null,
      },
    })

    // Update repost count
    await prisma.post.update({
      where: { id },
      data: { repostCount: { increment: 1 } },
    })

    return NextResponse.json(repost)
  } catch (error: any) {
    // Handle unique constraint violation (already reposted)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Post already reposted' },
        { status: 400 }
      )
    }

    console.error('Error creating repost:', error)
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

    const { id } = params

    // Delete repost
    await prisma.repost.delete({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    })

    // Update repost count
    await prisma.post.update({
      where: { id },
      data: { repostCount: { decrement: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting repost:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
