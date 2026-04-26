import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await request.json()
    const selectedPlan = PLANS[plan as keyof typeof PLANS]
    if (!selectedPlan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_id: user.id }
      })
      customerId = customer.id
      await supabase.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: { supabase_id: user.id, plan }
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('CHECKOUT ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}