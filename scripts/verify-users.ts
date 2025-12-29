import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function verifyUsers() {
  try {
    console.log('🔍 Checking user email verification status...\n')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        emailVerified: true,
      },
    })

    console.log(`Found ${users.length} users:\n`)

    for (const user of users) {
      console.log(`📧 ${user.email} (${user.username})`)
      console.log(`   Verified: ${user.emailVerified}`)
    }

    const unverifiedCount = users.filter((u) => !u.emailVerified).length

    if (unverifiedCount > 0) {
      console.log(`\n⚠️  ${unverifiedCount} users are not verified`)
      console.log('Would you like to verify all users? (This will allow them to log in)')
      console.log('\nRun: npx tsx scripts/verify-all-users.ts')
    } else {
      console.log('\n✅ All users are verified!')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyUsers()
