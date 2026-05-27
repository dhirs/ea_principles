import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const REVALIDATE_SECONDS = 60

async function fetchPrinciplesFromS3(bucket: string, key: string) {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!response.Body) throw new Error('No data received from S3')
  const body = await response.Body.transformToString()
  return JSON.parse(body)
}

const getCachedPrinciples = unstable_cache(
  fetchPrinciplesFromS3,
  ['principles-json'],
  { revalidate: REVALIDATE_SECONDS, tags: ['principles'] }
)

export async function GET() {
  const bucket = process.env.S3_BUCKET_NAME || 'datawhistl'
  const key = process.env.S3_JSON_KEY || 'ea/principles.json'

  try {
    const jsonData = await getCachedPrinciples(bucket, key)
    return NextResponse.json(jsonData, {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS * 5}`,
      },
    })
  } catch (error) {
    console.error('Error fetching from S3:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch data from S3',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
