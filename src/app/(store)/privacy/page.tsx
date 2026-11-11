import type { Metadata } from 'next'
import { LegalPage } from '@/components/store/legal-page'
import { SITE } from '@/lib/site'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="11 November 2026">
      <p>{SITE.legalName} (&quot;{SITE.name}&quot;, &quot;we&quot;) runs this online store for customers around Udaipur, Gomati, Tripura. This policy explains what personal information we collect, why, and how we protect it, in line with India&apos;s Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account details</b> — your name, mobile number, optional email address and a password (stored only in encrypted, one-way hashed form; we can never see it).</li>
        <li><b>Delivery addresses</b> — the address you type and the map location you pin, so we can check you are inside our delivery area and find your door.</li>
        <li><b>Orders</b> — items, amounts, delivery notes, order status and payment status (Cash on Delivery).</li>
        <li><b>Your device&apos;s location</b> — only when you tap &quot;Use my current location&quot;. It is used to place the pin and is not tracked in the background.</li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>To create your account, deliver your orders and contact you about them (call, WhatsApp, or email if provided).</li>
        <li>To confirm that your address is within our delivery area.</li>
        <li>To keep the store secure, prevent misuse and keep business records required by law.</li>
      </ul>
      <p>We do <b>not</b> sell or rent your information, and we do not use it for third-party advertising.</p>
      <h2>Who can see it</h2>
      <ul>
        <li>Our staff and delivery person, only as needed to fulfil your order.</li>
        <li>Service providers that host the store for us: Vercel (website hosting), MongoDB Atlas (database), Cloudinary (product images) and, if enabled, our email provider. They process data only on our behalf.</li>
        <li>Government authorities, only where the law requires it.</li>
      </ul>
      <h2>Cookies and storage on your device</h2>
      <p>We use one essential cookie to keep you logged in. Your cart, wishlist and checked delivery location are saved in your browser&apos;s storage on your own device. We do not use advertising or tracking cookies.</p>
      <h2>How long we keep it</h2>
      <p>We keep your account while it is active. Order records are kept for as long as needed for accounting and legal purposes (generally up to 8 years). You can ask us to delete your account at any time; order records we must legally keep will be retained.</p>
      <h2>Your rights</h2>
      <p>You can view and update your name, phone, email and addresses from <b>My account</b>. To get a copy of your data, correct it, or delete your account, email us at <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-700">{SITE.email}</a>. We will respond within 30 days.</p>
      <h2>Security</h2>
      <p>The site uses HTTPS encryption, passwords are hashed, and access to the admin panel is limited to the store owner. No system is perfectly secure, but we take reasonable steps to protect your information.</p>
      <h2>Grievance officer</h2>
      <p>For any privacy concern or complaint, contact the store owner at {SITE.legalName}, {SITE.address.line1}, {SITE.address.city}, {SITE.address.district}, {SITE.address.state} {SITE.address.pincode}, or email {SITE.email}.</p>
      <h2>Changes</h2>
      <p>We may update this policy. The date at the top shows the latest version.</p>
    </LegalPage>
  )
}
