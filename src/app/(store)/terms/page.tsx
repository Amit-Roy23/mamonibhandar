import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/store/legal-page'
import { SITE } from '@/lib/site'

export const metadata: Metadata = { title: 'Terms of Use' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="11 November 2026">
      <p>These terms apply when you use the {SITE.name} website or place an order with {SITE.legalName}. By creating an account or ordering, you agree to them.</p>
      <h2>Your account</h2>
      <ul>
        <li>Please give a correct name, mobile number and delivery address. You are responsible for keeping your password private.</li>
        <li>We may suspend accounts used for fake orders, abuse or misuse of offers.</li>
      </ul>
      <h2>Orders</h2>
      <ul>
        <li>An order is confirmed only when we accept it (status &quot;Confirmed&quot;). We may cancel an order if an item is unavailable, the price was shown incorrectly, or we cannot reach you or your address.</li>
        <li>Product photos are for illustration; packaging may vary. Prices include applicable taxes and are shown in Indian Rupees (₹).</li>
        <li>Quantities may be limited per order.</li>
      </ul>
      <h2>Delivery area</h2>
      <p>We deliver only to addresses within our delivery radius around the shop at {SITE.address.line1}, {SITE.address.city} (shown on the <Link href="/contact" className="font-semibold text-brand-700">Contact page</Link>). Delivery times are estimates. Delivery charges and minimum order value are shown at checkout.</p>
      <h2>Payment</h2>
      <p>We accept <b>Cash on Delivery only</b>. Please keep the exact amount ready if possible. We never ask for card details, OTPs or advance payment — report any such request to us.</p>
      <h2>Coupons and offers</h2>
      <p>Coupons have their own conditions (minimum order, expiry, usage limits) and cannot be exchanged for cash. We may change or end offers at any time.</p>
      <h2>Cancellations and returns</h2>
      <p>See our <Link href="/refund-policy" className="font-semibold text-brand-700">Cancellation &amp; Refund Policy</Link>.</p>
      <h2>Liability</h2>
      <p>We take care to describe products accurately and deliver them in good condition. Our responsibility for any order is limited to the value of that order. Please check items when they are delivered.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India. Any dispute will be subject to the courts having jurisdiction over Gomati district, Tripura.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-700">{SITE.email}</a>.</p>
    </LegalPage>
  )
}
