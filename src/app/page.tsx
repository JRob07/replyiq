import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="text-white font-bold text-xl">ReplyIQ</span>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Sign In</Link>
              <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-950 border border-blue-800 text-blue-400 text-sm px-4 py-1.5 rounded-full mb-8">
          ✨ AI-powered review responses in seconds
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
          Stop Ignoring Your<br />
          <span className="text-blue-400">Google Reviews</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          ReplyIQ generates professional, personalized responses to your Google and Yelp reviews in seconds. Save hours every week and never leave a review unanswered.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">
            Start Free — No Card Required
          </Link>
          <Link href="#pricing" className="text-gray-400 hover:text-white font-semibold px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-lg transition-colors">
            See Pricing
          </Link>
        </div>
        <p className="text-gray-600 text-sm mt-4">3 free responses included • No credit card required</p>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">How It Works</h2>
        <p className="text-gray-400 text-center mb-12">Three steps to never leaving a review unanswered</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Paste Your Review', desc: 'Copy any Google or Yelp review and paste it into ReplyIQ. Takes 10 seconds.' },
            { step: '02', title: 'Pick Your Tone', desc: 'Choose Professional, Friendly, or Apologetic depending on the review.' },
            { step: '03', title: 'Copy & Post', desc: 'AI generates a personalized response in seconds. Copy it and post directly to Google or Yelp.' },
          ].map(item => (
            <div key={item.step} className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-blue-400 font-bold text-4xl mb-4">{item.step}</div>
              <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Why Local Businesses Love ReplyIQ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: "I used to spend 30 minutes a day responding to reviews. Now it takes 2 minutes. ReplyIQ pays for itself every week.", name: "Mike T.", business: "HVAC contractor, Cincinnati" },
            { quote: "My response rate went from 20% to 100% in the first month. My Google ranking actually improved.", name: "Sarah K.", business: "Med Spa owner, Dallas" },
            { quote: "As an agency we manage reviews for 12 clients. ReplyIQ's agency plan saves us hours every single week.", name: "James R.", business: "Marketing Agency, Phoenix" },
          ].map((t, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-yellow-400 text-lg mb-3">★★★★★</div>
              <p className="text-gray-300 mb-4 italic">"{t.quote}"</p>
              <p className="text-white font-semibold text-sm">{t.name}</p>
              <p className="text-gray-500 text-sm">{t.business}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Simple Pricing</h2>
        <p className="text-gray-400 text-center mb-12">Start free. Upgrade when you're ready.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Starter', price: '$19', period: '/mo',
              features: ['25 AI responses/month', 'Google & Yelp reviews', '3 response tones', 'Copy to clipboard'],
              cta: 'Get Started', popular: false
            },
            {
              name: 'Pro', price: '$49', period: '/mo',
              features: ['Unlimited AI responses', 'Google & Yelp reviews', '3 response tones', 'Priority support', 'Multi-location ready'],
              cta: 'Get Pro', popular: true
            },
            {
              name: 'Agency', price: '$149', period: '/mo',
              features: ['Unlimited AI responses', 'Up to 20 client accounts', 'White-label branding', 'Custom subdomain', 'Priority support'],
              cta: 'Get Agency', popular: false
            },
          ].map(plan => (
            <div key={plan.name} className={`rounded-xl p-8 relative border ${plan.popular ? 'bg-blue-950 border-blue-500' : 'bg-gray-900 border-gray-800'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-white font-bold text-xl mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="text-gray-300 text-sm flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full text-center font-bold py-3 rounded-lg transition-colors ${plan.popular ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 text-sm mt-6">All plans include a 14-day free trial. Cancel anytime.</p>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to respond smarter?</h2>
          <p className="text-gray-400 text-lg mb-8">Join local businesses saving hours every week with AI-powered review responses.</p>
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors inline-block">
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="text-white font-bold">ReplyIQ</span>
          <p className="text-gray-600 text-sm">© 2026 Robinson Family Legacy LLC. All rights reserved.</p>
          <div className="flex gap-4 text-gray-500 text-sm">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}