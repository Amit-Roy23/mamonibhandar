# 🛒 DesiBasket — Indian Grocery E-commerce

A full-featured online grocery store built with **Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + MongoDB + Cloudinary**.

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
- 🔐 Password login (timing-safe compare, expiring HMAC-signed session cookie)
- 🖼️ Product photo upload to Cloudinary (falls back to an emoji icon)
- 📊 Dashboard stats (products, orders, revenue)
- 🧾 **Inventory & Pricing** — add / edit / delete products, including multi-size variant rows with per-size price, MRP and stock
- 🚚 **Orders management** — view order items (with variant labels) and update status: Placed → Confirmed → Out for Delivery → Delivered / Cancelled
- 📉 Stock auto-decrements per variant when an order is placed

## 🧱 Tech Stack

| Layer      | Tech |
| ---------- | ---- |
| Frontend   | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand |
| Backend    | Next.js Route Handlers in `src/app/api/*` (run as Vercel serverless functions) |
| Database   | **MongoDB** (Atlas recommended) via **Mongoose** |
| Images     | **Cloudinary** (signed direct uploads from the admin panel, auto WebP/AVIF + resizing) |

One repository = one Vercel project. Vercel builds the storefront as static pages and every
`/api/*` route as a serverless function, so frontend and backend deploy together on the same domain.

## ☁️ Deploy to Vercel

1. **MongoDB Atlas**: create a free cluster, add a database user, and under
   *Network Access* allow `0.0.0.0/0` (Vercel functions don't have fixed IPs).
   Copy the connection string (*Connect → Drivers*).
2. **Cloudinary**: from the Cloudinary console copy *Cloud name*, *API Key* and *API Secret*.
3. **Vercel**: *Add New → Project* → import this GitHub repo. The framework is auto-detected as Next.js; leave build settings at their defaults.
4. Under *Environment Variables* add:

| Variable                | Required | Description |
| ----------------------- | -------- | ----------- |
| `MONGODB_URI`           | ✅ | MongoDB connection string |
| `MONGODB_DB`            | optional | Database name (otherwise taken from the URI) |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY`    | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret (server-only, never sent to the browser) |
| `CLOUDINARY_FOLDER`     | optional | Upload folder, default `mamonibhandar/products` |
| `ADMIN_PASSWORD`        | ✅ | Owner panel password (login is disabled in production without it) |
| `ADMIN_SESSION_SECRET`  | optional | Extra secret for signing admin cookies (`openssl rand -hex 32`) |

   (`CLOUDINARY_URL=cloudinary://key:secret@cloud` works instead of the three Cloudinary vars.)
5. **Deploy**. On the first visit the empty database is automatically seeded with the starter catalogue.

## 💻 Local Development

```bash
npm install
cp .env.example .env      # fill in MONGODB_URI, Cloudinary keys, ADMIN_PASSWORD
npm run dev               # http://localhost:3000
```

Optional: `npm run seed` resets the starter products (keeps orders and products you added).

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx                      # storefront + owner panel (client views)
│   └── api/
│       ├── products/                 # GET (public) / POST / DELETE (admin)
│       ├── orders/                   # POST place order (public) · GET / PATCH (admin)
│       └── admin/
│           ├── session/              # owner login / logout
│           └── upload-signature/     # signs Cloudinary uploads (admin)
├── components/shop/                  # header, hero, product card, cart, admin panel…
└── lib/
    ├── mongodb.ts                    # cached Mongoose connection (serverless-safe)
    ├── models.ts                     # Product & Order schemas
    ├── store.ts                      # data access + race-safe order placement
    ├── cloudinary.ts                 # upload signing, URL validation, deletes
    ├── admin.ts                      # owner auth (expiring HMAC-signed cookie)
    └── catalog.ts                    # starter catalogue seed data
scripts/seed.ts                       # manual re-seed
```

### How it works
- **Stock safety**: each order line is reserved with an atomic conditional update
  (`stock >= qty`); if any line fails the earlier ones are rolled back, so two customers can't buy the last unit.
- **Images**: the admin's browser asks `/api/admin/upload-signature` for a signature, uploads straight to
  Cloudinary (no Vercel body-size limit), then saves the returned URL with the product. Replaced or deleted
  products have their old image removed from Cloudinary.

## 📄 License

MIT — free to use and modify for your own store.
