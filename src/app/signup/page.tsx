'use client'

import { Suspense, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const supabase = useMemo(() => createClient(), [])

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim(), business_name: businessName.trim() } },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Account created. Please check your email to confirm your account before logging in.')
      setLoading(false)
      return
    }

    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        business_name: businessName.trim(),
      },
      { onConflict: 'id' }
    )

    if (plan && ['starter', 'pro', 'agency'].includes(plan)) {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const checkoutData = (await response.json().catch(() => null)) as { url?: string; error?: string } | null
      if (checkoutData?.url) {
        window.location.href = checkoutData.url
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  const formattedPlan = plan ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)}` : null

  return (
    <main className="noise-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-extrabold tracking-tight text-zinc-950">
            Reply<span className="text-zinc-500">IQ</span>
          </Link>
          <p className="mt-3 text-sm font-semibold text-zinc-500">
            {formattedPlan ? `Create your ${formattedPlan} account.` : 'Start responding smarter.'}
          </p>
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-2xl shadow-zinc-950/5">
          {error ? <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">Full name</label>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" placeholder="Jeremy Robinson" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">Business name</label>
              <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" placeholder="Apex Automations" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">Email</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" placeholder="you@business.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">Password</label>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleSignup()} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" placeholder="••••••••" />
            </div>
            <button onClick={handleSignup} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60">
              {loading ? 'Creating account...' : formattedPlan ? 'Create account & continue' : 'Create account'}
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </div>
          <p className="mt-6 text-center text-sm font-semibold text-zinc-500">
            Already have an account? <Link href="/login" className="text-zinc-950 underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
