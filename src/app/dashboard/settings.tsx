'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
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
  const supabase = createClient()

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
      console.error('[settings] Failed to load user:', userError)
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
      .single<Profile>()

    if (error) {
      console.error('[settings] Failed to load profile:', error)
      setPageError('Could not load your profile. Please refresh and try again.')
      return
    }

    setProfile(data)
    setFullName(data.full_name || '')
    setBusinessName(data.business_name || '')
    setEmail(user.email || data.email || '')
  }, [router, supabase])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!profile) {
      setProfileMessage('Profile not loaded yet.')
      setProfileSaveState('error')
      return
    }

    setProfileSaveState('saving')
    setProfileMessage(null)

    const cleanFullName = fullName.trim()
    const cleanBusinessName = businessName.trim()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: cleanFullName || null,
        business_name: cleanBusinessName || null,
      })
      .eq('id', profile.id)

    if (error) {
      console.error('[settings] Failed to update profile:', error)
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

    const { error: authError } = await supabase.auth.updateUser({
      email: cleanEmail,
    })

    if (authError) {
      console.error('[settings] Failed to update email:', authError)
      setEmailSaveState('error')
      setEmailMessage(authError.message || 'Could not update your email.')
      return
    }

    if (profile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: cleanEmail,
        })
        .eq('id', profile.id)

      if (profileError) {
        console.error('[settings] Failed to sync profile email:', profileError)
      }
    }

    setEmailSaveState('success')
    setEmailMessage(
      'Email update started. Supabase may send a confirmation email before the change is finalized.'
    )
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

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      console.error('[settings] Failed to update password:', error)
      setPasswordSaveState('error')
      setPasswordMessage(error.message || 'Could not update your password.')
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setPasswordSaveState('success')
    setPasswordMessage('Password updated successfully.')
  }

  const badgeClass =
    profile?.plan_status === 'active'
      ? 'bg-green-950 text-green-300 border-green-800'
      : 'bg-gray-800 text-gray-300 border-gray-700'

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
          Account
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Settings
        </h1>

        <p className="mt-2 text-gray-400">
          Manage your ReplyIQ profile, business details, email, and password.
        </p>
      </div>

      {pageError ? (
        <div className="mb-6 rounded-xl border border-red-700 bg-red-950 px-4 py-3 text-sm text-red-400">
          {pageError}
        </div>
      ) : null}

      <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">Current plan</p>
            <div className="mt-2 flex items-center gap-3">
              <p className="text-2xl font-bold capitalize text-white">
                {profile?.plan || 'free'}
              </p>

              <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeClass}`}>
                {profile?.plan_status || 'inactive'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard/billing')}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Manage Billing
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
        >
          <h2 className="text-xl font-bold text-white">
            Business profile
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            This information helps personalize the product experience.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jeremy Robinson"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="businessName"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Business name
              </label>

              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Apex Automations"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </div>
          </div>

          {profileMessage ? (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                profileSaveState === 'success'
                  ? 'border-green-800 bg-green-950 text-green-300'
                  : 'border-red-700 bg-red-950 text-red-400'
              }`}
            >
              {profileMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={profileSaveState === 'saving'}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {profileSaveState === 'saving' ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <form
          onSubmit={handleEmailSubmit}
          className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
        >
          <h2 className="text-xl font-bold text-white">
            Email address
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Update the email address used to log in to ReplyIQ.
          </p>

          <div className="mt-6">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
            />
          </div>

          {emailMessage ? (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                emailSaveState === 'success'
                  ? 'border-green-800 bg-green-950 text-green-300'
                  : 'border-red-700 bg-red-950 text-red-400'
              }`}
            >
              {emailMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={emailSaveState === 'saving'}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {emailSaveState === 'saving' ? 'Updating...' : 'Update email'}
          </button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="rounded-2xl border border-gray-800 bg-gray-900 p-6 lg:col-span-2"
        >
          <h2 className="text-xl font-bold text-white">
            Change password
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Choose a secure password with at least 8 characters.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                New password
              </label>

              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </div>
          </div>

          {passwordMessage ? (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                passwordSaveState === 'success'
                  ? 'border-green-800 bg-green-950 text-green-300'
                  : 'border-red-700 bg-red-950 text-red-400'
              }`}
            >
              {passwordMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={passwordSaveState === 'saving'}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordSaveState === 'saving' ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}