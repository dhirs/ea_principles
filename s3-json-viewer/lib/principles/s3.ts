import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { unstable_cache } from "next/cache"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

export const REVALIDATE_SECONDS = 60

async function fetchPrinciplesFromS3(bucket: string, key: string) {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!response.Body) throw new Error("No data received from S3")
  const body = await response.Body.transformToString()
  return JSON.parse(body)
}

const cachedFetch = unstable_cache(fetchPrinciplesFromS3, ["principles-json"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["principles"],
})

// Single source of truth for the S3 read used by every principles route, so
// they all share one cache entry (one S3 GET per revalidate window).
export function getCachedPrinciples() {
  const bucket = process.env.S3_BUCKET_NAME || "datawhistl"
  const key = process.env.S3_JSON_KEY || "ea/principles.json"
  return cachedFetch(bucket, key)
}
