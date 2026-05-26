import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function GET() {
  try {
    const bucketName = process.env.S3_BUCKET_NAME || 'datawhistl'
    const key = process.env.S3_JSON_KEY || 'ea/principles.json'

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    const response = await s3Client.send(command)
    
    if (!response.Body) {
      return NextResponse.json(
        { error: 'No data received from S3' },
        { status: 404 }
      )
    }

    const bodyContents = await response.Body.transformToString()
    const jsonData = JSON.parse(bodyContents)

    return NextResponse.json(jsonData)
  } catch (error) {
    console.error('Error fetching from S3:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data from S3', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}