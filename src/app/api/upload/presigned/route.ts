import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generatePresignedUploadUrl, generateS3Key } from '@/lib/s3'
import { z } from 'zod'

const presignedUrlSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  uploadType: z.enum(['avatar', 'post']),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { fileName, fileType, uploadType } = presignedUrlSchema.parse(body)

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm']
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Generate S3 key
    const key = generateS3Key(session.user.id, fileName, uploadType)

    // Generate presigned URL
    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl(key, fileType)

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error generating presigned URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
