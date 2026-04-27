import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { isPlanKey, PLANS, type PlanKey } from '@/lib/plans'

type CheckoutRequestBody = {
  plan?: string
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  business_name: string | null
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

const createErrorResponse = (message: string, status = 400) => {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as CheckoutRequestBody | null
    const requestedPlan = body?.plan

    console.log('[checkout] Incoming checkout request:', {
      requestedPlan,
    })

    if (!requestedPlan || !isPlanKey(requestedPlan)) {
      console.warn('[checkout] Invalid plan requested:', requestedPlan)

      return createErrorResponse(
        'Invalid plan selected. Please choose Starter, Pro, or Agency.',
        400
      )
    }

    const planKey: PlanKey = requestedPlan
    const plan = PLANS[planKey]

    if (!plan.priceId || !plan.priceId.startsWith('price_')) {
      console.error('[checkout] Missing or invalid Stripe price ID:', {
        planKey,
        priceId: plan.priceId,
      })

      return createErrorResponse(
        `Stripe price ID is missing or invalid for the ${plan.name} plan.`,
        500
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('[checkout] Supabase auth error:', userError)

      return createErrorResponse('Authentication failed. Please log in again.', 401)
    }

    if (!user) {
      console.warn('[checkout] No authenticated user found.')

      return createErrorResponse('You must be logged in to upgrade.', 401)
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, business_name, stripe_customer_id')
      .eq('id', user.id)
      .single<ProfileRow>()

    if (profileError) {
      console.error('[checkout] Failed to fetch profile:', profileError)

      return createErrorResponse(
        'Could not load your billing profile. Please refresh and try again.',
        500
      )
    }

    if (!profile) {
      console.error('[checkout] Profile not found for user:', user.id)

      return createErrorResponse(
        'Billing profile not found. Please contact support.',
        404
      )
    }

    let stripeCustomerId = profile.stripe_customer_id

    if (!stripeCustomerId) {
      console.log('[checkout] Creating Stripe customer for user:', user.id)

      const customer = await stripe.customers.create({
        email: profile.email || user.email || undefined,
        name: profile.full_name || undefined,
        metadata: {
          userId: user.id,
          businessName: profile.business_name || '',
        },
      })

      stripeCustomerId = customer.id

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          stripe_customer_id: stripeCustomerId,
        })
        .eq('id', user.id)

      if (updateProfileError) {
        console.error(
          '[checkout] Failed to save Stripe customer ID:',
          updateProfileError
        )

        return createErrorResponse(
          'Could not save your billing profile. Please try again.',
          500
        )
      }
    }

    const appUrl = getAppUrl(request)

    console.log('[checkout] Creating Stripe Checkout session:', {
      userId: user.id,
      planKey,
      priceId: plan.priceId,
      stripeCustomerId,
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/billing?checkout=success&plan=${planKey}`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled&plan=${planKey}`,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: planKey,
        },
      },
      metadata: {
        userId: user.id,
        plan: planKey,
      },
    })

    if (!session.url) {
      console.error('[checkout] Stripe session created without URL:', {
        sessionId: session.id,
      })

      return createErrorResponse(
        'Stripe did not return a checkout URL. Please try again.',
        500
      )
    }

    return NextResponse.json({
      url: session.url,
    })
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error('[checkout] Stripe error:', {
        type: error.type,
        code: error.code,
        message: error.message,
        requestId: error.requestId,
      })

      return createErrorResponse(error.message, 500)
    }

    console.error('[checkout] Unexpected error:', error)

    return createErrorResponse(
      'Something went wrong while starting checkout. Please try again.',
      500
    )
  }
}