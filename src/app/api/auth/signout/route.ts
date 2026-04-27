import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const redirectUrl = new URL('/', request.url)

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[signout] Supabase signOut failed:', error)
    }

    return NextResponse.redirect(redirectUrl, {
      status: 303,
    })
  } catch (error) {
    console.error('[signout] Unexpected error:', error)

    return NextResponse.redirect(redirectUrl, {
      status: 303,
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}