'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { api, errorMessage } from '@/lib/client/api'
import { addressSchema } from '@/lib/validation'
import { SITE } from '@/lib/site'
import type { Address, User } from '@/lib/types'
import { cn } from '@/lib/utils'

type Form = Omit<Address, 'id'>

export function emptyAddress(user?: User | null): Form {
  return {
    label: 'Home',
    name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    landmark: '',
    city: SITE.address.city,
    district: SITE.address.district,
    state: SITE.address.state,
    pincode: SITE.address.pincode,
    isDefault: false,
  }
}

/** Add / edit an address in a dialog. Calls onSaved with the updated user. */
export function AddressDialog({
  open,
  onOpenChange,
  initial,
  addressId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial: Form
  addressId?: string
  onSaved?: (user: User, address?: Address) => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Form>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  // reset the form each time the dialog opens
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm(initial)
      setErrors({})
    }
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    const parsed = addressSchema.safeParse(form)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] ||= i.message))
      setErrors(errs)
      return
    }
    setSaving(true)
    try {
      const res = addressId
        ? await api<{ user: User; address?: Address }>(`/api/account/addresses/${addressId}`, { method: 'PATCH', body: parsed.data })
        : await api<{ user: User; address?: Address }>('/api/account/addresses', { body: parsed.data })
      qc.setQueryData(['me'], { user: res.user })
      toast.success(addressId ? 'Address updated' : 'Address saved')
      onSaved?.(res.user, res.address)
      onOpenChange(false)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const field = (k: keyof Form, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1">
      <Label htmlFor={`addr-${k}`} className="text-xs font-semibold">{label}</Label>
      <Input
        id={`addr-${k}`}
        value={String(form[k] ?? '')}
        onChange={(e) => set(k, e.target.value as never)}
        className={cn('h-11 rounded-xl bg-white', errors[k] && 'border-red-400 focus-visible:ring-red-200')}
        aria-invalid={!!errors[k]}
        {...props}
      />
      {errors[k] && <p className="text-xs text-red-600">{errors[k]}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{addressId ? 'Edit address' : 'Add delivery address'}</DialogTitle>
          <DialogDescription>We deliver from {SITE.address.line1}, {SITE.address.city}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex gap-2">
            {['Home', 'Work', 'Other'].map((l) => (
              <button key={l} type="button" onClick={() => set('label', l)} className={cn('rounded-full border px-4 py-1.5 text-sm font-semibold', form.label === l ? 'border-brand-700 bg-brand-700 text-white' : 'border-border')}>{l}</button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('name', 'Full name', { autoComplete: 'name' })}
            {field('phone', 'Mobile number', { inputMode: 'tel', autoComplete: 'tel', placeholder: '10-digit mobile' })}
          </div>
          {field('line1', 'House no., building, street', { autoComplete: 'address-line1' })}
          {field('line2', 'Area / locality (optional)', { autoComplete: 'address-line2' })}
          {field('landmark', 'Landmark (optional)', { placeholder: 'Near …' })}
          <div className="grid grid-cols-2 gap-3">
            {field('city', 'City / town')}
            {field('district', 'District')}
            {field('state', 'State')}
            {field('pincode', 'Pincode', { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' })}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="h-4 w-4 accent-brand-700" />
            Make this my default address
          </label>
          <Button onClick={save} disabled={saving} className="mt-1 h-12 rounded-xl bg-brand-700 text-base font-bold hover:bg-brand-800">
            {saving ? 'Saving…' : 'Save address'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function formatAddress(a: Pick<Address, 'line1' | 'line2' | 'landmark' | 'city' | 'district' | 'state' | 'pincode'>): string {
  return [a.line1, a.line2, a.landmark && `Near ${a.landmark.replace(/^near\s+/i, '')}`, a.city, a.district, `${a.state} ${a.pincode}`].filter(Boolean).join(', ')
}
