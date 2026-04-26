'use client'
import { useRouter } from 'next/navigation'
import { PLANS } from '@/lib/plans'

interface Props {
  plan: string
  responsesUsed: number
}

export default function UpgradeBanner({ plan, responsesUsed }: Props) {
  const router = useRouter()

  const handleUpgrade = async (targetPlan: string) => {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: targetPlan })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  if (plan === 'agency') return null

  if (plan === 'free') {
    return (
      <div className="bg-gradient-to-r from-blue-950 to-blue-900 border border-blue-700 rounded-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-white font-semibold">You're on the free plan</p>
          <p className="text-blue-300 text-sm mt-0.5">3 free responses included. Upgrade to unlock more.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleUpgrade('starter')}
            className="bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors"
          >
            Get Starter — $19/mo
          </button>
          <button
            onClick={() => handleUpgrade('pro')}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors"
          >
            Get Pro — $49/mo
          </button>
        </div>
      </div>
    )
  }

  if (plan === 'starter') {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-white font-semibold">You're on Starter</p>
          <p className="text-gray-400 text-sm mt-0.5">Upgrade to Pro for unlimited responses.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleUpgrade('pro')}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors"
          >
            Upgrade to Pro — $49/mo
          </button>
          <button
            onClick={() => handleUpgrade('agency')}
            className="bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
          >
            Get Agency — $149/mo
          </button>
        </div>
      </div>
    )
  }

  if (plan === 'pro') {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-white font-semibold">You're on Pro</p>
          <p className="text-gray-400 text-sm mt-0.5">Upgrade to Agency to manage up to 20 client accounts.</p>
        </div>
        <button
          onClick={() => handleUpgrade('agency')}
          className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-500 transition-colors"
        >
          Upgrade to Agency — $149/mo
        </button>
      </div>
    )
  }

  return null
}