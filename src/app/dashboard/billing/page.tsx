'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PLANS } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function BillingContent() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [loading, setLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const supabase = createClient()

  useEffect(() => {
    const fetchPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      if (data) setCurrentPlan(data.plan)
    }
    fetchPlan()
  }, [])

  const handleUpgrade = async (plan: string) => {
    setLoading(plan)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(null)
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-gray-400 mt-1">Manage your ReplyIQ subscription</p>
      </div>

      {success && (
        <div className="bg-green-950 border border-green-700 text-green-400 px-4 py-3 rounded-lg mb-6">
          ✓ You're now subscribed! Your plan is active.
        </div>
      )}
      {canceled && (
        <div className="bg-yellow-950 border border-yellow-700 text-yellow-400 px-4 py-3 rounded-lg mb-6">
          Checkout canceled — no charge was made.
        </div>
      )}

      {currentPlan !== 'free' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Current Plan</p>
              <p className="text-white font-bold text-xl capitalize">{currentPlan}</p>
            </div>
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {portalLoading ? 'Loading...' : 'Manage Billing'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => {
          const isCurrent = currentPlan === key
          const isPopular = key === 'pro'
          return (
            <div
              key={key}
              className={`bg-gray-900 border rounded-xl p-6 relative ${isPopular ? 'border-blue-500' : 'border-gray-800'}`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-white">${plan.price}</span>
                <span className="text-gray-400">/mo</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="text-gray-300 text-sm flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !isCurrent && handleUpgrade(key)}
                disabled={isCurrent || loading === key}
                className={`w-full font-semibold py-3 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-gray-700 text-gray-400 cursor-default'
                    : isPopular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {isCurrent ? 'Current Plan' : loading === key ? 'Loading...' : `Get ${plan.name}`}
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