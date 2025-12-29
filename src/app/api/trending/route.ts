import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get recent posts (last 7 days) to analyze for trending topics
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        privacyLevel: 'PUBLIC',
      },
      select: {
        id: true,
        content: true,
        likeCount: true,
        commentCount: true,
        repostCount: true,
        createdAt: true,
      },
    })

    // Extract hashtags from posts
    const hashtagCounts: Record<string, { count: number; posts: number }> = {}
    const hashtagPosts: Record<string, string[]> = {}

    recentPosts.forEach(post => {
      const hashtags = extractHashtags(post.content)
      hashtags.forEach(tag => {
        const lowerTag = tag.toLowerCase()
        if (!hashtagCounts[lowerTag]) {
          hashtagCounts[lowerTag] = { count: 0, posts: 0 }
          hashtagPosts[lowerTag] = []
        }
        hashtagCounts[lowerTag].count += 1
        if (!hashtagPosts[lowerTag].includes(post.id)) {
          hashtagPosts[lowerTag].push(post.id)
          hashtagCounts[lowerTag].posts += 1
        }
      })
    })

    // Sort hashtags by engagement
    const trendingHashtags = Object.entries(hashtagCounts)
      .map(([tag, data]) => ({
        tag,
        count: data.posts,
        mentions: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get trending posts (most engagement in last 24 hours)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const trendingPosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
        privacyLevel: 'PUBLIC',
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
      orderBy: [
        { likeCount: 'desc' },
        { commentCount: 'desc' },
        { repostCount: 'desc' },
      ],
      take: 5,
    })

    // Calculate engagement score for each post
    const rankedPosts = trendingPosts.map(post => {
      const engagementScore =
        (post.likeCount * 1) +
        (post.commentCount * 2) +
        (post.repostCount * 3)

      return {
        ...post,
        engagementScore,
      }
    }).sort((a, b) => b.engagementScore - a.engagementScore)

    return NextResponse.json({
      hashtags: trendingHashtags,
      posts: rankedPosts,
    })
  } catch (error) {
    console.error('Error fetching trending topics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g
  const matches = text.match(hashtagRegex)
  return matches ? matches.map(tag => tag.slice(1)) : []
}
