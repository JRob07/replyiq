'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { PLANS, type PlanKey } from '@/lib/plans'

type ProfileLike = {
  plan?: string | null
  responses_used?: number | null
}

type UpgradeBannerProps = {
  plan?: string | null
  currentPlan?: string | null
  responsesUsed?: number | null
  limit?: number | null
  profile?: ProfileLike | null
}

const planOrder: PlanKey[] = ['starter', 'pro', 'agency']

export default function UpgradeBanner({ plan, currentPlan, responsesUsed, limit, profile }: UpgradeBannerProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activePlan = useMemo(() => profile?.plan || currentPlan || plan || 'free', [profile?.plan, currentPlan, plan])
  const usage = useMemo(() => profile?.responses_used ?? responsesUsed ?? 0, [profile?.responses_used, responsesUsed])
  const normalizedLimit = typeof limit === 'number' ? limit : null

  const handleUpgrade = async (selectedPlan: PlanKey) => {
    setErrorMessage(null)
    setLoadingPlan(selectedPlan)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null
      if (!response.ok) throw new Error(data?.error || 'Checkout failed. Please try again in a moment.')
      if (!data?.url) throw new Error('Checkout did not return a Stripe URL.')
      window.location.href = data.url
    } catch (error) {
      console.error('[UpgradeBanner] Upgrade failed:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Checkout failed. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const shouldShowUsage = activePlan === 'free' || activePlan === 'starter' || normalizedLimit !== null

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-zinc-500">Upgrade ReplyIQ</p>
          <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            More reviews, fewer limits.
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600">
            Starter covers small operators, Pro removes usage friction, and Agency is built for client work.
          </p>

          {shouldShowUsage ? (
            <p className="mt-4 text-sm font-semibold text-zinc-500">
              Current usage: <span className="text-zinc-950">{usage}</span>
              {normalizedLimit && normalizedLimit > 0 ? (
                <> of <span className="text-zinc-950">{normalizedLimit}</span> responses this month.</>
              ) : (
                ' responses this month.'
              )}
            </p>
          ) : null}

          {errorMessage ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errorMessage}</div> : null}
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-2xl">
          {planOrder.map((planKey) => {
            const planConfig = PLANS[planKey]
            const isCurrentPlan = activePlan === planKey
            const isLoading = loadingPlan === planKey

            return (
              <button
                key={planKey}
                type="button"
                disabled={isCurrentPlan || loadingPlan !== null}
                onClick={() => handleUpgrade(planKey)}
                className={`group rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
                  planKey === 'pro' ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-950 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">{planConfig.name}</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">
                      ${planConfig.price}<span className={planKey === 'pro' ? 'text-sm font-semibold text-zinc-400' : 'text-sm font-semibold text-zinc-500'}>/mo</span>
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-50" />
                </div>
                <p className={planKey === 'pro' ? 'mt-3 text-xs leading-5 text-zinc-300' : 'mt-3 text-xs leading-5 text-zinc-500'}>
                  {planConfig.limit === -1 ? 'Unlimited AI responses' : `${planConfig.limit} AI responses per month`}
                </p>
                <div className="mt-4 text-sm font-extrabold">
                  {isCurrentPlan ? 'Active plan' : isLoading ? 'Opening checkout...' : `Get ${planConfig.name}`}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
