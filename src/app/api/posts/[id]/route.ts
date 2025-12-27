import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        reactions: {
          where: { userId: session.user.id },
          select: { type: true },
        },
        _count: {
          select: {
            comments: true,
            reposts: true,
            saves: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get reaction counts by type
    const reactionCounts = await prisma.reaction.groupBy({
      by: ['type'],
      where: { postId: params.id },
      _count: { type: true },
    })

    const reactions = {
      love: reactionCounts.find((r) => r.type === 'LOVE')?._count.type || 0,
      applaud: reactionCounts.find((r) => r.type === 'APPLAUD')?._count.type || 0,
      salute: reactionCounts.find((r) => r.type === 'SALUTE')?._count.type || 0,
      shine: reactionCounts.find((r) => r.type === 'SHINE')?._count.type || 0,
    }

    // Check if user has reposted or saved
    const [repost, save] = await Promise.all([
      prisma.repost.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: params.id,
          },
        },
      }),
      prisma.save.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: params.id,
          },
        },
      }),
    ])

    const formattedPost = {
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      mediaType: post.mediaType,
      createdAt: post.createdAt.toISOString(),
      author: post.author,
      reactions,
      userReactions: post.reactions.map((r) => r.type.toLowerCase()),
      commentCount: post._count.comments,
      repostCount: post._count.reposts,
      saveCount: post._count.saves,
      hasReposted: !!repost,
      hasSaved: !!save,
      hasLiked: post.reactions.length > 0,
      likeCount: Object.values(reactions).reduce((a, b) => a + b, 0),
    }

    return NextResponse.json(formattedPost)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
