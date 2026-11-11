import type { Metadata } from 'next'
import { LegalPage } from '@/components/store/legal-page'
import { SITE } from '@/lib/site'

export const metadata: Metadata = { title: 'Cancellation & Refund Policy' }

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Cancellation & Refund Policy" updated="11 November 2026">
      <p>Because {SITE.name} is Cash on Delivery only, you never pay before your groceries reach you. This policy explains how cancellations, returns and replacements work.</p>
      <h2>Cancelling an order</h2>
      <ul>
        <li>You can cancel from <b>My account → My orders</b> while the order is &quot;Placed&quot; or &quot;Confirmed&quot;.</li>
        <li>Once it is &quot;Packed&quot; or &quot;Out for delivery&quot;, please call the store. You may refuse the order at the door; repeated refusals may lead to account suspension.</li>
        <li>We may cancel an order if items are out of stock or the address cannot be reached. You will see the reason in your order.</li>
      </ul>
      <h2>Checking your order at delivery</h2>
      <p>Please check the items, quantities and expiry dates before paying. If something is damaged, missing, wrong or expired, tell the delivery person — you will not be charged for it.</p>
      <h2>Problems found after delivery</h2>
      <ul>
        <li>Report damaged, wrong or expired items on the <b>same day</b> (fresh produce, dairy and bread within <b>4 hours</b>) by calling the store or emailing {SITE.email} with your order number and a photo.</li>
        <li>After checking, we will replace the item on your next delivery or adjust its value against your next order. Where a cash refund is due, it is paid in cash by the store.</li>
      </ul>
      <h2>Items we cannot take back</h2>
      <ul>
        <li>Opened or used items, and personal-care or baby-care items with a broken seal — unless they were faulty or wrong.</li>
        <li>Fresh produce, dairy and bread after the reporting window above.</li>
      </ul>
      <h2>Coupons</h2>
      <p>If you cancel an order that used a coupon, the coupon use is returned automatically (where its limits allow).</p>
      <h2>Contact</h2>
      <p>{SITE.legalName}, {SITE.address.line1}, {SITE.address.city}, {SITE.address.state} {SITE.address.pincode} · <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-700">{SITE.email}</a></p>
    </LegalPage>
  )
}
