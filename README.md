# 🛒 MB Mart · Maamoni Bhandar

**Your Fresh Neighborhood Grocer** — online grocery store for Maamoni Bhandar, Mirza Bazaar, Udaipur, Gomati, Tripura 799105.
📧 maamonibhandar@gmail.com

One Next.js project that deploys to Vercel as both the storefront (frontend) and the API (backend), with **MongoDB** for data and **Cloudinary** for product photos.

## ✨ Features

### Customer side
- Home page with hero banners, categories, bestsellers, biggest savings, per-category rows
- Shop page: search with instant suggestions, category filter, sort (popular, price, discount, newest), in-stock / on-offer filters
- Product page with pack-size selection, stock status, related products, share previews
- Cart with free-delivery progress, stock warnings, savings summary
- **Accounts**: register/login with mobile number or email, profile, change password
- **Saved addresses** (home/work), default address
- **Checkout**: choose address, Cash or UPI on delivery, apply coupon, delivery instructions
- **My orders**: live status tracker, cancel (before packing), re-order, printable invoice
- Wishlist, contact page, fully responsive with an app-style bottom bar on phones

### Admin panel (`/admin`)
- **Dashboard**: today's sales, 14-day sales chart, orders by status, pending-order alert, low stock, top sellers
- **Products**: full CRUD, Cloudinary photo upload (drag & drop), multiple pack sizes with their own price/MRP/stock, hide/show, bestseller badge, inline stock editing
- **Categories**: add / rename / reorder / hide, optional image
- **Orders**: filter by status, search, one-click status updates (Placed → Confirmed → Packed → Out for delivery → Delivered), cancel with reason (stock returned automatically), payment status, call/WhatsApp customer, print invoice
- **Customers**: order count & total spent, block/unblock, grant admin access
- **Coupons**: % or flat, minimum order, max discount, expiry, total & per-customer limits
- **Store settings**: delivery fee, free-delivery threshold, minimum order, delivery pincodes, open/closed for orders, payment methods, UPI ID, announcement bar, phone/WhatsApp/hours

### Business logic
- Prices are always recalculated on the server; stock is reserved with atomic conditional updates (the last unit can never be sold twice) and rolled back if checkout fails
- Cancelling an order returns its stock and frees the coupon use
- COD/UPI orders are marked paid automatically on delivery
- Sessions are signed cookies; changing a password or blocking a user logs them out everywhere; 5 wrong passwords lock the account for 15 minutes
- Optional email alerts: new order → store inbox, confirmation & status updates → customer

## 🧱 Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand |
| Backend | Next.js Route Handlers in `src/app/api/*` (Vercel serverless functions), Zod validation |
| Database | MongoDB (Atlas) via Mongoose |
| Images | Cloudinary — signed direct uploads, auto WebP/AVIF + resizing |
| Email | Nodemailer (optional, any SMTP / Gmail app password) |

## ☁️ Deploy to Vercel

1. **MongoDB Atlas** — create a free cluster and a database user. Under **Network Access** add `0.0.0.0/0` (Vercel has no fixed IPs). Copy the connection string.
2. **Cloudinary** — copy *Cloud name*, *API Key*, *API Secret* from the dashboard.
3. **Vercel** — *Add New → Project* → import this repo. Keep the defaults (Next.js preset, root `./`).
4. Add **Environment Variables**:

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | Atlas connection string |
| `CLOUDINARY_CLOUD_NAME` | ✅ | |
| `CLOUDINARY_API_KEY` | ✅ | |
| `CLOUDINARY_API_SECRET` | ✅ | server-only |
| `ADMIN_PASSWORD` | ✅ | owner login password |
| `ADMIN_EMAIL` | optional | owner login email, default `maamonibhandar@gmail.com` |
| `AUTH_SECRET` | recommended | random string for signing sessions |
| `NEXT_PUBLIC_SITE_URL` | optional | your live URL (emails, link previews) |
| `SMTP_USER`, `SMTP_PASS` | optional | enables order emails (Gmail app password) |
| `MONGODB_DB`, `CLOUDINARY_FOLDER`, `ORDER_NOTIFY_EMAIL` | optional | |

5. **Deploy.** The first visit seeds the starter categories and ~100 products.
6. Open `/login`, sign in with `ADMIN_EMAIL` + `ADMIN_PASSWORD` → you land in the admin panel. Go to **Store settings** to set your phone, hours, delivery fee and pincodes.

## 💻 Local development

```bash
npm install
cp .env.example .env    # fill in the values
npm run dev             # http://localhost:3000
```

`npm run seed` resets the starter products (keeps your own products and all orders).

## 🗂️ Structure

```
src/
├── app/
│   ├── (store)/            # storefront: home, shop, product, cart, checkout, account, login…
│   ├── admin/              # admin panel pages (role-protected)
│   └── api/                # REST API: auth, account, products, orders, coupons, admin/*
├── components/
│   ├── store/              # header, footer, mobile nav, product card, search…
│   ├── admin/              # admin shell, product form, Cloudinary uploader
│   └── common/             # shared: order status, invoice, address form…
└── lib/
    ├── server/             # MongoDB models, auth, orders, coupons, catalog, stats, mail, cloudinary
    ├── client/             # fetch helper + React Query hooks
    ├── validation.ts       # Zod schemas shared by API and forms
    ├── types.ts            # shared types + order status flow
    └── site.ts             # business name, address, email
```
