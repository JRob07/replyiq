import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/google-business'

const parseState = (state: string | null) => {
  if (!state) return null
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as { userId?: string }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = parseState(url.searchParams.get('state'))

  if (!code || !state?.userId) return NextResponse.redirect(new URL('/dashboard/settings?google=missing_code', request.url))

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== state.userId) return NextResponse.redirect(new URL('/login', request.url))

    const tokens = await exchangeCodeForTokens(code)
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString()

    const { error } = await supabase.from('google_connections').upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        status: 'connected',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) throw error

    return NextResponse.redirect(new URL('/dashboard?google=connected', request.url))
  } catch (error) {
    console.error('[google-callback] Failed to complete OAuth:', error)
    return NextResponse.redirect(new URL('/dashboard/settings?google=callback_error', request.url))
  }
}
