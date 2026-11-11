'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client/api'
import type { DashboardStats } from '@/lib/server/stats'

/** Dashboard numbers, polled every 20 s while the admin panel is open (drives new-order alerts). */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api<{ stats: DashboardStats }>('/api/admin/stats'),
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
  })
}
