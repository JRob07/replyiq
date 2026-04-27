import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-950">
      <nav className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="text-xl font-bold tracking-tight text-white"
              >
                Reply<span className="text-blue-400">IQ</span>
              </Link>

              <div className="hidden items-center gap-1 sm:flex">
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-gray-800 hover:text-white"
                >
                  Reviews
                </Link>

                <Link
                  href="/dashboard/billing"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-gray-800 hover:text-white"
                >
                  Billing
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-gray-800 hover:text-white"
                >
                  Settings
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-gray-500 sm:block">
                {user.email}
              </span>

              <form action="/api/auth/signout" method="POST">
                <button className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-all hover:bg-gray-800 hover:text-white">
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="flex items-center gap-1 border-t border-gray-800/60 py-2 sm:hidden">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-gray-800 hover:text-white"
            >
              Reviews
            </Link>

            <Link
              href="/dashboard/billing"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-gray-800 hover:text-white"
            >
              Billing
            </Link>

            <Link
              href="/dashboard/settings"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-gray-800 hover:text-white"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}