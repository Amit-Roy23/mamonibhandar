'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApp } from '@/lib/cart-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { ProductDialog, emptyProductForm, productToForm, type ProductFormState } from './product-dialog'
import { formatINR } from '@/lib/format'
import { type Order, type Product } from '@/lib/types'
import {
  ArrowLeft, Boxes, ClipboardList, IndianRupee, LogOut, LockKeyhole,
  PackageSearch, Pencil, Plus, Trash2, TrendingDown,
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_OPTIONS = ['PLACED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const
const STATUS_LABEL: Record<string, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data as T
}

export function AdminPanel() {
  const setView = useApp((s) => s.setView)
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['admin-session'],
    queryFn: () => getJSON<{ authenticated: boolean }>('/api/admin/session'),
  })

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-600 text-xl">🧺</span>
            <div className="leading-tight">
              <p className="text-base font-extrabold text-stone-900">DesiBasket · Owner Panel</p>
              <p className="text-xs text-stone-500">Manage inventory, pricing & orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setView('shop')} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">View</span> Store
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {sessionLoading ? (
          <div className="grid h-64 place-items-center text-stone-400">Checking session…</div>
        ) : session?.authenticated ? (
          <AdminDashboard onLogout={() => setView('shop')} />
        ) : (
          <AdminLogin />
        )}
      </main>
    </div>
  )
}

function AdminLogin() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  async function login() {
    if (!password) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      toast.success('Welcome back, Owner! 👋')
      queryClient.invalidateQueries({ queryKey: ['admin-session'] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <Card className="w-full max-w-sm rounded-2xl shadow-md">
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-green-100">
              <LockKeyhole className="h-7 w-7 text-green-700" />
            </span>
            <h2 className="text-lg font-bold">Owner Login</h2>
            <p className="text-sm text-stone-500">Enter the admin password to manage your store inventory & orders.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-pass">Admin password</Label>
            <Input
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          <Button className="h-11 bg-green-600 hover:bg-green-700" onClick={login} disabled={loading || !password}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<ProductFormState>(emptyProductForm)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [prodSearch, setProdSearch] = useState('')

  const { data: prodData, isLoading: prodLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getJSON<{ products: Product[] }>('/api/products'),
    refetchInterval: 15000,
  })
  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => getJSON<{ orders: Order[] }>('/api/orders'),
    refetchInterval: 15000,
  })

  const products = prodData?.products || []
  const orders = orderData?.orders || []

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => {
      if (Array.isArray(p.variants) && p.variants.length >= 2) return p.variants.every((v) => v.stock <= 5)
      return p.stock <= 5
    }).length
    const revenue = orders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0)
    return { products: products.length, lowStock, orders: orders.length, revenue }
  }, [products, orders])

  const filteredProducts = useMemo(() => {
    const q = prodSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }, [products, prodSearch])

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' })
    toast.info('Logged out. See you soon!')
    queryClient.invalidateQueries({ queryKey: ['admin-session'] })
    onLogout()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const res = await fetch(`/api/products?id=${encodeURIComponent(deleteTarget.id)}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(`"${deleteTarget.name}" removed from store`)
      queryClient.invalidateQueries({ queryKey: ['products'] })
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Failed to delete')
    }
    setDeleteTarget(null)
  }

  async function updateStatus(orderId: string, status: string) {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status }),
    })
    if (res.ok) {
      toast.success(`Order ${orderId} → ${STATUS_LABEL[status] || status}`)
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    } else {
      toast.error('Failed to update order status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-stone-900 sm:text-2xl">Store Dashboard</h1>
        <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 text-stone-600">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Boxes className="h-5 w-5" />} label="Products in Store" value={String(stats.products)} tone="bg-green-100 text-green-700" />
        <StatCard icon={<TrendingDown className="h-5 w-5" />} label="Low Stock (≤5)" value={String(stats.lowStock)} tone="bg-orange-100 text-orange-700" />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Total Orders" value={String(stats.orders)} tone="bg-amber-100 text-amber-700" />
        <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Revenue" value={formatINR(stats.revenue)} tone="bg-emerald-100 text-emerald-700" />
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="h-11 rounded-xl bg-stone-100 p-1">
          <TabsTrigger value="products" className="rounded-lg px-4 data-[state=active]:bg-white">Inventory & Pricing</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg px-4 data-[state=active]:bg-white">Orders ({orders.length})</TabsTrigger>
        </TabsList>

        {/* ---------------- Products ---------------- */}
        <TabsContent value="products" className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              placeholder="Search your inventory…"
              className="h-10 max-w-xs rounded-xl bg-white"
            />
            <Button
              className="gap-1.5 bg-green-600 hover:bg-green-700"
              onClick={() => { setForm(emptyProductForm); setDialogOpen(true) }}
            >
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/70">
                  <TableHead className="pl-4">Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden md:table-cell">MRP</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prodLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-stone-400">Loading inventory…</TableCell></TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <PackageSearch className="h-8 w-8" />
                        <p>{prodSearch ? 'No products match your search.' : 'No products yet — click "Add Product" to stock your store.'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-stone-100 text-xl" aria-hidden>{p.emoji}</span>
                          <div className="min-w-0">
                            <p className="max-w-52 truncate font-semibold text-stone-800">
                              {p.name} {p.featured && '⭐'}
                            </p>
                            <p className="text-xs text-stone-500 sm:hidden">{p.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="rounded-md font-medium">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-green-700">
                        {formatINR(p.price)}
                        {(p.variants?.length || 0) >= 2 && (
                          <Badge variant="secondary" className="ml-1.5 rounded bg-green-100 text-[10px] font-bold text-green-800 hover:bg-green-100">
                            {p.variants!.length} sizes
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-stone-500 line-through md:table-cell">{formatINR(p.mrp)}</TableCell>
                      <TableCell>
                        {(() => {
                          const vs = Array.isArray(p.variants) ? p.variants : []
                          if (vs.length >= 2) {
                            const total = vs.reduce((s, v) => s + v.stock, 0)
                            return total <= 0 ? (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">All out</Badge>
                            ) : total <= 8 ? (
                              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{total} left</Badge>
                            ) : (
                              <span className="font-medium text-stone-700" title={vs.map((v) => `${v.label}: ${v.stock}`).join(', ')}>{total} <span className="text-xs text-stone-400">(all sizes)</span></span>
                            )
                          }
                          return p.stock <= 0 ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Out</Badge>
                          ) : p.stock <= 5 ? (
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{p.stock} left</Badge>
                          ) : (
                            <span className="font-medium text-stone-700">{p.stock}</span>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-stone-500 hover:text-green-700" onClick={() => { setForm(productToForm(p)); setDialogOpen(true) }} aria-label={`Edit ${p.name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-stone-500 hover:text-red-600" onClick={() => setDeleteTarget(p)} aria-label={`Delete ${p.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ---------------- Orders ---------------- */}
        <TabsContent value="orders" className="mt-4">
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/70">
                  <TableHead className="pl-4">Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead className="pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-stone-400">Loading orders…</TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-stone-400">No orders yet — they will appear here when customers check out.</TableCell></TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="pl-4">
                        <p className="font-mono text-xs font-bold text-stone-800">{o.id}</p>
                        <p className="text-xs text-stone-500">
                          {new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-stone-800">{o.customerName}</p>
                        <p className="max-w-44 text-xs text-stone-500">📞 {o.phone}</p>
                        <p className="max-w-44 truncate text-xs text-stone-400" title={o.address}>{o.address}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="max-w-56 truncate text-xs text-stone-600" title={o.items.map((i) => `${i.name}${i.unit ? ` (${i.unit})` : ''} ×${i.qty}`).join(', ')}>
                          {o.items.slice(0, 2).map((i) => `${i.emoji} ${i.name}${i.unit ? ` (${i.unit})` : ''} ×${i.qty}`).join(', ')}
                          {o.items.length > 2 ? ` +${o.items.length - 2} more` : ''}
                        </p>
                      </TableCell>
                      <TableCell className="font-bold text-stone-900">{formatINR(o.total)}</TableCell>
                      <TableCell className="hidden text-xs text-stone-600 sm:table-cell">{o.paymentMethod}</TableCell>
                      <TableCell className="pr-4">
                        <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                          <SelectTrigger className="h-8 w-36 rounded-lg text-xs font-semibold" aria-label={`Status of order ${o.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        onSaved={() => {
          toast.success(form.id ? 'Product updated — live on store!' : 'Product added — live on store! 🎉')
          queryClient.invalidateQueries({ queryKey: ['products'] })
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product from your store. Customers will no longer see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <Card className="rounded-2xl border-stone-200 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-stone-500">{label}</p>
          <p className="text-lg font-extrabold text-stone-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
