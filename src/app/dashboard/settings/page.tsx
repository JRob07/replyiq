'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  business_name: string | null
  plan: string | null
  plan_status: string | null
}

type SaveState = 'idle' | 'saving' | 'success' | 'error'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileSaveState, setProfileSaveState] = useState<SaveState>('idle')
  const [emailSaveState, setEmailSaveState] = useState<SaveState>('idle')
  const [passwordSaveState, setPasswordSaveState] = useState<SaveState>('idle')
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setPageError(null)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setPageError('Could not load your account. Please refresh and try again.')
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, business_name, plan, plan_status')
      .eq('id', user.id)
      .single()

    if (error) {
      setPageError('Could not load your profile. Please refresh and try again.')
      return
    }

    const typedProfile = data as Profile
    setProfile(typedProfile)
    setFullName(typedProfile.full_name || '')
    setBusinessName(typedProfile.business_name || '')
    setEmail(user.email || typedProfile.email || '')
  }, [router, supabase])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile) return
    setProfileSaveState('saving')
    setProfileMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, business_name: businessName.trim() || null })
      .eq('id', profile.id)

    if (error) {
      setProfileSaveState('error')
      setProfileMessage('Could not update your profile. Please try again.')
      return
    }

    setProfileSaveState('success')
    setProfileMessage('Profile updated successfully.')
    await loadProfile()
  }

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEmailSaveState('error')
      setEmailMessage('Please enter a valid email address.')
      return
    }

    setEmailSaveState('saving')
    setEmailMessage(null)

    const { error } = await supabase.auth.updateUser({ email: cleanEmail })
    if (error) {
      setEmailSaveState('error')
      setEmailMessage(error.message || 'Could not update your email.')
      return
    }

    if (profile) {
      await supabase.from('profiles').update({ email: cleanEmail }).eq('id', profile.id)
    }

    setEmailSaveState('success')
    setEmailMessage('Email update started. You may need to confirm it from your inbox.')
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      setPasswordSaveState('error')
      setPasswordMessage('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordSaveState('error')
      setPasswordMessage('Passwords do not match.')
      return
    }

    setPasswordSaveState('saving')
    setPasswordMessage(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordSaveState('error')
      setPasswordMessage(error.message || 'Could not update your password.')
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setPasswordSaveState('success')
    setPasswordMessage('Password updated successfully.')
  }

  const statusClass = profile?.plan_status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-zinc-500">Account</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">Settings</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">Manage your business profile, email, password, and billing access.</p>
      </section>

      {pageError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{pageError}</div> : null}

      <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold text-zinc-500">Current plan</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-3xl font-extrabold capitalize text-zinc-950">{profile?.plan || 'free'}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${statusClass}`}>{profile?.plan_status || 'inactive'}</span>
          </div>
          <button onClick={() => router.push('/dashboard/billing')} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800">Manage billing</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleProfileSubmit} className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-extrabold text-zinc-950">Business profile</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Used to personalize your ReplyIQ experience.</p>
          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">Full name</label>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">Business name</label>
              <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" />
            </div>
          </div>
          {profileMessage ? <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${profileSaveState === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{profileMessage}</div> : null}
          <button disabled={profileSaveState === 'saving'} className="mt-6 rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60">{profileSaveState === 'saving' ? 'Saving...' : 'Save profile'}</button>
        </form>

        <form onSubmit={handleEmailSubmit} className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-extrabold text-zinc-950">Email address</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Update the email used to log in.</p>
          <div className="mt-6">
            <label className="mb-2 block text-sm font-bold text-zinc-700">Email</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" />
          </div>
          {emailMessage ? <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${emailSaveState === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{emailMessage}</div> : null}
          <button disabled={emailSaveState === 'saving'} className="mt-6 rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60">{emailSaveState === 'saving' ? 'Updating...' : 'Update email'}</button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
          <h2 className="text-2xl font-extrabold text-zinc-950">Change password</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">Choose a secure password with at least 8 characters.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">New password</label>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">Confirm password</label>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100" />
            </div>
          </div>
          {passwordMessage ? <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${passwordSaveState === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{passwordMessage}</div> : null}
          <button disabled={passwordSaveState === 'saving'} className="mt-6 rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:opacity-60">{passwordSaveState === 'saving' ? 'Updating...' : 'Update password'}</button>
        </form>
      </div>
    </div>
  )
}
