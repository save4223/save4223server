import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = ['www.statpack.com.au', 'statpack.com.au']

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new NextResponse('Host not allowed', { status: 403 })
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)',
      Referer: parsed.origin,
    },
  })

  if (!response.ok) {
    return new NextResponse('Failed to fetch image', { status: response.status })
  }

  const contentType = response.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await response.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
