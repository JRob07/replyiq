import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, LayoutDashboard, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Reviews', icon: LayoutDashboard },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-zinc-950">
      <nav className="sticky top-0 z-50 border-b border-zinc-200/70 bg-[#fbfaf7]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-extrabold tracking-tight text-zinc-950">
                Reply<span className="text-zinc-500">IQ</span>
              </Link>

              <div className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-zinc-600 transition hover:bg-white hover:text-zinc-950 hover:shadow-sm"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden max-w-[220px] truncate text-sm font-medium text-zinc-500 sm:block">
                {user.email}
              </span>

              <form action="/api/auth/signout" method="POST">
                <button className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:text-zinc-950">
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="flex items-center gap-1 border-t border-zinc-200/70 py-2 md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-zinc-600 transition hover:bg-white hover:text-zinc-950"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
