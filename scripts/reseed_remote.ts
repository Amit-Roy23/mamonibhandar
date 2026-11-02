/* Push new seed catalog to the remote store (textdb.dev), preserving existing orders. */
import { buildSeedProducts } from '../src/lib/catalog'

const REMOTE_URL = process.env.REMOTE_DB_URL || ''

if (!REMOTE_URL) {
  console.error('Set REMOTE_DB_URL env var (e.g. https://textdb.dev/api/data/<your-key>)')
  process.exit(1)
}

function b64urlEncode(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64url')
}
function b64urlDecode(s: string): string {
  return Buffer.from(s, 'base64url').toString('utf8')
}

async function main() {
  // 1. read current remote data
  const res = await fetch(REMOTE_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`remote read failed: ${res.status}`)
  let raw = (await res.text()).trim()
  if (raw.startsWith('value=')) raw = raw.slice(6)

  let orders: unknown[] = []
  let oldCount = 0
  if (raw) {
    try {
      const data = JSON.parse(b64urlDecode(raw))
      orders = Array.isArray(data.orders) ? data.orders : []
      oldCount = Array.isArray(data.products) ? data.products.length : 0
    } catch {
      console.log('could not parse existing remote data; starting fresh')
    }
  }
  console.log(`remote before: ${oldCount} products, ${orders.length} orders`)

  // 2. build new data with fresh catalog
  const products = buildSeedProducts()
  const next = { products, orders }

  // 3. write back
  const body = 'value=' + b64urlEncode(JSON.stringify(next))
  const wres = await fetch(REMOTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!wres.ok) throw new Error(`remote write failed: ${wres.status}`)
  console.log(`remote after: wrote ${products.length} products, kept ${orders.length} orders`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
