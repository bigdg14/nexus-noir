import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20')
  const cursor = searchParams.get('cursor')

  // Check cache first
  const cacheKey = `feed:${session.user.id}:${cursor || 'initial'}`
  const cachedFeed = await cache.get(cacheKey)
  if (cachedFeed) {
    return NextResponse.json(cachedFeed)
  }

  try {
    // Get user's friends
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: session.user.id }, { addresseeId: session.user.id }],
      },
      select: {
        requesterId: true,
        addresseeId: true,
      },
    })

    const friendIds = friendships.map((f) =>
      f.requesterId === session.user.id ? f.addresseeId : f.requesterId
    )

    // Get users they follow
    const following = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
      },
      select: {
        followingId: true,
      },
    })

    const followingIds = following.map((f) => f.followingId)

    // Combine friend IDs, following IDs, and current user ID
    const relevantUserIds = Array.from(new Set([...friendIds, ...followingIds, session.user.id]))

    // Fetch posts from relevant users
    const posts = await prisma.post.findMany({
      where: {
        authorId: {
          in: relevantUserIds,
        },
        OR: [
          { privacyLevel: 'PUBLIC' },
          {
            AND: [{ privacyLevel: 'FRIENDS' }, { authorId: { in: friendIds } }],
          },
          { authorId: session.user.id },
        ],
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
    })

    // Check which posts the current user has liked
    const postIds = posts.map((p) => p.id)
    const userLikes = await prisma.postLike.findMany({
      where: {
        postId: { in: postIds },
        userId: session.user.id,
      },
      select: {
        postId: true,
      },
    })

    const likedPostIds = new Set(userLikes.map((l) => l.postId))

    // Get user's reactions for these posts
    const userReactions = await prisma.postReaction.findMany({
      where: {
        postId: { in: postIds },
        userId: session.user.id,
      },
      select: {
        postId: true,
        type: true,
      },
    })

    // Group reactions by post
    const reactionsByPost = new Map<string, string[]>()
    userReactions.forEach((r) => {
      const existing = reactionsByPost.get(r.postId) || []
      reactionsByPost.set(r.postId, [...existing, r.type.toLowerCase()])
    })

    // Get all reactions counts per post
    const allReactions = await prisma.postReaction.groupBy({
      by: ['postId', 'type'],
      where: {
        postId: { in: postIds },
      },
      _count: {
        type: true,
      },
    })

    // Organize reaction counts by post
    const reactionCounts = new Map<string, { love: number; applaud: number; salute: number; shine: number }>()
    postIds.forEach(id => {
      reactionCounts.set(id, { love: 0, applaud: 0, salute: 0, shine: 0 })
    })
    allReactions.forEach((r) => {
      const counts = reactionCounts.get(r.postId)
      if (counts) {
        const type = r.type.toLowerCase() as 'love' | 'applaud' | 'salute' | 'shine'
        counts[type] = r._count.type
      }
    })

    // Check if user has saved/reposted these posts
    const userSaves = await prisma.savedPost.findMany({
      where: {
        postId: { in: postIds },
        userId: session.user.id,
      },
      select: { postId: true },
    })
    const savedPostIds = new Set(userSaves.map((s) => s.postId))

    const userReposts = await prisma.repost.findMany({
      where: {
        postId: { in: postIds },
        userId: session.user.id,
      },
      select: { postId: true },
    })
    const repostedPostIds = new Set(userReposts.map((r) => r.postId))

    const enrichedPosts = posts.map((post) => ({
      ...post,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      hasLiked: likedPostIds.has(post.id),
      reactions: reactionCounts.get(post.id) || { love: 0, applaud: 0, salute: 0, shine: 0 },
      userReactions: reactionsByPost.get(post.id) || [],
      hasReposted: repostedPostIds.has(post.id),
      hasSaved: savedPostIds.has(post.id),
      repostCount: post.repostCount || 0,
      saveCount: post.saveCount || 0,
    }))

    const response = {
      posts: enrichedPosts,
      nextCursor: posts.length === limit ? posts[posts.length - 1].id : null,
    }

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching feed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
