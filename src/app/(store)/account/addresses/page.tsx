'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useMe } from '@/lib/client/hooks'
import { api, errorMessage } from '@/lib/client/api'
import { AddressDialog, emptyAddress, formatAddress } from '@/components/common/address-form'
import { EmptyState } from '@/components/common/empty-state'
import { useDeliveryZone } from '@/components/common/delivery-zone'
import { formatKm, formatKmAway } from '@/lib/geo'
import type { Address, User } from '@/lib/types'

export default function AddressesPage() {
  const { user } = useMe()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Address | null>(null)
  const [open, setOpen] = useState(false)
  const addresses = user?.addresses || []
  const zone = useDeliveryZone()

  async function remove(a: Address) {
    if (!confirm(`Delete the "${a.label}" address?`)) return
    try {
      const r = await api<{ user: User }>(`/api/account/addresses/${a.id}`, { method: 'DELETE' })
      qc.setQueryData(['me'], r)
      toast.success('Address deleted')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function makeDefault(a: Address) {
    try {
      const { id, ...rest } = a
      const r = await api<{ user: User }>(`/api/account/addresses/${id}`, { method: 'PATCH', body: { ...rest, isDefault: true } })
      qc.setQueryData(['me'], r)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Saved addresses</h2>
        <button onClick={() => { setEditing(null); setOpen(true) }} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800"><Plus className="h-4 w-4" /> Add new</button>
      </div>
      {addresses.length === 0 ? (
        <EmptyState icon={<MapPin className="h-8 w-8" />} title="No saved addresses" text="Add an address to check out faster." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-3xl bg-white p-5 ring-1 ring-border">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-brand-700" /> {a.label}</p>
                {a.isDefault && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">Default</span>}
              </div>
              <p className="mt-2 text-sm font-semibold">{a.name} · {a.phone}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{formatAddress(a)}</p>
              {(() => {
                const z = zone.check(a)
                if (z.ok) return zone.limited ? <p className="mt-1.5 text-xs font-semibold text-brand-700">✓ Within delivery area · {formatKm(z.km)} from shop</p> : null
                return <p className="mt-1.5 text-xs font-bold text-red-600">{z.reason === 'no-location' ? '⚠ Location not pinned — edit to add it before ordering' : `⚠ ${formatKmAway(z.km!, z.limitKm)} away — outside our ${formatKm(z.limitKm)} delivery area`}</p>
              })()}
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => { setEditing(a); setOpen(true) }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ring-border hover:bg-cream"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                {!a.isDefault && <button onClick={() => makeDefault(a)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ring-border hover:bg-cream"><Star className="h-3.5 w-3.5" /> Make default</button>}
                <button onClick={() => remove(a)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddressDialog
        open={open}
        onOpenChange={setOpen}
        addressId={editing?.id}
        initial={editing ? (({ id, ...rest }) => rest)(editing) : emptyAddress(user)}
      />
    </div>
  )
}
