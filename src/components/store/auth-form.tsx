'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2, Truck, Banknote, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { api, errorMessage } from '@/lib/client/api'
import { useMe } from '@/lib/client/hooks'
import { loginSchema, registerSchema } from '@/lib/validation'
import { SITE } from '@/lib/site'
import type { User } from '@/lib/types'
import { cn } from '@/lib/utils'

function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const params = useSearchParams()
  const qc = useQueryClient()
  const next = safeNext(params.get('next'))
  const adminLogin = mode === 'login' && !!next?.startsWith('/admin')
  const [form, setForm] = useState({ name: '', phone: '', email: '', identifier: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const { user } = useMe()

  // already signed in → go where they were heading
  useEffect(() => {
    if (user && !loading) router.replace(next || (user.role === 'admin' ? '/admin' : '/account'))
  }, [user, loading, next, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const schema = mode === 'login' ? loginSchema : registerSchema
    const payload = mode === 'login'
      ? { identifier: form.identifier, password: form.password }
      : { name: form.name, phone: form.phone, email: form.email || undefined, password: form.password }
    const parsed = schema.safeParse(payload)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] ||= i.message))
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const { user } = await api<{ user: User }>(`/api/auth/${mode}`, { body: parsed.data })
      qc.setQueryData(['me'], { user })
      toast.success(mode === 'login' ? `Welcome back, ${user.name.split(' ')[0]}!` : `Welcome to ${SITE.name}, ${user.name.split(' ')[0]}! 🎉`)
      router.replace(next || (user.role === 'admin' ? '/admin' : '/'))
      router.refresh()
    } catch (err) {
      toast.error(errorMessage(err))
      setLoading(false)
    }
  }

  const input = (k: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="space-y-1.5">
      <label htmlFor={`auth-${k}`} className="text-sm font-semibold">{label}</label>
      <input
        id={`auth-${k}`}
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        className={cn('h-12 w-full rounded-xl border border-border bg-cream px-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100', errors[k] && 'border-red-400')}
        aria-invalid={!!errors[k]}
        {...props}
      />
      {errors[k] && <p className="text-xs text-red-600">{errors[k]}</p>}
    </div>
  )

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-2">
      <div className="bg-dots relative hidden overflow-hidden rounded-[2rem] bg-brand-800 p-10 text-white lg:block">
        <Image src="/logo.png" alt={SITE.name} width={120} height={120} className="rounded-full bg-white shadow-lg" />
        <h2 className="mt-8 text-3xl font-extrabold leading-tight">{mode === 'login' ? 'Welcome back to your neighbourhood store.' : `Join ${SITE.name} — groceries made easy.`}</h2>
        <ul className="mt-8 space-y-4 text-sm text-white/85">
          <li className="flex items-center gap-3"><Truck className="h-5 w-5 text-leaf-300" /> Doorstep delivery around {SITE.address.city}</li>
          <li className="flex items-center gap-3"><Banknote className="h-5 w-5 text-leaf-300" /> Cash on Delivery — pay when it arrives</li>
          <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-leaf-300" /> Track orders & save addresses</li>
        </ul>
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-saffron-500/30 blur-3xl" />
      </div>

      <div className="rounded-[2rem] bg-white p-6 ring-1 ring-border sm:p-10">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{adminLogin ? 'Owner / Admin login' : mode === 'login' ? 'Log in' : 'Create your account'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {adminLogin ? 'Sign in with the store email and the admin password set on the server.' : mode === 'login' ? 'Use your mobile number or email.' : 'It takes less than a minute.'}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {mode === 'register' && input('name', 'Full name', { autoComplete: 'name', placeholder: 'Your name' })}
          {mode === 'register' && input('phone', 'Mobile number', { autoComplete: 'tel', inputMode: 'tel', placeholder: '10-digit mobile number' })}
          {mode === 'register' && input('email', 'Email (optional)', { autoComplete: 'email', type: 'email', placeholder: 'For order updates' })}
          {mode === 'login' && input('identifier', adminLogin ? 'Admin email' : 'Mobile number or email', { autoComplete: 'username', placeholder: adminLogin ? 'maamonibhandar@gmail.com' : '98xxxxxxxx or you@email.com' })}
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="text-sm font-semibold">Password</label>
            <div className="relative">
              <input
                id="auth-password"
                type={show ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                className={cn('h-12 w-full rounded-xl border border-border bg-cream px-4 pr-12 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100', errors.password && 'border-red-400')}
                aria-invalid={!!errors.password}
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          </div>
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 font-bold text-white transition hover:bg-brand-800 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <p className={cn('mt-6 text-center text-sm text-muted-foreground', adminLogin && 'hidden')}>
          {mode === 'login' ? "New to MB Mart? " : 'Already have an account? '}
          <Link href={`/${mode === 'login' ? 'register' : 'login'}${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold text-brand-700 hover:underline">
            {mode === 'login' ? 'Create an account' : 'Log in'}
          </Link>
        </p>
        {mode === 'login' && <p className="mt-3 text-center text-xs text-muted-foreground">Forgot your password? Call the store or email <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-700">{SITE.email}</a> — we&apos;ll reset it for you.</p>}
      </div>
    </div>
  )
}
