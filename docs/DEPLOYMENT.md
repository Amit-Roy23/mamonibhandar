# Deployment, custom domain & handover

This is the checklist for putting MB Mart live on its own domain and handing it to the client.
The app is one Next.js project on **Vercel**, data in **MongoDB Atlas**, photos on **Cloudinary**.

---

## 1. Environment variables (Vercel → Project → Settings → Environment Variables)

Set these for **Production** (and Preview, if you use preview deployments with the same database). Every change needs a **Redeploy**.

| Variable | Required | What it is |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | Atlas connection string |
| `ADMIN_PASSWORD` | ✅ | Owner's **first-login / recovery** password — 10+ characters. Stops working once the owner sets their own password in the admin panel; changing it later is how you recover the owner's access |
| `AUTH_SECRET` | ✅ | Random 64-char string (`openssl rand -hex 32`) that signs logins |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | ✅ | Photo uploads |
| `NEXT_PUBLIC_SITE_URL` | ✅ after the domain is added | e.g. `https://yourdomain.in` (no trailing slash) |
| `ADMIN_EMAIL` | optional | Owner login email (default `maamonibhandar@gmail.com`) |
| `SMTP_USER`, `SMTP_PASS` | optional | Order emails (Gmail App Password) |
| `MONGODB_DB`, `CLOUDINARY_FOLDER`, `ORDER_NOTIFY_EMAIL`, `SMTP_HOST`, `SMTP_PORT` | optional | |

After deploying, open **Admin → Store settings → System status**: every required item should be green.

## 2. Speed: put the server next to the database

1. Atlas → your cluster → note the region (best: **AWS Mumbai, ap-south-1**).
2. Vercel → Settings → **Functions → Function Region** → choose the same area (**Mumbai, India — bom1**) → Save → Redeploy.
3. System status shows the database latency; under ~50 ms is ideal.

## 3. Add the custom domain

1. Buy the domain (e.g. from GoDaddy, Hostinger, BigRock, Namecheap) — **register it in the client's name and email**.
2. Vercel → Project → **Settings → Domains → Add** → enter `yourdomain.in`. Vercel offers to add `www.yourdomain.in` too — accept, and choose to **redirect www → yourdomain.in**.
3. Vercel shows the DNS records to create. At the domain registrar's DNS panel, add **exactly the records Vercel shows** (normally an `A` record for `@` and a `CNAME` for `www`). Remove any old `A`/`CNAME` records for the same names (parking pages).
4. Wait until Vercel shows **Valid Configuration** (minutes to a few hours). HTTPS certificates are issued automatically.
5. Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.in` → **Redeploy**.
6. Check on a phone:
   - `https://yourdomain.in` loads, and `http://` and `www.` redirect to it
   - **Check delivery** asks for location (browsers only allow this on HTTPS)
   - `https://yourdomain.in/sitemap.xml` and `/robots.txt` show the new domain
   - Share a product link on WhatsApp → preview shows the product

The old `*.vercel.app` address keeps working; you can leave it.

## 4. Google (so customers can find the shop)

- **Google Search Console** → add property `yourdomain.in` (verify with the DNS TXT record it gives) → **Sitemaps** → submit `https://yourdomain.in/sitemap.xml`.
- **Google Business Profile** for "Maamoni Bhandar / MB Mart" at Mirza Bazaar → put the website link there.

## 5. Data safety & backups

- MongoDB Atlas **free (M0) clusters have no automatic backups**. Either:
  - upgrade the cluster to a paid tier with Cloud Backups, **or**
  - have the owner download **Orders, Products and Customers CSV** from the admin panel every week (see the Owner guide) and keep them in Google Drive.
- Atlas → **Network Access** must allow `0.0.0.0/0` (Vercel has no fixed IPs). Use a strong, unique database user password.
- Cloudinary free plan limits: fine for a shop's product photos; check usage in the Cloudinary dashboard occasionally.

## 6. Handover checklist

Transfer ownership so the client is never locked out:

- [ ] **Domain** registered in the client's name/email, auto-renew on.
- [ ] **Vercel**: transfer the project to the client's Vercel account/team (Project → Settings → Advanced → Transfer), or add them as owner.
- [ ] **MongoDB Atlas**: invite the client as **Organization Owner**; keep yourself as member if you will maintain it.
- [ ] **Cloudinary**: account under the client's email (or invite them as Admin).
- [ ] **GitHub repository**: transfer to the client or add them as admin.
- [ ] **Rotate secrets** at handover: new `AUTH_SECRET` → redeploy. The owner then logs in with `ADMIN_PASSWORD` once and sets **their own password** (admin menu → Change password); from then on `ADMIN_PASSWORD` no longer works.
- [ ] **Owner password recovery:** if the owner forgets their password, change `ADMIN_PASSWORD` in Vercel and redeploy — the new value lets them in once more, and they set a fresh password of their own.
- [ ] Owner logs in, enables **Sound** and **Alerts** in the admin sidebar, and installs the site on their phone (browser menu → *Add to Home screen*).
- [ ] Fill **Store settings**: phone, WhatsApp, opening hours, delivery fee, minimum order; check the **Delivery area** pin and radius.
- [ ] Replace the illustrated category images with real photos (Admin → Categories) and add products.
- [ ] Give the client **docs/OWNER-GUIDE.md**.

## 7. What's built in for production

- Store pages are prerendered and served from Vercel's CDN; they refresh instantly when the admin saves changes or orders change stock.
- Security headers (no framing, HTTPS-only, location allowed only for this site), private pages never cached.
- Rate limits on login, sign-up, orders, coupons and address changes; accounts lock for 15 minutes after 5 wrong passwords.
- Server-side validation of every request, server-side prices, race-safe stock, Cash on Delivery only, 4 km delivery radius enforced on the server.
- Friendly error pages; errors are logged in **Vercel → Logs**.
- Sitemap, robots rules, structured data (GroceryStore with address and delivery area), installable app manifest and icons.
