import { Types } from 'mongoose'
import { connectDB } from './mongodb'
import { OrderModel, UserModel, type UserDoc } from './models'
import { toUser } from './mappers'
import { ApiError } from './http'
import { ADMIN_EMAIL, envAdminPassword, hashPassword, isEnvAdminLogin, verifyPassword } from './auth'
import type { Address, User } from '../types'
import { getSettings } from './settings'
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from './rate-limit'
import { checkZone, formatKm, formatKmAway } from '../geo'

/** Addresses must be pinned and inside the delivery radius. */
async function assertDeliverable(a: { lat?: number; lng?: number }) {
  const s = await getSettings()
  const z = checkZone(a, s)
  if (z.ok) return
  if (z.reason === 'no-location') throw new ApiError(400, 'Please pin your delivery location on the map')
  throw new ApiError(
    400,
    `Sorry, this location is ${formatKmAway(z.km!, z.limitKm)} from our shop. We deliver within ${formatKm(z.limitKm)} of Mirza Bazaar, Udaipur.`
  )
}


const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function normalisePhone(p: string): string {
  const digits = p.replace(/\D/g, '')
  // store Indian mobiles as the last 10 digits (strip +91 / leading 0)
  return digits.length > 10 ? digits.slice(-10) : digits
}

export async function registerUser(i: { name: string; phone: string; email?: string; password: string }): Promise<UserDoc> {
  await connectDB()
  const phone = normalisePhone(i.phone)
  const email = i.email?.trim().toLowerCase() || undefined
  if (email && email === ADMIN_EMAIL) throw new ApiError(409, 'This email is reserved')
  if (await UserModel.exists({ phone })) throw new ApiError(409, 'This phone number is already registered. Please log in.')
  if (email && (await UserModel.exists({ email }))) throw new ApiError(409, 'This email is already registered. Please log in.')
  const doc = await UserModel.create({ name: i.name.trim(), phone, email, passwordHash: hashPassword(i.password), role: 'customer' })
  return doc.toObject() as UserDoc
}

/**
 * Owner login rules:
 * - until the owner sets their own password in the admin panel, only ADMIN_PASSWORD (Vercel) works;
 * - after that, only the owner's own password works;
 * - recovery: if ADMIN_PASSWORD in Vercel is changed later, the new Vercel password works again
 *   (and the owner can then set a fresh password of their own).
 */
async function authenticateOwner(password: string, ip: string): Promise<UserDoc> {
  await assertLoginAllowed('owner', ip)
  const owner = await UserModel.findOne({ email: ADMIN_EMAIL }).lean<UserDoc>()
  const envPw = envAdminPassword()
  const recovering = !!(owner?.ownPassword && envPw && owner.envPwHash && !verifyPassword(envPw, owner.envPwHash))
  const useEnv = !owner?.ownPassword || recovering

  if (useEnv ? isEnvAdminLogin(ADMIN_EMAIL, password) : verifyPassword(password, owner!.passwordHash)) {
    const admin = await UserModel.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $set: {
          role: 'admin',
          blocked: false,
          failedLogins: 0,
          lockUntil: null,
          // recovery login: back to the Vercel password until the owner sets a new one
          ...(recovering ? { ownPassword: false, passwordHash: hashPassword(password) } : {}),
        },
        ...(recovering ? { $inc: { tokenVersion: 1 }, $unset: { envPwHash: '' } } : {}),
        $setOnInsert: { name: 'Store Admin', email: ADMIN_EMAIL, ...(recovering ? {} : { passwordHash: hashPassword(password), tokenVersion: 0 }) },
      },
      { upsert: true, new: true }
    ).lean<UserDoc>()
    await clearLoginFailures('owner', ip)
    return admin!
  }
  await recordLoginFailure('owner', ip)
  await delay(400)
  throw new ApiError(401, 'Incorrect phone/email or password')
}

/**
 * Login with phone or email. After 5 wrong passwords for one account from one
 * device (IP), that device must wait until the 15-minute window ends.
 */
export async function authenticate(identifier: string, password: string, ip = 'unknown'): Promise<UserDoc> {
  await connectDB()
  const id = identifier.trim()

  if (id.toLowerCase() === ADMIN_EMAIL) return authenticateOwner(password, ip)

  const query = id.includes('@') ? { email: id.toLowerCase() } : { phone: normalisePhone(id) }
  const account = id.includes('@') ? id.toLowerCase() : normalisePhone(id)
  await assertLoginAllowed(account, ip)
  const user = await UserModel.findOne(query).lean<UserDoc>()
  if (!user) {
    await recordLoginFailure(account, ip)
    await delay(400)
    throw new ApiError(401, 'Incorrect phone/email or password')
  }
  if (!verifyPassword(password, user.passwordHash)) {
    await recordLoginFailure(account, ip)
    await delay(400)
    throw new ApiError(401, 'Incorrect phone/email or password')
  }
  if (user.blocked) throw new ApiError(403, 'This account has been disabled. Please contact the store.')
  await clearLoginFailures(account, ip)
  // clear the old account-wide lock fields left by earlier versions
  if (user.failedLogins || user.lockUntil) await UserModel.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lockUntil: null } })
  return user
}

export async function updateProfile(userId: Types.ObjectId, i: { name: string; phone?: string; email?: string }): Promise<User> {
  await connectDB()
  const set: Record<string, unknown> = { name: i.name.trim() }
  const unset: Record<string, ''> = {}
  if (i.phone !== undefined) {
    const phone = normalisePhone(i.phone)
    if (phone) {
      if (await UserModel.exists({ phone, _id: { $ne: userId } })) throw new ApiError(409, 'This phone number is already registered')
      set.phone = phone
    }
  }
  if (i.email !== undefined) {
    const email = i.email.trim().toLowerCase()
    if (email && email === ADMIN_EMAIL) throw new ApiError(409, 'This email is reserved')
    if (email) {
      if (await UserModel.exists({ email, _id: { $ne: userId } })) throw new ApiError(409, 'This email is already registered')
      set.email = email
    } else {
      unset.email = ''
    }
  }
  const res = await UserModel.findByIdAndUpdate(
    userId,
    { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { new: true, runValidators: true }
  ).lean<UserDoc>()
  return toUser(res!)
}

/** Changing the password logs out every other session (tokenVersion bump). */
export async function changePassword(user: UserDoc, current: string, next: string): Promise<UserDoc> {
  await connectDB()
  const isOwner = user.email === ADMIN_EMAIL
  // the owner's "current" password is the Vercel one until they have set their own
  const currentOk = isOwner && !user.ownPassword ? isEnvAdminLogin(ADMIN_EMAIL, current) : verifyPassword(current, user.passwordHash)
  if (!currentOk) throw new ApiError(400, 'Your current password is incorrect')
  if (user.role === 'admin' && next.length < 10) throw new ApiError(400, 'Admin passwords must be at least 10 characters')
  if (next === current) throw new ApiError(400, 'Choose a password different from the current one')
  const envPw = envAdminPassword()
  const res = await UserModel.findByIdAndUpdate(
    user._id,
    {
      $set: {
        passwordHash: hashPassword(next),
        failedLogins: 0,
        lockUntil: null,
        ...(isOwner ? { ownPassword: true, ...(envPw ? { envPwHash: hashPassword(envPw) } : {}) } : {}),
      },
      $inc: { tokenVersion: 1 },
    },
    { new: true }
  ).lean<UserDoc>()
  return res!
}

/* ------------------------------ addresses ------------------------------ */

export type AddressInput = Omit<Address, 'id'>
const MAX_ADDRESSES = 10

export async function addAddress(userId: Types.ObjectId, a: AddressInput): Promise<User> {
  await connectDB()
  await assertDeliverable(a)
  const user = await UserModel.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')
  if (user.addresses.length >= MAX_ADDRESSES) throw new ApiError(400, `You can save up to ${MAX_ADDRESSES} addresses`)
  const makeDefault = a.isDefault || user.addresses.length === 0
  if (makeDefault) user.addresses.forEach((x) => (x.isDefault = false))
  user.addresses.push({ ...a, isDefault: makeDefault } as any)
  await user.save()
  return toUser(user.toObject() as UserDoc)
}

export async function updateAddress(userId: Types.ObjectId, addressId: string, a: AddressInput): Promise<User> {
  await connectDB()
  await assertDeliverable(a)
  const user = await UserModel.findById(userId)
  const addr = user?.addresses.find((x) => String(x._id) === addressId)
  if (!user || !addr) throw new ApiError(404, 'Address not found')
  if (a.isDefault) user.addresses.forEach((x) => (x.isDefault = false))
  Object.assign(addr, { ...a, isDefault: a.isDefault || addr.isDefault })
  await user.save()
  return toUser(user.toObject() as UserDoc)
}

export async function deleteAddress(userId: Types.ObjectId, addressId: string): Promise<User> {
  await connectDB()
  const user = await UserModel.findById(userId)
  if (!user) throw new ApiError(404, 'User not found')
  const wasDefault = user.addresses.find((x) => String(x._id) === addressId)?.isDefault
  user.addresses = user.addresses.filter((x) => String(x._id) !== addressId) as any
  if (wasDefault && user.addresses[0]) user.addresses[0].isDefault = true
  await user.save()
  return toUser(user.toObject() as UserDoc)
}

/* ------------------------------ admin ------------------------------ */

export interface CustomerRow extends User {
  orderCount: number
  totalSpent: number
  lastOrderAt: string | null
}

export async function listCustomers(q?: string): Promise<CustomerRow[]> {
  await connectDB()
  const filter: Record<string, unknown> = {}
  if (q?.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }]
  }
  const users = await UserModel.find(filter).sort({ createdAt: -1 }).limit(1000).lean<UserDoc[]>()
  const stats = await OrderModel.aggregate<{ _id: Types.ObjectId; n: number; spent: number; last: Date }>([
    { $match: { userId: { $in: users.map((u) => u._id) } } },
    {
      $group: {
        _id: '$userId',
        n: { $sum: 1 },
        spent: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 0, '$total'] } },
        last: { $max: '$createdAt' },
      },
    },
  ])
  const byId = new Map(stats.map((s) => [String(s._id), s]))
  return users.map((u) => {
    const s = byId.get(String(u._id))
    return { ...toUser(u), orderCount: s?.n || 0, totalSpent: s?.spent || 0, lastOrderAt: s?.last ? new Date(s.last).toISOString() : null }
  })
}

/** Owner resets a customer's password (they call the shop); returns a one-time password to read out. */
export async function adminResetPassword(actor: UserDoc, id: string): Promise<string> {
  await connectDB()
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Customer not found')
  if (String(actor._id) === id) throw new ApiError(400, 'Change your own password from your profile')
  const target = await UserModel.findById(id).lean<UserDoc>()
  if (!target) throw new ApiError(404, 'Customer not found')
  if (target.email === ADMIN_EMAIL) throw new ApiError(400, 'The owner password is set in Vercel (ADMIN_PASSWORD)')
  // easy to read aloud: no 0/O, 1/l/I
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  const bytes = (await import('crypto')).randomBytes(8)
  const temp = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
  await UserModel.updateOne(
    { _id: id },
    { $set: { passwordHash: hashPassword(temp), failedLogins: 0, lockUntil: null }, $inc: { tokenVersion: 1 } }
  )
  return temp
}

export async function adminUpdateUser(actor: UserDoc, id: string, patch: { blocked?: boolean; role?: 'customer' | 'admin' }): Promise<User> {
  await connectDB()
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Customer not found')
  if (String(actor._id) === id) throw new ApiError(400, "You can't change your own account here")
  const target = await UserModel.findById(id).lean<UserDoc>()
  if (!target) throw new ApiError(404, 'Customer not found')
  if (target.email === ADMIN_EMAIL) throw new ApiError(400, 'The owner account cannot be changed')
  const update: Record<string, unknown> = { $set: { ...patch } }
  if (patch.blocked || patch.role) update.$inc = { tokenVersion: 1 } // force re-login
  const res = await UserModel.findByIdAndUpdate(id, update, { new: true }).lean<UserDoc>()
  return toUser(res!)
}
