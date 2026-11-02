import nodemailer, { type Transporter } from 'nodemailer'
import { SITE, SITE_ADDRESS_ONE_LINE } from '../site'
import { formatINR } from '../format'
import { PAYMENT_LABEL, STATUS_LABEL, type Order } from '../types'

/**
 * Optional email notifications. Enabled only when SMTP_USER and SMTP_PASS are
 * set (for Gmail use an App Password). Failures are logged, never thrown.
 */

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
}

const storeInbox = () => process.env.ORDER_NOTIFY_EMAIL || SITE.email
const siteUrl = () => SITE.url.replace(/\/$/, '')

async function send(to: string | undefined, subject: string, html: string) {
  const t = getTransporter()
  if (!t || !to) return
  try {
    await t.sendMail({ from: process.env.MAIL_FROM || `${SITE.name} <${process.env.SMTP_USER}>`, to, subject, html })
  } catch (e) {
    console.error('Email send failed:', subject, e)
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function orderTable(o: Order) {
  const rows = o.items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.name)} <span style="color:#666">(${esc(i.unit)})</span> × ${i.qty}</td><td style="text-align:right">${formatINR(i.price * i.qty)}</td></tr>`)
    .join('')
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? 'font-weight:700' : 'color:#555'}">${label}</td><td style="text-align:right;${bold ? 'font-weight:700' : ''}">${value}</td></tr>`
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
    <tr><td colspan="2"><hr style="border:none;border-top:1px solid #eee"></td></tr>
    ${line('Subtotal', formatINR(o.subtotal))}
    ${o.discount ? line(`Discount${o.couponCode ? ` (${esc(o.couponCode)})` : ''}`, '−' + formatINR(o.discount)) : ''}
    ${line('Delivery', o.deliveryFee ? formatINR(o.deliveryFee) : 'FREE')}
    ${line('Total', formatINR(o.total), true)}</table>`
}

function layout(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1b2a1f">
    <div style="background:#1c6b34;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
      <div style="font-size:20px;font-weight:700">${SITE.name} · ${SITE.legalName}</div>
      <div style="opacity:.85;font-size:13px">${SITE.tagline}</div></div>
    <div style="border:1px solid #e6e6e6;border-top:none;padding:22px;border-radius:0 0 12px 12px">
      <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>${body}
      <p style="color:#777;font-size:12px;margin-top:24px">${esc(SITE_ADDRESS_ONE_LINE)} · ${SITE.email}</p></div></div>`
}

const addressHtml = (o: Order) =>
  esc([o.address.name, o.address.line1, o.address.line2, o.address.landmark, `${o.address.city}, ${o.address.district}`, `${o.address.state} ${o.address.pincode}`, `📞 ${o.address.phone}`].filter(Boolean).join('<br>'))
    .replace(/&lt;br&gt;/g, '<br>')

export async function sendNewOrderEmails(o: Order) {
  await Promise.all([
    send(
      storeInbox(),
      `🛒 New order ${o.id} · ${formatINR(o.total)}`,
      layout(`New order ${o.id}`, `<p><b>${esc(o.customerName)}</b> · ${esc(o.phone)}<br>${PAYMENT_LABEL[o.paymentMethod]}</p>
        ${orderTable(o)}<p style="margin-top:14px"><b>Deliver to</b><br>${addressHtml(o)}</p>
        ${o.note ? `<p><b>Note:</b> ${esc(o.note)}</p>` : ''}
        <p><a href="${siteUrl()}/admin/orders/${o.id}" style="color:#1c6b34">Open in admin panel →</a></p>`)
    ),
    send(
      o.email,
      `Order ${o.id} confirmed — ${SITE.name}`,
      layout(`Thank you, ${esc(o.customerName.split(' ')[0])}! 🎉`, `<p>We've received your order <b>${o.id}</b> and will start packing it soon.</p>
        ${orderTable(o)}<p>Payment: ${PAYMENT_LABEL[o.paymentMethod]}</p>
        <p><a href="${siteUrl()}/account/orders/${o.id}" style="color:#1c6b34">Track your order →</a></p>`)
    ),
  ])
}

export async function sendStatusEmail(o: Order) {
  await send(
    o.email,
    `Order ${o.id}: ${STATUS_LABEL[o.status]}`,
    layout(`Your order is ${STATUS_LABEL[o.status].toLowerCase()}`, `<p>Order <b>${o.id}</b> (${formatINR(o.total)}) is now <b>${STATUS_LABEL[o.status]}</b>.</p>
      ${o.status === 'CANCELLED' && o.cancelReason ? `<p>Reason: ${esc(o.cancelReason)}</p>` : ''}
      <p><a href="${siteUrl()}/account/orders/${o.id}" style="color:#1c6b34">View order →</a></p>`)
  )
}

export async function sendCustomerCancelledEmail(o: Order) {
  await send(storeInbox(), `❌ Order ${o.id} cancelled by customer`, layout(`Order ${o.id} was cancelled`, `<p>${esc(o.customerName)} cancelled this order.${o.cancelReason ? ` Reason: ${esc(o.cancelReason)}` : ''}</p>${orderTable(o)}`))
}
