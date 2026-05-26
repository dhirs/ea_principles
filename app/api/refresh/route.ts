import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST() {
  revalidateTag('principles')
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() })
}
