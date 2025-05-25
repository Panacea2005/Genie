import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not signed in and the current path is /chat, redirect to /auth
  if (!user && req.nextUrl.pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // If user is signed in and the current path is /auth, redirect to /chat
  if (user && req.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/chat', req.url))
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/chat/:path*', '/auth']
}