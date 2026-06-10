import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST() {
  revalidateTag('principles')
  revalidateTag('not-promoted')
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() })
}
