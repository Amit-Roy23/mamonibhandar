import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

/** Throw from anywhere in a handler to return a clean JSON error. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export const badRequest = (msg: string) => new ApiError(400, msg)
export const notFound = (msg = 'Not found') => new ApiError(404, msg)

type Ctx<P> = { params: Promise<P> }

/**
 * Wrap a route handler: converts ApiError / ZodError / Mongo duplicate-key
 * errors into JSON responses and logs anything unexpected.
 */
export function route<P = Record<string, string>>(
  fn: (req: NextRequest, ctx: Ctx<P>) => Promise<Response>
) {
  return async (req: NextRequest, ctx: Ctx<P>): Promise<Response> => {
    try {
      return await fn(req, ctx)
    } catch (e: any) {
      if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status })
      if (e instanceof z.ZodError) {
        const first = e.issues[0]
        return NextResponse.json({ error: first?.message || 'Invalid request' }, { status: 400 })
      }
      if (e?.code === 11000) {
        const field = Object.keys(e.keyPattern || e.keyValue || {})[0]
        const msg =
          field === 'phone' ? 'This phone number is already registered'
          : field === 'email' ? 'This email is already registered'
          : field === 'name' ? 'That name is already in use'
          : 'This record already exists'
        return NextResponse.json({ error: msg }, { status: 409 })
      }
      console.error(`[${req.method} ${req.nextUrl.pathname}]`, e)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
  }
}

/** Parse and validate a JSON body with a zod schema. */
export async function body<T extends z.ZodType>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  const raw = await req.json().catch(() => {
    throw badRequest('Invalid JSON body')
  })
  return schema.parse(raw)
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}
