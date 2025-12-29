import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().max(5000),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  mediaType: z.enum(['NONE', 'IMAGE', 'VIDEO']).default('NONE'),
  privacyLevel: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).default('PUBLIC'),
}).refine((data) => {
  // Either content or media must be present
  return data.content.trim().length > 0 || (data.mediaUrls && data.mediaUrls.length > 0)
}, {
  message: 'Post must have either content or media',
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = createPostSchema.parse(body)

    const post = await prisma.post.create({
      data: {
        ...validatedData,
        mediaUrls: validatedData.mediaUrls || [],
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    })

    // Invalidate feed cache for user's followers
    await cache.invalidatePattern(`feed:*`)

    // Create notifications for friends
    const friends = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: session.user.id },
          { addresseeId: session.user.id },
        ],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    })

    const friendIds = friends.map((f) =>
      f.requesterId === session.user.id ? f.addresseeId : f.requesterId
    )

    // Create notifications asynchronously (you'd use a queue in production)
    if (friendIds.length > 0) {
      prisma.notification
        .createMany({
          data: friendIds.map((friendId) => ({
            userId: friendId,
            type: 'POST_LIKE' as const,
            actorId: session.user.id,
            postId: post.id,
          })),
        })
        .catch((err) => console.error('Error creating notifications:', err))
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
