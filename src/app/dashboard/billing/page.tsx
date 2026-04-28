'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, CreditCard } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'

function BillingContent() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [loading, setLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const success = searchParams.get('checkout') === 'success' || searchParams.get('success') === 'true'
  const canceled = searchParams.get('checkout') === 'cancelled' || searchParams.get('canceled') === 'true'
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchPlan = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      if (data?.plan) setCurrentPlan(data.plan)
    }
    fetchPlan()
  }, [supabase])

  const handleUpgrade = async (plan: string) => {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
      if (!res.ok) throw new Error(data?.error || 'Could not open checkout.')
      if (data?.url) window.location.href = data.url
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Could not open checkout.')
    } finally {
      setLoading(null)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
      if (!res.ok) throw new Error(data?.error || 'Could not open billing portal.')
      if (data?.url) window.location.href = data.url
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : 'Could not open billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-zinc-500">Billing</p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">Choose your ReplyIQ plan.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">Manage subscriptions, open the Stripe portal, and upgrade as your review volume grows.</p>
          </div>
          {currentPlan !== 'free' ? (
            <button onClick={handlePortal} disabled={portalLoading} className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-extrabold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60">
              <CreditCard className="h-4 w-4" />
              {portalLoading ? 'Opening...' : 'Manage billing'}
            </button>
          ) : null}
        </div>
      </section>

      {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Checkout complete. Your plan will update as soon as Stripe sends the webhook.</div> : null}
      {canceled ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">Checkout canceled. No charge was made.</div> : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {Object.entries(PLANS).map(([key, plan]) => {
          const isCurrent = currentPlan === key
          const isPopular = key === 'pro'
          return (
            <div key={key} className={`relative rounded-[2rem] border p-7 shadow-sm transition hover:-translate-y-1 ${isPopular ? 'border-zinc-950 bg-zinc-950 text-white shadow-xl shadow-zinc-950/15' : 'border-zinc-200 bg-white text-zinc-950'}`}>
              {isPopular ? <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-zinc-950">Most popular</span> : null}
              <h3 className="text-2xl font-extrabold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">${plan.price}</span>
                <span className={isPopular ? 'text-zinc-400' : 'text-zinc-500'}>/mo</span>
              </div>
              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6">
                    <Check className="mt-0.5 h-4 w-4 flex-none" />
                    <span className={isPopular ? 'text-zinc-200' : 'text-zinc-600'}>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !isCurrent && handleUpgrade(key)}
                disabled={isCurrent || loading === key}
                className={`mt-8 w-full rounded-full px-5 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${isCurrent ? 'bg-zinc-100 text-zinc-500' : isPopular ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white'}`}
              >
                {isCurrent ? 'Current plan' : loading === key ? 'Opening checkout...' : `Get ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  )
}
