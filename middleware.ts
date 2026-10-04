import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter for Next API routes (dev-only).
// For production use a shared store (Redis) and replace this with
// rate-limiter-flexible or a Cloudflare/WAF solution.

const WINDOW_MS = Number(process.env.NEXT_RATE_WINDOW_MS || 60_000)
const MAX_REQUESTS = Number(process.env.NEXT_RATE_LIMIT || 60)

const ipStore = new Map<string, { count: number; resetAt: number }>()

function getIp(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  ) as string
}

export function middleware(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname
    if (!pathname.startsWith('/api/')) return NextResponse.next()

    const ip = getIp(req)
    const now = Date.now()
    const entry = ipStore.get(ip)
    if (!entry || entry.resetAt <= now) {
      ipStore.set(ip, { count: 1, resetAt: now + WINDOW_MS })
      return NextResponse.next()
    }

    if (entry.count >= MAX_REQUESTS) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      const res = NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 })
      res.headers.set('Retry-After', String(retryAfter))
      return res
    }

    ipStore.set(ip, { count: entry.count + 1, resetAt: entry.resetAt })
    return NextResponse.next()
  } catch (e) {
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/api/:path*'],
}
