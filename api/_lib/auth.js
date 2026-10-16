import { SignJWT, jwtVerify } from 'jose'
import { HttpError } from './db.js'

const COOKIE = 'pf_session'
// Non-secret companion cookie the frontend can read, so it only calls /api/auth/me when a session
// might exist (avoids a 401 console error on every logged-out page view). Grants no access by itself.
const HINT = 'pf_hint'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const secret = () => {
  if (!process.env.JWT_SECRET) throw new HttpError(500, 'JWT_SECRET is not configured on the server.')
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

const parseCookies = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((p) => p.trim().split('='))
      .filter(([k]) => k)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]),
  )

const cookieAttrs = (maxAge, httpOnly = true) =>
  [`Path=/`, httpOnly ? 'HttpOnly' : null, `SameSite=Lax`, `Max-Age=${maxAge}`, process.env.NODE_ENV === 'production' ? 'Secure' : null]
    .filter(Boolean)
    .join('; ')

export async function setSession(res, userId) {
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())
  res.setHeader('Set-Cookie', [`${COOKIE}=${token}; ${cookieAttrs(MAX_AGE)}`, `${HINT}=1; ${cookieAttrs(MAX_AGE, false)}`])
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', [`${COOKIE}=; ${cookieAttrs(0)}`, `${HINT}=; ${cookieAttrs(0, false)}`])
}

// Returns the logged-in user id, or null.
export async function getUserId(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE]
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    const id = Number(payload.sub)
    return Number.isInteger(id) ? id : null
  } catch {
    return null
  }
}

export async function requireUserId(req) {
  const id = await getUserId(req)
  if (!id) throw new HttpError(401, 'Please log in to continue.')
  return id
}
