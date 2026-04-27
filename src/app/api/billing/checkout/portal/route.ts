import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

type ProfileRow = {
  stripe_customer_id: string | null
}

const getAppUrl = (request: NextRequest): string => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }

  const origin = request.headers.get('origin')

  if (origin) {
    return origin.replace(/\/$/, '')
  }

  return new URL(request.url).origin
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'You must be logged in to manage billing.',
        },
        {
          status: 401,
        }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single<ProfileRow>()

    if (profileError) {
      console.error('[billing-portal] Failed to load profile:', profileError)

      return NextResponse.json(
        {
          error: 'Could not load your billing profile.',
        },
        {
          status: 500,
        }
      )
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        {
          error: 'No Stripe customer exists for this account yet.',
        },
        {
          status: 400,
        }
      )
    }

    const appUrl = getAppUrl(request)

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    })

    return NextResponse.json({
      url: portalSession.url,
    })
  } catch (error) {
    console.error('[billing-portal] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'Could not open the billing portal.',
      },
      {
        status: 500,
      }
    )
  }
}