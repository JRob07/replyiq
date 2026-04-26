import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{
      background: '#060910',
      fontFamily: "'Georgia', serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { background: #060910; }

        .font-display { font-family: 'DM Serif Display', Georgia, serif; }
        .font-sans { font-family: 'DM Sans', system-ui, sans-serif; }

        .hero-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
          pointer-events: none;
        }

        .card-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(10px);
        }

        .card-glass:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 10px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s ease;
          box-shadow: 0 0 30px rgba(59,130,246,0.3);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 40px rgba(59,130,246,0.5);
        }

        .btn-secondary {
          background: transparent;
          color: rgba(255,255,255,0.6);
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          padding: 14px 28px;
          border-radius: 10px;
          text-decoration: none;
          display: inline-block;
          border: 1px solid rgba(255,255,255,0.12);
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          color: white;
          border-color: rgba(255,255,255,0.3);
        }

        .nav-link {
          color: rgba(255,255,255,0.5);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          text-decoration: none;
          transition: color 0.2s;
        }

        .nav-link:hover { color: white; }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(59,130,246,0.1);
          border: 1px solid rgba(59,130,246,0.2);
          color: #60a5fa;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          padding: 6px 14px;
          border-radius: 100px;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }

        .popular-badge {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 4px 12px;
          border-radius: 100px;
        }

        .star { color: #f59e0b; }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        @media (max-width: 768px) {
          .grid-3 { grid-template-columns: 1fr; }
          .hero-title { font-size: 2.5rem !important; }
          .hide-mobile { display: none; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(6,9,16,0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <span className="font-display" style={{ color: 'white', fontSize: 22, letterSpacing: '-0.02em' }}>
            Reply<span style={{ color: '#60a5fa' }}>IQ</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#pricing" className="nav-link hide-mobile">Pricing</a>
            <Link href="/login" className="nav-link">Sign In</Link>
            <Link href="/signup" className="btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>Start Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 24px 80px' }}>
        <div className="hero-glow" style={{ background: '#3b82f6', top: -100, left: '20%' }} />
        <div className="hero-glow" style={{ background: '#8b5cf6', top: 100, right: '10%' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div className="tag" style={{ marginBottom: 28 }}>
            ✦ AI-powered review responses
          </div>

          <h1 className="font-display hero-title" style={{
            fontSize: '4rem',
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 24
          }}>
            Stop ignoring your<br />
            <span style={{ color: '#60a5fa', fontStyle: 'italic' }}>Google Reviews</span>
          </h1>

          <p className="font-sans" style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.7,
            marginBottom: 40,
            maxWidth: 560,
            margin: '0 auto 40px'
          }}>
            ReplyIQ writes professional, personalized responses to your reviews in seconds — so you never leave a customer unanswered again.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn-primary" style={{ fontSize: 16 }}>
              Start Free — No Card Required
            </Link>
            <a href="#pricing" className="btn-secondary" style={{ fontSize: 16 }}>
              See Pricing
            </a>
          </div>

          <p className="font-sans" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 16 }}>
            3 free responses included · No credit card required
          </p>
        </div>
      </section>

      <div className="divider" style={{ margin: '0 24px' }} />

      {/* How it works */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 className="font-display" style={{ fontSize: '2.5rem', color: 'white', letterSpacing: '-0.02em', marginBottom: 12 }}>
            How it works
          </h2>
          <p className="font-sans" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>
            Three steps to a perfect response, every time
          </p>
        </div>

        <div className="grid-3">
          {[
            { step: '01', title: 'Paste your review', desc: 'Copy any Google or Yelp review and paste it into ReplyIQ. Takes 10 seconds.' },
            { step: '02', title: 'Pick your tone', desc: 'Choose Professional, Friendly, or Apologetic — the AI adapts its language accordingly.' },
            { step: '03', title: 'Copy & post', desc: 'Your personalized response is ready in seconds. Copy and paste directly to Google or Yelp.' },
          ].map(item => (
            <div key={item.step} className="card-glass" style={{ padding: 32, borderRadius: 16 }}>
              <div className="font-display" style={{ fontSize: 48, color: 'rgba(96,165,250,0.3)', marginBottom: 16, lineHeight: 1 }}>
                {item.step}
              </div>
              <h3 className="font-display" style={{ fontSize: 20, color: 'white', marginBottom: 10, letterSpacing: '-0.01em' }}>
                {item.title}
              </h3>
              <p className="font-sans" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontSize: 15 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" style={{ margin: '0 24px' }} />

      {/* Testimonials */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 className="font-display" style={{ fontSize: '2.5rem', color: 'white', letterSpacing: '-0.02em', marginBottom: 12 }}>
            Local businesses love ReplyIQ
          </h2>
        </div>

        <div className="grid-3">
          {[
            { quote: "I used to spend 30 minutes a day on reviews. Now it takes 2 minutes. ReplyIQ pays for itself every single week.", name: "Mike T.", business: "HVAC Contractor, Cincinnati" },
            { quote: "My response rate went from 20% to 100% in the first month. My Google ranking actually improved.", name: "Sarah K.", business: "Med Spa Owner, Dallas" },
            { quote: "We manage reviews for 12 clients. The agency plan saves us hours every week — it's a no-brainer.", name: "James R.", business: "Marketing Agency, Phoenix" },
          ].map((t, i) => (
            <div key={i} className="card-glass" style={{ padding: 28, borderRadius: 16 }}>
              <div className="star" style={{ fontSize: 14, marginBottom: 14, letterSpacing: 2 }}>★★★★★</div>
              <p className="font-sans" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontSize: 15, marginBottom: 20, fontStyle: 'italic' }}>
                "{t.quote}"
              </p>
              <p className="font-sans" style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{t.name}</p>
              <p className="font-sans" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{t.business}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" style={{ margin: '0 24px' }} />

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 className="font-display" style={{ fontSize: '2.5rem', color: 'white', letterSpacing: '-0.02em', marginBottom: 12 }}>
            Simple pricing
          </h2>
          <p className="font-sans" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div className="grid-3">
          {[
            {
              name: 'Starter', price: '$19', period: '/mo',
              features: ['25 AI responses/month', 'Google & Yelp reviews', '3 response tones', 'Copy to clipboard'],
              cta: 'Get Started', popular: false,
              style: { padding: 32, borderRadius: 16 }
            },
            {
              name: 'Pro', price: '$49', period: '/mo',
              features: ['Unlimited AI responses', 'Google & Yelp reviews', '3 response tones', 'Priority support', 'Multi-location ready'],
              cta: 'Get Pro', popular: true,
              style: { padding: 32, borderRadius: 16, background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.3)' }
            },
            {
              name: 'Agency', price: '$149', period: '/mo',
              features: ['Unlimited AI responses', 'Up to 20 client accounts', 'White-label branding', 'Custom subdomain', 'Priority support'],
              cta: 'Get Agency', popular: false,
              style: { padding: 32, borderRadius: 16 }
            },
          ].map(plan => (
            <div key={plan.name} className="card-glass" style={plan.style}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 className="font-sans" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontSize: 14, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {plan.name}
                </h3>
                {plan.popular && <span className="popular-badge">Most Popular</span>}
              </div>
              <div style={{ marginBottom: 28 }}>
                <span className="font-display" style={{ fontSize: 48, color: 'white', letterSpacing: '-0.03em' }}>{plan.price}</span>
                <span className="font-sans" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} className="font-sans" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#34d399', fontSize: 12 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={plan.popular ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="font-sans" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 24 }}>
          All plans include a 14-day free trial · Cancel anytime
        </p>
      </section>

      <div className="divider" style={{ margin: '0 24px' }} />

      {/* CTA */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="card-glass" style={{ padding: '64px 48px', borderRadius: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="hero-glow" style={{ background: '#3b82f6', width: 400, height: 400, top: -200, left: '30%', opacity: 0.08 }} />
          <h2 className="font-display" style={{ fontSize: '3rem', color: 'white', letterSpacing: '-0.02em', marginBottom: 16 }}>
            Ready to respond smarter?
          </h2>
          <p className="font-sans" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 17, marginBottom: 36 }}>
            Join local businesses saving hours every week with AI-powered review responses.
          </p>
          <Link href="/signup" className="btn-primary" style={{ fontSize: 16 }}>
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span className="font-display" style={{ color: 'white', fontSize: 18 }}>
            Reply<span style={{ color: '#60a5fa' }}>IQ</span>
          </span>
          <p className="font-sans" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            © 2026 Robinson Family Legacy LLC. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/login" className="nav-link">Sign In</Link>
            <Link href="/signup" className="nav-link">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}