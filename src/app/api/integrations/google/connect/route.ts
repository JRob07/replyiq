import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildGoogleAuthUrl } from '@/lib/google-business'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const state = Buffer.from(JSON.stringify({ userId: user.id, nonce: crypto.randomUUID() })).toString('base64url')
    return NextResponse.redirect(buildGoogleAuthUrl(state))
  } catch (error) {
    console.error('[google-connect] Failed to start OAuth:', error)
    return NextResponse.redirect(new URL('/dashboard/settings?google=connect_error', request.url))
  }
}
