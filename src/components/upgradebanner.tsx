'use client'

import { useMemo, useState } from 'react'
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

export default function UpgradeBanner({
  plan,
  currentPlan,
  responsesUsed,
  limit,
  profile,
}: UpgradeBannerProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activePlan = useMemo(() => {
    return profile?.plan || currentPlan || plan || 'free'
  }, [profile?.plan, currentPlan, plan])

  const usage = useMemo(() => {
    return profile?.responses_used ?? responsesUsed ?? 0
  }, [profile?.responses_used, responsesUsed])

  const normalizedLimit = typeof limit === 'number' ? limit : null

  const handleUpgrade = async (selectedPlan: PlanKey) => {
    setErrorMessage(null)
    setLoadingPlan(selectedPlan)

    console.log('[UpgradeBanner] Starting upgrade:', {
      selectedPlan,
    })

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      const data = (await response.json().catch(() => null)) as {
        url?: string
        error?: string
      } | null

      console.log('[UpgradeBanner] Checkout API response:', {
        status: response.status,
        ok: response.ok,
        data,
      })

      if (!response.ok) {
        throw new Error(
          data?.error || 'Checkout failed. Please try again in a moment.'
        )
      }

      if (!data?.url) {
        throw new Error('Checkout did not return a Stripe URL.')
      }

      window.location.href = data.url
    } catch (error) {
      console.error('[UpgradeBanner] Upgrade failed:', error)

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Checkout failed. Please try again.'
      )
    } finally {
      setLoadingPlan(null)
    }
  }

  const shouldShowUsage =
    activePlan === 'free' || activePlan === 'starter' || normalizedLimit !== null

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Upgrade ReplyIQ
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            Generate better review replies without hitting limits.
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Choose the plan that fits your business. Starter is perfect for solo
            operators, Pro removes usage limits, and Agency supports white-label
            client work.
          </p>

          {shouldShowUsage ? (
            <p className="mt-4 text-sm text-zinc-500">
              Current usage:{' '}
              <span className="font-medium text-zinc-900">{usage}</span>
              {normalizedLimit && normalizedLimit > 0 ? (
                <>
                  {' '}
                  of{' '}
                  <span className="font-medium text-zinc-900">
                    {normalizedLimit}
                  </span>{' '}
                  responses used this month.
                </>
              ) : (
                ' responses used this month.'
              )}
            </p>
          ) : null}

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl">
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
                className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">
                      {planConfig.name}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                      ${planConfig.price}
                      <span className="text-sm font-normal text-zinc-500">
                        /mo
                      </span>
                    </p>
                  </div>

                  {isCurrentPlan ? (
                    <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
                      Current
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-xs leading-5 text-zinc-500">
                  {planConfig.limit === -1
                    ? 'Unlimited AI responses'
                    : `${planConfig.limit} AI responses per month`}
                </p>

                <div className="mt-4 text-sm font-medium text-zinc-950">
                  {isCurrentPlan
                    ? 'Active plan'
                    : isLoading
                      ? 'Opening checkout...'
                      : `Get ${planConfig.name}`}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}