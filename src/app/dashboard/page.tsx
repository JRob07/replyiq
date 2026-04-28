'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Clock3, Copy, Plus, RefreshCw, Star } from 'lucide-react'
import AddReviewModal from '@/components/AddReviewModal'
import UpgradeBanner from '@/components/upgradebanner'
import { PLANS } from '@/lib/plans'
import ReviewActions from '@/components/ReviewActions'

interface Review {
  id: string
  reviewer_name: string
  rating: number
  review_text: string
  platform: string
  review_date: string
  ai_response: string | null
  response_status: string
}

interface Profile {
  full_name?: string | null
  business_name?: string | null
  plan?: string | null
  responses_used?: number | null
}

export default function DashboardPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [showModal, setShowModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncingGoogle, setSyncingGoogle] = useState(false)
  const [googleMessage, setGoogleMessage] = useState<string | null>(null)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const fetchData = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('[dashboard] Failed to get user:', userError)
      setError('Could not load your account. Please refresh and try again.')
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    const [{ data: profileData, error: profileError }, { data: reviewData, error: reviewError }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('reviews')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])

    if (profileError) console.error('[dashboard] Failed to load profile:', profileError)

    if (reviewError) {
      console.error('[dashboard] Failed to load reviews:', reviewError)
      setError('Could not load your reviews. Please refresh and try again.')
      return
    }

    if (profileData) setProfile(profileData)
    if (reviewData) setReviews(reviewData as Review[])
  }, [router, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (copyError) {
      console.error('[dashboard] Failed to copy response:', copyError)
      setError('Could not copy the response. Please try again.')
    }
  }

  const syncGoogleReviews = async () => {
    setSyncingGoogle(true)
    setGoogleMessage(null)
    try {
      const response = await fetch('/api/integrations/google/sync', { method: 'POST' })
      const data = (await response.json().catch(() => null)) as { error?: string; imported?: number } | null
      if (!response.ok) throw new Error(data?.error || 'Could not sync Google reviews yet.')
      setGoogleMessage(`Synced ${data?.imported || 0} new Google review${data?.imported === 1 ? '' : 's'}.`)
      await fetchData()
    } catch (syncError) {
      setGoogleMessage(syncError instanceof Error ? syncError.message : 'Could not sync Google reviews yet.')
    } finally {
      setSyncingGoogle(false)
    }
  }

  const total = reviews.length
  const responded = reviews.filter((review) => review.response_status === 'generated').length
  const pending = total - responded
  const avgRating = total ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total : 0

  const plan = profile?.plan || 'free'
  const planConfig = PLANS[plan as keyof typeof PLANS]
  const responsesUsed = profile?.responses_used || 0
  const responseLimit = plan === 'free' ? 3 : planConfig?.limit ?? 3
  const isUnlimited = responseLimit === -1
  const usagePercent = isUnlimited ? 0 : Math.min((responsesUsed / responseLimit) * 100, 100)

  const starColor = (rating: number) => {
    if (rating >= 4) return 'text-amber-500'
    if (rating === 3) return 'text-orange-500'
    return 'text-rose-500'
  }

  const statCards = [
    { label: 'Total reviews', value: total, icon: Star, detail: avgRating ? `${avgRating.toFixed(1)} avg rating` : 'No ratings yet' },
    { label: 'Responded', value: responded, icon: CheckCircle2, detail: total ? `${Math.round((responded / total) * 100)}% complete` : 'Start with one review' },
    { label: 'Pending', value: pending, icon: Clock3, detail: pending === 1 ? '1 review needs attention' : `${pending} reviews need attention` },
  ]

  return (
    <div className="space-y-8">
      {showModal && <AddReviewModal onClose={() => setShowModal(false)} onAdded={fetchData} />}

      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-zinc-500">Review command center</p>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              Manage customer reviews, generate premium replies, and keep your reputation engine moving.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-zinc-950/10 transition hover:-translate-y-0.5 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Add review
          </button>
        </div>
      </section>

      <UpgradeBanner plan={plan} responsesUsed={responsesUsed} limit={responseLimit} />

      <section className="rounded-[2rem] border border-zinc-200 bg-zinc-950 p-6 text-white shadow-xl shadow-zinc-950/10 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-zinc-400">Google automation</p>
            <h2 className="mt-2 text-2xl font-extrabold">Connect Google Business Profile</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
              OAuth and sync endpoints are included. After applying the included Supabase migration and adding Google OAuth env vars, use this to import verified location reviews.
            </p>
            {googleMessage ? <p className="mt-3 text-sm font-semibold text-zinc-200">{googleMessage}</p> : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/api/integrations/google/connect"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-zinc-950 transition hover:-translate-y-0.5"
            >
              Connect Google
              <ArrowRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={syncGoogleReviews}
              disabled={syncingGoogle}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncingGoogle ? 'animate-spin' : ''}`} />
              {syncingGoogle ? 'Syncing...' : 'Sync reviews'}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-rose-600 hover:text-rose-800">✕</button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-zinc-500">{stat.label}</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-zinc-950">{stat.value}</p>
              <p className="mt-2 text-sm text-zinc-500">{stat.detail}</p>
            </div>
          )
        })}

        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-zinc-500">Responses used</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-4xl font-extrabold tracking-tight text-zinc-950">
              {isUnlimited ? '∞' : responsesUsed}
              {!isUnlimited ? <span className="text-lg text-zinc-400">/{responseLimit}</span> : null}
            </p>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-extrabold capitalize text-zinc-700">{plan}</span>
          </div>
          {!isUnlimited ? (
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-zinc-950 transition-all" style={{ width: `${usagePercent}%` }} />
            </div>
          ) : null}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">⭐</div>
          <h2 className="text-xl font-extrabold text-zinc-950">No reviews yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Add a review manually or connect Google Business Profile once your OAuth keys and migration are ready.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 rounded-full bg-zinc-950 px-6 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800"
          >
            Add your first review
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-extrabold text-zinc-950">{review.reviewer_name || 'Customer'}</span>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-extrabold capitalize text-zinc-600">{review.platform}</span>
                    {review.response_status === 'generated' ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">Responded</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">Pending</span>
                    )}
                  </div>
                  <div className={`mt-2 text-lg ${starColor(review.rating)}`}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-400">{review.review_date}</span>
              </div>

              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{review.review_text}</p>

              {review.ai_response ? (
                <div className="mt-5 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-zinc-500">AI response</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{review.ai_response}</p>
                  <button
                    onClick={() => copyToClipboard(review.ai_response!, review.id)}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-zinc-800 shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedId === review.id ? 'Copied' : 'Copy response'}
                  </button>
                </div>
              ) : null}

              <ReviewActions reviewId={review.id} hasResponse={Boolean(review.ai_response)} onChanged={fetchData} />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
