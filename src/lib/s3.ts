import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.S3_BUCKET_REGION || process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME!
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL

export interface PresignedUploadUrl {
  uploadUrl: string
  fileUrl: string
  key: string
}

/**
 * Generate a presigned URL for uploading files to S3
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300 // 5 minutes
): Promise<PresignedUploadUrl> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn })

  // Use CloudFront URL if available, otherwise S3 URL
  const region = process.env.S3_BUCKET_REGION || process.env.AWS_REGION || 'us-east-2'
  const fileUrl = CLOUDFRONT_URL
    ? `${CLOUDFRONT_URL}/${key}`
    : `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`

  return {
    uploadUrl,
    fileUrl,
    key,
  }
}

/**
 * Delete a file from S3
 */
export async function deleteS3File(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Generate a unique S3 key for a file
 */
export function generateS3Key(userId: string, fileName: string, type: 'avatar' | 'post'): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(7)
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')

  return `${type}s/${userId}/${timestamp}-${randomString}-${sanitizedFileName}`
}

/**
 * Extract S3 key from CloudFront or S3 URL
 */
export function extractS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // CloudFront URL
    if (CLOUDFRONT_URL && url.startsWith(CLOUDFRONT_URL)) {
      return url.replace(`${CLOUDFRONT_URL}/`, '')
    }

    // S3 URL
    if (urlObj.hostname.includes('amazonaws.com')) {
      return urlObj.pathname.substring(1) // Remove leading slash
    }

    return null
  } catch {
    return null
  }
}
