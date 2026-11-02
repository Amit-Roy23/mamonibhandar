'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useMe } from '@/lib/client/hooks'
import { api, errorMessage } from '@/lib/client/api'
import { changePasswordSchema, profileSchema } from '@/lib/validation'
import type { User } from '@/lib/types'

const inputCls = 'h-11 w-full rounded-xl border border-border bg-cream px-3.5 text-sm outline-none focus:border-brand-400 focus:bg-white'

export default function ProfilePage() {
  const { user } = useMe()
  if (!user) return <div className="h-64 animate-pulse rounded-3xl bg-cream-200" />
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  )
}

function ProfileForm({ user }: { user: User }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', email: user.email || '' })
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const parsed = profileSchema.safeParse({ name: form.name, phone: form.phone || undefined, email: form.email })
    if (!parsed.success) return toast.error(parsed.error.issues[0].message)
    setSaving(true)
    try {
      const r = await api<{ user: User }>('/api/account', { method: 'PATCH', body: parsed.data })
      qc.setQueryData(['me'], r)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-border sm:p-6">
      <h2 className="text-lg font-bold">Profile</h2>
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Full name</span><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Mobile number</span><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" autoComplete="tel" /></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Email <span className="font-normal text-muted-foreground">(for order updates)</span></span><input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" autoComplete="email" /></label>
      <button disabled={saving} className="flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-6 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</button>
    </form>
  )
}

function PasswordForm() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.next !== form.confirm) return toast.error('New passwords do not match')
    const parsed = changePasswordSchema.safeParse(form)
    if (!parsed.success) return toast.error(parsed.error.issues[0].message)
    setSaving(true)
    try {
      await api('/api/account/password', { body: parsed.data })
      toast.success('Password changed. Other devices have been logged out.')
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-3xl bg-white p-5 ring-1 ring-border sm:p-6">
      <h2 className="text-lg font-bold">Change password</h2>
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Current password</span><input type="password" className={inputCls} value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} autoComplete="current-password" /></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold">New password</span><input type="password" className={inputCls} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} autoComplete="new-password" /></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold">Confirm new password</span><input type="password" className={inputCls} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} autoComplete="new-password" /></label>
      <button disabled={saving} className="flex h-11 items-center gap-2 rounded-xl bg-ink px-6 text-sm font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Update password</button>
    </form>
  )
}
