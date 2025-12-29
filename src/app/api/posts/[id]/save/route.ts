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

    const { id } = params

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create saved post
    const savedPost = await prisma.savedPost.create({
      data: {
        postId: id,
        userId: session.user.id,
      },
    })

    // Update save count
    await prisma.post.update({
      where: { id },
      data: { saveCount: { increment: 1 } },
    })

    return NextResponse.json(savedPost)
  } catch (error: any) {
    // Handle unique constraint violation (already saved)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Post already saved' },
        { status: 400 }
      )
    }

    console.error('Error saving post:', error)
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

    // Delete saved post
    await prisma.savedPost.delete({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    })

    // Update save count
    await prisma.post.update({
      where: { id },
      data: { saveCount: { decrement: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unsaving post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
