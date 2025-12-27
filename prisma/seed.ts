import { PrismaClient, PrivacyLevel } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.postLike.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.friendship.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'marcus.williams@example.com',
        username: 'marcusw',
        displayName: 'Marcus Williams',
        bio: 'Software Engineer passionate about building scalable applications. Love connecting with fellow professionals!',
        profession: 'Software Engineer',
        location: 'Atlanta, GA',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jasmine.thompson@example.com',
        username: 'jasminethompson',
        displayName: 'Jasmine Thompson',
        bio: 'Product Manager with a passion for innovation. Building the future, one product at a time.',
        profession: 'Product Manager',
        location: 'New York, NY',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
    prisma.user.create({
      data: {
        email: 'darius.carter@example.com',
        username: 'dariusc',
        displayName: 'Darius Carter',
        bio: 'Data Scientist exploring the intersection of AI and social good.',
        profession: 'Data Scientist',
        location: 'San Francisco, CA',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
    prisma.user.create({
      data: {
        email: 'ayesha.jackson@example.com',
        username: 'ayeshaj',
        displayName: 'Ayesha Jackson',
        bio: 'Marketing strategist helping brands tell their stories. Advocate for diversity in tech.',
        profession: 'Marketing Director',
        location: 'Chicago, IL',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
    prisma.user.create({
      data: {
        email: 'trevor.andrews@example.com',
        username: 'trevorandrews',
        displayName: 'Trevor Andrews',
        bio: 'Entrepreneur and founder. Building community-driven platforms.',
        profession: 'Founder & CEO',
        location: 'Austin, TX',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
  ])

  console.log('Created users:', users.length)

  // Create friendships
  const friendships = await Promise.all([
    prisma.friendship.create({
      data: {
        requesterId: users[0].id,
        addresseeId: users[1].id,
        status: 'ACCEPTED',
      },
    }),
    prisma.friendship.create({
      data: {
        requesterId: users[0].id,
        addresseeId: users[2].id,
        status: 'ACCEPTED',
      },
    }),
    prisma.friendship.create({
      data: {
        requesterId: users[1].id,
        addresseeId: users[3].id,
        status: 'ACCEPTED',
      },
    }),
    prisma.friendship.create({
      data: {
        requesterId: users[2].id,
        addresseeId: users[4].id,
        status: 'PENDING',
      },
    }),
  ])

  console.log('Created friendships:', friendships.length)

  // Create follows
  const follows = await Promise.all([
    prisma.follow.create({
      data: {
        followerId: users[0].id,
        followingId: users[3].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: users[1].id,
        followingId: users[4].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: users[3].id,
        followingId: users[0].id,
      },
    }),
  ])

  console.log('Created follows:', follows.length)

  // Create posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        authorId: users[0].id,
        content:
          'Excited to share that I just launched my new project! It\'s been months of hard work, but seeing it come to life is incredibly rewarding. Big thanks to everyone who supported me along the way. 🚀',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
    prisma.post.create({
      data: {
        authorId: users[1].id,
        content:
          'Just finished an amazing workshop on product strategy. The key takeaway? Always start with the customer problem, not your solution. What\'s your favorite product management principle?',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
    prisma.post.create({
      data: {
        authorId: users[2].id,
        content:
          'Working on a fascinating ML model for predicting community engagement. The intersection of data science and social good never ceases to amaze me. Would love to hear about similar projects you\'re working on!',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
    prisma.post.create({
      data: {
        authorId: users[3].id,
        content:
          'Representation matters. Today, I\'m grateful to be part of a community that celebrates diversity and empowers Black professionals to thrive. Let\'s keep lifting each other up!',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
    prisma.post.create({
      data: {
        authorId: users[4].id,
        content:
          'Startup life update: Just closed our seed round! It\'s been a wild journey from idea to here. To all the founders out there grinding - keep pushing, your breakthrough is coming.',
        privacyLevel: PrivacyLevel.PUBLIC,
      },
    }),
    prisma.post.create({
      data: {
        authorId: users[0].id,
        content:
          'Quick tip for developers: Don\'t underestimate the power of good documentation. Your future self (and your teammates) will thank you!',
        privacyLevel: PrivacyLevel.FRIENDS,
      },
    }),
  ])

  console.log('Created posts:', posts.length)

  // Create likes
  const likes = await Promise.all([
    prisma.postLike.create({
      data: {
        postId: posts[0].id,
        userId: users[1].id,
      },
    }),
    prisma.postLike.create({
      data: {
        postId: posts[0].id,
        userId: users[2].id,
      },
    }),
    prisma.postLike.create({
      data: {
        postId: posts[1].id,
        userId: users[0].id,
      },
    }),
    prisma.postLike.create({
      data: {
        postId: posts[2].id,
        userId: users[1].id,
      },
    }),
    prisma.postLike.create({
      data: {
        postId: posts[3].id,
        userId: users[0].id,
      },
    }),
    prisma.postLike.create({
      data: {
        postId: posts[3].id,
        userId: users[1].id,
      },
    }),
    prisma.postLike.create({
      data: {
        postId: posts[3].id,
        userId: users[2].id,
      },
    }),
  ])

  // Update like counts
  await Promise.all(
    posts.map((post) =>
      prisma.post.update({
        where: { id: post.id },
        data: {
          likeCount: likes.filter((like) => like.postId === post.id).length,
        },
      })
    )
  )

  console.log('Created likes:', likes.length)

  // Create comments
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        postId: posts[0].id,
        authorId: users[1].id,
        content: 'Congratulations! This is amazing! 🎉',
      },
    }),
    prisma.comment.create({
      data: {
        postId: posts[0].id,
        authorId: users[2].id,
        content: 'Well deserved! Excited to see where this goes.',
      },
    }),
    prisma.comment.create({
      data: {
        postId: posts[1].id,
        authorId: users[0].id,
        content:
          'Love this! I always try to validate the problem before building anything. Saves so much time!',
      },
    }),
    prisma.comment.create({
      data: {
        postId: posts[3].id,
        authorId: users[1].id,
        content: 'Absolutely! We rise by lifting others. 💪',
      },
    }),
  ])

  // Update comment counts
  await Promise.all(
    posts.map((post) =>
      prisma.post.update({
        where: { id: post.id },
        data: {
          commentCount: comments.filter((comment) => comment.postId === post.id).length,
        },
      })
    )
  )

  console.log('Created comments:', comments.length)

  // Create a conversation and messages
  const conversation = await prisma.conversation.create({
    data: {
      participant1Id: users[0].id,
      participant2Id: users[1].id,
    },
  })

  const messages = await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: users[0].id,
        content: 'Hey Jasmine! Saw your post about product strategy. Would love to chat sometime!',
        read: true,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: users[1].id,
        content: 'Hi Marcus! Absolutely, would be happy to share insights. How about next week?',
        read: true,
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: users[0].id,
        content: 'Perfect! Looking forward to it.',
        read: false,
      },
    }),
  ])

  console.log('Created messages:', messages.length)

  // Create notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: 'FRIEND_ACCEPT',
        actorId: users[1].id,
        read: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: 'POST_LIKE',
        actorId: users[2].id,
        postId: posts[0].id,
        read: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: 'POST_COMMENT',
        actorId: users[1].id,
        postId: posts[0].id,
        message: 'Congratulations! This is amazing!',
        read: true,
      },
    }),
  ])

  console.log('Created notifications:', notifications.length)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
