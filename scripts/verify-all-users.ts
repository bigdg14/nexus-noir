import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function verifyAllUsers() {
  try {
    console.log('📧 Verifying all users in the database...\n')

    const result = await prisma.user.updateMany({
      where: {
        emailVerified: false,
      },
      data: {
        emailVerified: true,
      },
    })

    console.log(`✅ Verified ${result.count} users`)
    console.log('\n🎉 All users can now log in!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAllUsers()
