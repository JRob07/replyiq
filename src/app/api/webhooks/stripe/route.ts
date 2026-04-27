import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { type PlanKey } from '@/lib/plans'

type StripeSubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

const PRICE_ID_TO_PLAN: Record<string, PlanKey> = {
  [process.env.STRIPE_STARTER_PRICE_ID || 'price_1TPqHq2f9f4JY5VUJfNVSWf4']:
    'starter',
  [process.env.STRIPE_PRO_PRICE_ID || 'price_1TPyQC2f9f4JY5VUExMGNb33']: 'pro',
  [process.env.STRIPE_AGENCY_PRICE_ID || 'price_1TPyPJ2f9f4JY5VUrG1c9uas']:
    'agency',
}

const getPlanFromSubscription = (
  subscription: Stripe.Subscription
): PlanKey | 'free' => {
  const priceId = subscription.items.data[0]?.price?.id

  if (!priceId) {
    console.warn('[stripe-webhook] Subscription has no price ID:', {
      subscriptionId: subscription.id,
    })

    return 'free'
  }

  const plan = PRICE_ID_TO_PLAN[priceId]

  if (!plan) {
    console.warn('[stripe-webhook] Unknown Stripe price ID:', {
      subscriptionId: subscription.id,
      priceId,
    })

    return 'free'
  }

  return plan
}

const normalizeSubscriptionStatus = (
  status: Stripe.Subscription.Status
): StripeSubscriptionStatus => {
  return status as StripeSubscriptionStatus
}

const getNextUsageResetDate = (): string => {
  const now = new Date()
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0)
  )

  return nextMonth.toISOString()
}

const updateProfileFromSubscription = async (
  subscription: Stripe.Subscription
) => {
  const plan = getPlanFromSubscription(subscription)
  const status = normalizeSubscriptionStatus(subscription.status)
  const stripeCustomerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  const userId = subscription.metadata?.userId

  if (!userId) {
    console.warn('[stripe-webhook] Subscription missing userId metadata:', {
      subscriptionId: subscription.id,
      stripeCustomerId,
    })

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: subscription.id,
        plan,
        plan_status: status,
        usage_reset_date: getNextUsageResetDate(),
      })
      .eq('stripe_customer_id', stripeCustomerId)

    if (error) {
      console.error(
        '[stripe-webhook] Failed profile update by customer ID:',
        error
      )

      throw error
    }

    return
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      plan,
      plan_status: status,
      usage_reset_date: getNextUsageResetDate(),
    })
    .eq('id', userId)

  if (error) {
    console.error('[stripe-webhook] Failed profile update by user ID:', error)

    throw error
  }

  console.log('[stripe-webhook] Profile updated from subscription:', {
    userId,
    stripeCustomerId,
    subscriptionId: subscription.id,
    plan,
    status,
  })
}

const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session
) => {
  const userId = session.metadata?.userId || session.client_reference_id
  const plan = session.metadata?.plan as PlanKey | undefined
  const stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id || null

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id || null

  if (!userId) {
    console.warn('[stripe-webhook] Checkout session missing userId:', {
      sessionId: session.id,
    })

    return
  }

  if (!stripeCustomerId) {
    console.warn('[stripe-webhook] Checkout session missing customer:', {
      sessionId: session.id,
      userId,
    })

    return
  }

  if (!subscriptionId) {
    console.warn('[stripe-webhook] Checkout session missing subscription:', {
      sessionId: session.id,
      userId,
      stripeCustomerId,
    })

    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const subscriptionPlan = getPlanFromSubscription(subscription)
  const finalPlan = plan || subscriptionPlan

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscriptionId,
      plan: finalPlan,
      plan_status: subscription.status,
      responses_used: 0,
      usage_reset_date: getNextUsageResetDate(),
    })
    .eq('id', userId)

  if (error) {
    console.error(
      '[stripe-webhook] Failed checkout session profile update:',
      error
    )

    throw error
  }

  console.log('[stripe-webhook] Checkout completed and profile updated:', {
    userId,
    stripeCustomerId,
    subscriptionId,
    plan: finalPlan,
    status: subscription.status,
  })
}

const handleSubscriptionDeleted = async (
  subscription: Stripe.Subscription
) => {
  const stripeCustomerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  const userId = subscription.metadata?.userId

  const query = supabaseAdmin.from('profiles').update({
    plan: 'free',
    plan_status: 'canceled',
    stripe_subscription_id: null,
    responses_used: 0,
    usage_reset_date: getNextUsageResetDate(),
  })

  const { error } = userId
    ? await query.eq('id', userId)
    : await query.eq('stripe_customer_id', stripeCustomerId)

  if (error) {
    console.error('[stripe-webhook] Failed subscription cancellation update:', error)

    throw error
  }

  console.log('[stripe-webhook] Subscription canceled and profile downgraded:', {
    userId,
    stripeCustomerId,
    subscriptionId: subscription.id,
  })
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET.')

    return NextResponse.json(
      {
        error: 'Stripe webhook secret is not configured.',
      },
      {
        status: 500,
      }
    )
  }

  const body = await request.text()
  const headerStore = await headers()
  const signature = headerStore.get('stripe-signature')

  if (!signature) {
    console.error('[stripe-webhook] Missing Stripe signature header.')

    return NextResponse.json(
      {
        error: 'Missing Stripe signature.',
      },
      {
        status: 400,
      }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('[stripe-webhook] Signature verification failed:', error)

    return NextResponse.json(
      {
        error: 'Invalid Stripe signature.',
      },
      {
        status: 400,
      }
    )
  }

  try {
    console.log('[stripe-webhook] Received event:', {
      id: event.id,
      type: event.type,
    })

    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        )
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await updateProfileFromSubscription(
          event.data.object as Stripe.Subscription
        )
        break
      }

      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      }

      default: {
        console.log('[stripe-webhook] Ignored event type:', event.type)
      }
    }

    return NextResponse.json({
      received: true,
    })
  } catch (error) {
    console.error('[stripe-webhook] Handler failed:', error)

    return NextResponse.json(
      {
        error: 'Webhook handler failed.',
      },
      {
        status: 500,
      }
    )
  }
}