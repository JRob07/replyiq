import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800/60 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-white font-bold text-xl tracking-tight">
                Reply<span className="text-blue-400">IQ</span>
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <Link href="/dashboard" className="text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">
                  Reviews
                </Link>
                <Link href="/dashboard/billing" className="text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-all">
                  Billing
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm hidden sm:block">{user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button className="text-gray-500 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}