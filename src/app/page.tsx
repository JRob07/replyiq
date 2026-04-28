import Link from 'next/link'
import { ArrowRight, Check, Sparkles, Star, Workflow } from 'lucide-react'
import { PLANS } from '@/lib/plans'

const steps = [
  {
    title: 'Paste or import reviews',
    description:
      'Start manually today, then connect Google Business Profile when you are ready for automated imports.',
  },
  {
    title: 'Choose the right tone',
    description:
      'Professional, Friendly, and Apologetic response styles help match the moment.',
  },
  {
    title: 'Copy, post, and stay consistent',
    description:
      'Generate polished responses in seconds and keep your business reputation active.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf7] text-zinc-950">
      <nav className="sticky top-0 z-50 border-b border-zinc-200/70 bg-[#fbfaf7]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            Reply<span className="text-zinc-500">IQ</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#how" className="text-sm font-semibold text-zinc-600 hover:text-zinc-950">
              How it works
            </a>
            <a href="#pricing" className="text-sm font-semibold text-zinc-600 hover:text-zinc-950">
              Pricing
            </a>
            <Link href="/login" className="text-sm font-semibold text-zinc-600 hover:text-zinc-950">
              Sign in
            </Link>
          </div>

          <Link
            href="/signup"
            className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800"
          >
            Start free
          </Link>
        </div>
      </nav>

      <section className="noise-bg relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/75 px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            AI review responses for local businesses
          </div>

          <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-zinc-950 sm:text-7xl lg:text-8xl">
            Turn every review into a polished reply.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
            ReplyIQ helps HVAC companies, dentists, salons, restaurants, and local service businesses respond to Google and Yelp reviews in seconds.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-7 py-4 text-sm font-extrabold text-white shadow-xl shadow-zinc-950/10 transition hover:-translate-y-0.5 hover:bg-zinc-800"
            >
              Start free — no card required
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-7 py-4 text-sm font-extrabold text-zinc-950 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300"
            >
              View pricing
            </a>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-4 rounded-[2rem] border border-zinc-200 bg-white/75 p-4 text-left shadow-2xl shadow-zinc-950/5 backdrop-blur md:grid-cols-3">
            {[
              ['3 tones', 'Professional, Friendly, and Apologetic'],
              ['Manual + API-ready', 'Built for Google Business Profile automation'],
              ['Agency-ready', 'Designed for client account expansion'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-3xl bg-zinc-50 p-5">
                <p className="text-sm font-extrabold text-zinc-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-zinc-500">Workflow</p>
            <h2 className="font-display mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Built for busy owners.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-zinc-600">
            The MVP starts with manual review entry. The next automation layer connects Google Business Profile so reviews can flow into the dashboard.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="premium-card rounded-[2rem] p-7 transition hover:-translate-y-1">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-extrabold text-white">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="text-xl font-extrabold text-zinc-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-zinc-950 px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-zinc-200">
              <Workflow className="h-4 w-4" />
              Reputation operations
            </div>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              The simple system behind a stronger online reputation.
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-400">
              ReplyIQ gives owners and agencies a repeatable process for review responses today, with Google Business Profile integration staged into the codebase for the next production phase.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <div className="rounded-3xl bg-white p-6 text-zinc-950">
              <div className="mb-4 flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm leading-7 text-zinc-700">
                “The technician was on time, professional, and explained everything clearly. Great service.”
              </p>
              <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-zinc-500">ReplyIQ response</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Thank you for the kind words. We are glad our technician was able to arrive on time and explain everything clearly. We appreciate your business and look forward to helping again whenever you need us.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-zinc-500">Pricing</p>
          <h2 className="font-display mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            Start lean. Upgrade when review volume grows.
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div
              key={key}
              className={`rounded-[2rem] border p-7 shadow-sm transition hover:-translate-y-1 ${
                key === 'pro'
                  ? 'border-zinc-950 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/15'
                  : 'border-zinc-200 bg-white text-zinc-950'
              }`}
            >
              {key === 'pro' ? (
                <div className="mb-5 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold text-zinc-950">
                  Most popular
                </div>
              ) : null}
              <h3 className="text-2xl font-extrabold">{plan.name}</h3>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-5xl font-extrabold tracking-tight">${plan.price}</span>
                <span className={key === 'pro' ? 'pb-2 text-zinc-400' : 'pb-2 text-zinc-500'}>/mo</span>
              </div>
              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6">
                    <Check className="mt-1 h-4 w-4 flex-none" />
                    <span className={key === 'pro' ? 'text-zinc-200' : 'text-zinc-600'}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/signup?plan=${key}`}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold transition hover:-translate-y-0.5 ${
                  key === 'pro' ? 'bg-white text-zinc-950' : 'bg-zinc-950 text-white'
                }`}
              >
                Get {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-200 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ReplyIQ. Robinson Family Legacy LLC.</p>
          <p>Built for local service businesses and agencies.</p>
        </div>
      </footer>
    </main>
  )
}
