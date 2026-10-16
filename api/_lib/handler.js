import { HttpError } from './db.js'

const DB_ERROR_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN'])

const isDbUnreachable = (err) =>
  DB_ERROR_CODES.has(err?.code) ||
  DB_ERROR_CODES.has(err?.cause?.code) ||
  /fetch failed|getaddrinfo|ECONNREFUSED|Error connecting to database|password authentication failed|endpoint .* (could not be found|is disabled)/i.test(
    `${err?.message} ${err?.cause?.message ?? ''}`,
  )

/**
 * Wraps a Vercel-style handler with method routing and friendly JSON errors.
 * Usage: export default route({ GET: async (req, res) => ..., POST: ... })
 */
export function route(methods) {
  return async function handler(req, res) {
    const fn = methods[req.method]
    if (!fn) {
      res.setHeader('Allow', Object.keys(methods).join(', '))
      return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
    try {
      if (typeof req.body === 'string' && req.body) req.body = JSON.parse(req.body)
      req.body ??= {}
      await fn(req, res)
    } catch (err) {
      if (err instanceof HttpError) return res.status(err.status).json({ error: err.message })
      if (isDbUnreachable(err)) {
        console.error('[api] database unreachable:', err.message)
        return res.status(503).json({ error: "We can't reach the database right now. Please try again in a moment." })
      }
      console.error('[api] unexpected error:', err)
      return res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
    }
  }
}

export const bad = (message) => {
  throw new HttpError(400, message)
}

// Accepts the client's local date (YYYY-MM-DD) so "today" matches the user's timezone.
export function localDate(req) {
  const d = req.query?.date || req.body?.date
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d))) return d
  return new Date().toISOString().slice(0, 10)
}
