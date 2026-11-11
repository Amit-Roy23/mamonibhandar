'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react'
import { useAdminStats } from './use-admin-stats'
import { formatINR } from '@/lib/format'

const PREF_KEY = 'mbmart-admin-alerts'

function readPrefs(): { sound: boolean } {
  try {
    return { sound: true, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }
  } catch {
    return { sound: true }
  }
}

/** Short two-tone chime generated in the browser (no audio file needed). */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[880, 1320].forEach((freq, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      const t = ctx.currentTime + i * 0.22
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 0.4)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch {
    /* audio blocked until the page has been clicked once */
  }
}

/**
 * Watches the admin stats poll (every 20 s). When a newer order appears:
 * chime + toast + browser notification (if allowed) + unread count in the tab title.
 */
export function NewOrderWatcher() {
  const { data } = useAdminStats()
  const router = useRouter()
  const qc = useQueryClient()
  const lastSeen = useRef<string | null>(null)
  const baseTitle = useRef<string>('')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    baseTitle.current = document.title
    const clear = () => document.visibilityState === 'visible' && setUnread(0)
    document.addEventListener('visibilitychange', clear)
    return () => document.removeEventListener('visibilitychange', clear)
  }, [])

  useEffect(() => {
    const latest = data?.stats.recentOrders[0]
    if (!latest) return
    if (lastSeen.current === null) {
      lastSeen.current = latest.id // first load: remember, don't alert
      return
    }
    if (latest.id === lastSeen.current) return
    const prevIdx = data.stats.recentOrders.findIndex((o) => o.id === lastSeen.current)
    const fresh = prevIdx === -1 ? 1 : prevIdx
    lastSeen.current = latest.id
    if (fresh <= 0) return

    qc.invalidateQueries({ queryKey: ['admin-orders'] })
    if (readPrefs().sound) chime()
    setUnread((n) => n + fresh)
    toast.success(`🛒 New order from ${latest.customerName} · ${formatINR(latest.total)}`, {
      duration: 15000,
      action: { label: 'View', onClick: () => router.push(`/admin/orders/${latest.id}`) },
    })
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      const n = new Notification('New MB Mart order', { body: `${latest.customerName} · ${formatINR(latest.total)} · ${latest.items.length} items`, icon: '/icon-192.png', tag: latest.id })
      n.onclick = () => {
        window.focus()
        router.push(`/admin/orders/${latest.id}`)
      }
    }
  }, [data, qc, router])

  useEffect(() => {
    if (!baseTitle.current) return
    document.title = unread > 0 ? `(${unread}) New order · ${baseTitle.current}` : baseTitle.current
  }, [unread])

  return null
}

/** Sound / notification switches shown in the admin sidebar. */
export function AlertToggles() {
  const [sound, setSound] = useState(true)
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- read browser-only prefs once after mount */
    setSound(readPrefs().sound)
    setPerm(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  function toggleSound() {
    const next = !sound
    setSound(next)
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ ...readPrefs(), sound: next }))
    } catch {}
    if (next) chime()
  }

  async function enableNotifications() {
    if (typeof Notification === 'undefined') return
    const p = await Notification.requestPermission()
    setPerm(p)
    if (p === 'granted') toast.success('Notifications on — you will be alerted about new orders')
    else toast.info('Notifications were not allowed. You can enable them in your browser settings.')
  }

  return (
    <div className="flex gap-1.5">
      <button onClick={toggleSound} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sidebar-accent px-2 py-2 text-xs font-semibold text-sidebar-foreground/90 hover:text-white" aria-pressed={sound} title="Play a sound when a new order arrives">
        {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />} Sound {sound ? 'on' : 'off'}
      </button>
      {perm !== 'unsupported' && (
        <button onClick={enableNotifications} disabled={perm === 'granted'} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sidebar-accent px-2 py-2 text-xs font-semibold text-sidebar-foreground/90 hover:text-white disabled:opacity-70" title="Show a notification for new orders">
          {perm === 'granted' ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />} {perm === 'granted' ? 'Alerts on' : 'Alerts'}
        </button>
      )}
    </div>
  )
}
