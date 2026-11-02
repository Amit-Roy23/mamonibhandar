# 🛒 DesiBasket — Indian Grocery E-commerce

A full-featured online grocery store built with **Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Prisma (SQLite)**.

Customers can browse 99+ Indian grocery products, add pack-size variants to the cart and place COD/UPI orders. The store owner gets a password-protected admin panel to manage inventory, pricing and orders.

## ✨ Features

### Storefront (Customer)
- 🎞️ Autoplay hero **banner carousel** + promotional side cards
- 🗂️ **15 categories** — Rice & Grains, Dals & Pulses, Atta & Flours, Spices & Masala, Oil & Ghee, Dairy & Bread, Dry Fruits & Nuts, Snacks & Biscuits, Beverages, Fresh Produce, Sweets, Personal Care, Household, Pooja Needs, Baby Care
- 🔍 Live search + category filtering
- 📦 Product cards with **multi pack-size variants** (e.g. 1 kg / 5 kg — each with its own price, MRP & stock), discount badges, bestseller flags, wishlist
- 🛒 Cart with bill summary, free delivery over ₹500, **COD / UPI on delivery** checkout, order confirmation
- ❤️ Wishlist with persistent storage

### Admin Panel (Owner)
- 🔐 Password login (timing-safe compare, HMAC-signed session cookie)
- 📊 Dashboard stats (products, orders, revenue)
- 🧾 **Inventory & Pricing** — add / edit / delete products, including multi-size variant rows with per-size price, MRP and stock
- 🚚 **Orders management** — view order items (with variant labels) and update status: Placed → Confirmed → Shipped → Delivered / Cancelled
- 📉 Stock auto-decrements per variant when an order is placed

## 🚀 Getting Started

```bash
# 1. install dependencies
bun install        # or npm install

# 2. configure environment
cp .env.example .env   # then edit values (see below)

# 3. push the database schema
bunx prisma db push    # or: bun run db:push

# 4. run the dev server
bun run dev            # http://localhost:3000
```

### Environment variables

| Variable         | Required | Description                                                        |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`   | ✅       | SQLite connection string, e.g. `file:./db/custom.db`                |
| `REMOTE_DB_URL`  | optional | External JSON blob store URL (used on serverless hosts like Vercel) |
| `ADMIN_PASSWORD` | optional | Admin panel password (defaults to `admin123` in dev)                |

## ☁️ Deploy to Vercel

1. Push this repository to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Set the environment variables (`DATABASE_URL`, `REMOTE_DB_URL`, `ADMIN_PASSWORD`)
4. Deploy 🎉

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx              # storefront + admin (single-page views)
│   └── api/
│       ├── products/         # GET / POST / DELETE products
│       ├── orders/           # place + manage orders
│       └── admin/session/    # admin auth
├── components/shop/          # header, hero, category grid, product card, cart, admin panel…
├── lib/                      # catalog seed data, store drivers, cart state, admin auth
prisma/schema.prisma          # Product / Order models (SQLite)
scripts/                      # reseed + cleanup utilities
public/banners/               # AI-generated promo banners (no branding)
```

## 📄 License

MIT — free to use and modify for your own store.
