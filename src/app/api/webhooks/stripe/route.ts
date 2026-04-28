import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { type PlanKey } from '@/lib/plans'

const PRICE_ID_TO_PLAN: Record<string, PlanKey> = {
  [process.env.STRIPE_STARTER_PRICE_ID || 'price_1TPqHq2f9f4JY5VUJfNVSWf4']: 'starter',
  [process.env.STRIPE_PRO_PRICE_ID || 'price_1TPyQC2f9f4JY5VUExMGNb33']: 'pro',
  [process.env.STRIPE_AGENCY_PRICE_ID || 'price_1TPyPJ2f9f4JY5VUrG1c9uas']: 'agency',
}

const getPlanFromSubscription = (subscription: Stripe.Subscription): PlanKey | 'free' => {
  const priceId = subscription.items.data[0]?.price?.id
  if (!priceId) return 'free'
  return PRICE_ID_TO_PLAN[priceId] || 'free'
}

const getNextUsageResetDate = (): string => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0)).toISOString()
}

const getCustomerId = (customer: string | Stripe.Customer | Stripe.DeletedCustomer): string => {
  return typeof customer === 'string' ? customer : customer.id
}

const updateProfileFromSubscription = async (subscription: Stripe.Subscription) => {
  const plan = getPlanFromSubscription(subscription)
  const stripeCustomerId = getCustomerId(subscription.customer)
  const userId = subscription.metadata?.userId

  const payload = {
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscription.id,
    plan,
    plan_status: subscription.status,
    usage_reset_date: getNextUsageResetDate(),
  }

  const { error } = userId
    ? await supabaseAdmin.from('profiles').update(payload).eq('id', userId)
    : await supabaseAdmin.from('profiles').update(payload).eq('stripe_customer_id', stripeCustomerId)

  if (error) throw error
}

const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.userId || session.client_reference_id
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null

  if (!userId || !stripeCustomerId || !subscriptionId) {
    console.warn('[stripe-webhook] Checkout session missing required metadata:', { sessionId: session.id, userId, stripeCustomerId, subscriptionId })
    return
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const plan = (session.metadata?.plan as PlanKey | undefined) || getPlanFromSubscription(subscription)

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscriptionId,
      plan,
      plan_status: subscription.status,
      responses_used: 0,
      usage_reset_date: getNextUsageResetDate(),
    })
    .eq('id', userId)

  if (error) throw error
}

const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  const stripeCustomerId = getCustomerId(subscription.customer)
  const userId = subscription.metadata?.userId
  const payload = {
    plan: 'free',
    plan_status: 'canceled',
    stripe_subscription_id: null,
    responses_used: 0,
    usage_reset_date: getNextUsageResetDate(),
  }

  const { error } = userId
    ? await supabaseAdmin.from('profiles').update(payload).eq('id', userId)
    : await supabaseAdmin.from('profiles').update(payload).eq('stripe_customer_id', stripeCustomerId)

  if (error) throw error
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return NextResponse.json({ error: 'Stripe webhook secret is not configured.' }, { status: 500 })

  const body = await request.text()
  const headerStore = await headers()
  const signature = headerStore.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('[stripe-webhook] Signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await updateProfileFromSubscription(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log('[stripe-webhook] Ignored event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe-webhook] Handler failed:', error)
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }
}
