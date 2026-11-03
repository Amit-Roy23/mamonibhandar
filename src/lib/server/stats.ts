import { connectDB } from './mongodb'
import { OrderModel, ProductModel, UserModel, type OrderDoc, type ProductDoc } from './models'
import { toOrder, toProduct } from './mappers'
import type { Order, OrderStatus, Product } from '../types'

export interface DashboardStats {
  revenue: number
  orders: number
  customers: number
  products: number
  pendingOrders: number
  todayRevenue: number
  todayOrders: number
  avgOrderValue: number
  lowStockCount: number
  daily: { date: string; revenue: number; orders: number }[]
  statusCounts: Partial<Record<OrderStatus, number>>
  recentOrders: Order[]
  lowStock: Product[]
  topProducts: Product[]
}

const LOW_STOCK = 5
// India Standard Time — the store's day boundaries
const TZ = 'Asia/Kolkata'

function istDateKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export async function getDashboardStats(days = 14): Promise<DashboardStats> {
  await connectDB()
  const since = new Date(Date.now() - days * 86400_000)
  const notCancelled = { status: { $ne: 'CANCELLED' } }

  const [totals, statusAgg, dailyAgg, customers, products, recent, lowStockRows, lowStockCount, top] = await Promise.all([
    OrderModel.aggregate<{ revenue: number; n: number }>([
      { $match: notCancelled },
      { $group: { _id: null, revenue: { $sum: '$total' }, n: { $sum: 1 } } },
    ]),
    OrderModel.aggregate<{ _id: OrderStatus; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    OrderModel.aggregate<{ _id: string; revenue: number; n: number }>([
      { $match: { ...notCancelled, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } },
          revenue: { $sum: '$total' },
          n: { $sum: 1 },
        },
      },
    ]),
    UserModel.countDocuments({ role: 'customer' }),
    ProductModel.countDocuments({}),
    OrderModel.find().sort({ createdAt: -1 }).limit(8).lean<OrderDoc[]>(),
    ProductModel.find({ active: { $ne: false }, stock: { $lte: LOW_STOCK } }).sort({ stock: 1 }).limit(8).lean<ProductDoc[]>(),
    ProductModel.countDocuments({ active: { $ne: false }, stock: { $lte: LOW_STOCK } }),
    ProductModel.find({ soldCount: { $gt: 0 } }).sort({ soldCount: -1 }).limit(5).lean<ProductDoc[]>(),
  ])

  const byDay = new Map(dailyAgg.map((d) => [d._id, d]))
  const daily: DashboardStats['daily'] = []
  for (let i = days - 1; i >= 0; i--) {
    const key = istDateKey(new Date(Date.now() - i * 86400_000))
    const d = byDay.get(key)
    daily.push({ date: key, revenue: Math.round(d?.revenue || 0), orders: d?.n || 0 })
  }
  const today = daily[daily.length - 1]
  const statusCounts = Object.fromEntries(statusAgg.map((s) => [s._id, s.n])) as DashboardStats['statusCounts']
  const revenue = totals[0]?.revenue || 0
  const orders = totals[0]?.n || 0

  return {
    revenue,
    orders,
    customers,
    products,
    pendingOrders: (statusCounts.PLACED || 0) + (statusCounts.CONFIRMED || 0) + (statusCounts.PACKED || 0) + (statusCounts.OUT_FOR_DELIVERY || 0),
    todayRevenue: today?.revenue || 0,
    todayOrders: today?.orders || 0,
    avgOrderValue: orders ? Math.round(revenue / orders) : 0,
    lowStockCount,
    daily,
    statusCounts,
    recentOrders: recent.map(toOrder),
    lowStock: lowStockRows.map(toProduct),
    topProducts: top.map(toProduct),
  }
}
