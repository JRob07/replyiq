'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="noise-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-extrabold tracking-tight text-zinc-950">
            Reply<span className="text-zinc-500">IQ</span>
          </Link>
          <p className="mt-3 text-sm font-semibold text-zinc-500">Sign in to your review command center.</p>
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-2xl shadow-zinc-950/5">
          {error ? <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                placeholder="you@business.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </div>

          <p className="mt-6 text-center text-sm font-semibold text-zinc-500">
            No account? <Link href="/signup" className="text-zinc-950 underline underline-offset-4">Start free</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
