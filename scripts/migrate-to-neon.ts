import { PrismaClient } from '@prisma/client'

// Local database connection - try postgres user first
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_LOCAL || 'postgresql://postgres:admin@localhost:5432/social_network?schema=public',
    },
  },
})

// Neon database connection
const neonPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function migrateData() {
  try {
    console.log('🚀 Starting data migration from local to Neon...\n')

    // 1. Migrate Users
    console.log('👥 Migrating users...')
    const users = await localPrisma.user.findMany({
      include: {
        posts: true,
        postLikes: true,
        postReactions: true,
        savedPosts: true,
        reposts: true,
        comments: true,
        sentFriendRequests: true,
        receivedFriendRequests: true,
        followers: true,
        following: true,
        sentMessages: true,
        conversations1: true,
        conversations2: true,
        notifications: true,
        triggeredNotifications: true,
      },
    })

    for (const user of users) {
      const {
        posts, postLikes, postReactions, savedPosts, reposts, comments,
        sentFriendRequests, receivedFriendRequests, followers, following,
        sentMessages, conversations1, conversations2, notifications,
        triggeredNotifications, ...userData
      } = user

      await neonPrisma.user.upsert({
        where: { id: user.id },
        update: userData,
        create: userData,
      })
    }
    console.log(`✅ Migrated ${users.length} users\n`)

    // 2. Migrate Friendships
    console.log('🤝 Migrating friendships...')
    const friendships = await localPrisma.friendship.findMany()
    for (const friendship of friendships) {
      await neonPrisma.friendship.upsert({
        where: { id: friendship.id },
        update: friendship,
        create: friendship,
      })
    }
    console.log(`✅ Migrated ${friendships.length} friendships\n`)

    // 3. Migrate Follows
    console.log('👣 Migrating follows...')
    const follows = await localPrisma.follow.findMany()
    for (const follow of follows) {
      await neonPrisma.follow.upsert({
        where: { id: follow.id },
        update: follow,
        create: follow,
      })
    }
    console.log(`✅ Migrated ${follows.length} follows\n`)

    // 4. Migrate Posts
    console.log('📝 Migrating posts...')
    const posts = await localPrisma.post.findMany()
    for (const post of posts) {
      await neonPrisma.post.upsert({
        where: { id: post.id },
        update: post,
        create: post,
      })
    }
    console.log(`✅ Migrated ${posts.length} posts\n`)

    // 5. Migrate Post Likes
    console.log('❤️ Migrating post likes...')
    const postLikes = await localPrisma.postLike.findMany()
    for (const like of postLikes) {
      await neonPrisma.postLike.upsert({
        where: { id: like.id },
        update: like,
        create: like,
      })
    }
    console.log(`✅ Migrated ${postLikes.length} post likes\n`)

    // 6. Migrate Post Reactions
    console.log('😊 Migrating post reactions...')
    const postReactions = await localPrisma.postReaction.findMany()
    for (const reaction of postReactions) {
      await neonPrisma.postReaction.upsert({
        where: { id: reaction.id },
        update: reaction,
        create: reaction,
      })
    }
    console.log(`✅ Migrated ${postReactions.length} post reactions\n`)

    // 7. Migrate Saved Posts
    console.log('🔖 Migrating saved posts...')
    const savedPosts = await localPrisma.savedPost.findMany()
    for (const saved of savedPosts) {
      await neonPrisma.savedPost.upsert({
        where: { id: saved.id },
        update: saved,
        create: saved,
      })
    }
    console.log(`✅ Migrated ${savedPosts.length} saved posts\n`)

    // 8. Migrate Reposts
    console.log('🔁 Migrating reposts...')
    const reposts = await localPrisma.repost.findMany()
    for (const repost of reposts) {
      await neonPrisma.repost.upsert({
        where: { id: repost.id },
        update: repost,
        create: repost,
      })
    }
    console.log(`✅ Migrated ${reposts.length} reposts\n`)

    // 9. Migrate Comments
    console.log('💬 Migrating comments...')
    const comments = await localPrisma.comment.findMany()
    for (const comment of comments) {
      await neonPrisma.comment.upsert({
        where: { id: comment.id },
        update: comment,
        create: comment,
      })
    }
    console.log(`✅ Migrated ${comments.length} comments\n`)

    // 10. Migrate Conversations
    console.log('💌 Migrating conversations...')
    const conversations = await localPrisma.conversation.findMany()
    for (const conversation of conversations) {
      await neonPrisma.conversation.upsert({
        where: { id: conversation.id },
        update: conversation,
        create: conversation,
      })
    }
    console.log(`✅ Migrated ${conversations.length} conversations\n`)

    // 11. Migrate Messages
    console.log('✉️ Migrating messages...')
    const messages = await localPrisma.message.findMany()
    for (const message of messages) {
      await neonPrisma.message.upsert({
        where: { id: message.id },
        update: message,
        create: message,
      })
    }
    console.log(`✅ Migrated ${messages.length} messages\n`)

    // 12. Migrate Notifications
    console.log('🔔 Migrating notifications...')
    const notifications = await localPrisma.notification.findMany()
    for (const notification of notifications) {
      await neonPrisma.notification.upsert({
        where: { id: notification.id },
        update: notification,
        create: notification,
      })
    }
    console.log(`✅ Migrated ${notifications.length} notifications\n`)

    // 13. Migrate Verification Tokens
    console.log('🔑 Migrating verification tokens...')
    const tokens = await localPrisma.verificationToken.findMany()
    for (const token of tokens) {
      await neonPrisma.verificationToken.upsert({
        where: { id: token.id },
        update: token,
        create: token,
      })
    }
    console.log(`✅ Migrated ${tokens.length} verification tokens\n`)

    // 14. Migrate Accounts
    console.log('🔐 Migrating accounts...')
    const accounts = await localPrisma.account.findMany()
    for (const account of accounts) {
      await neonPrisma.account.upsert({
        where: { id: account.id },
        update: account,
        create: account,
      })
    }
    console.log(`✅ Migrated ${accounts.length} accounts\n`)

    // 15. Migrate Login Attempts
    console.log('🔒 Migrating login attempts...')
    const loginAttempts = await localPrisma.loginAttempt.findMany()
    for (const attempt of loginAttempts) {
      await neonPrisma.loginAttempt.upsert({
        where: { id: attempt.id },
        update: attempt,
        create: attempt,
      })
    }
    console.log(`✅ Migrated ${loginAttempts.length} login attempts\n`)

    console.log('🎉 Migration completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Users: ${users.length}`)
    console.log(`   Friendships: ${friendships.length}`)
    console.log(`   Posts: ${posts.length}`)
    console.log(`   Comments: ${comments.length}`)
    console.log(`   Messages: ${messages.length}`)
    console.log(`   Notifications: ${notifications.length}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await localPrisma.$disconnect()
    await neonPrisma.$disconnect()
  }
}

migrateData()
  .then(() => {
    console.log('\n✨ All done! Your data has been migrated to Neon.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error)
    process.exit(1)
  })
