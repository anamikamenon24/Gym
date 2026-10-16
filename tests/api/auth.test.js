import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { setupTestApp, signUp, validSignup, getCookies } from './helpers.js'

let ctx
beforeAll(async () => (ctx = await setupTestApp()))
afterAll(() => ctx.cleanup())

describe('POST /api/auth/signup', () => {
  it('creates an account, returns the user and sets an httpOnly session cookie', async () => {
    const body = validSignup({ fullName: 'Signup Tester' })
    const res = await request(ctx.app).post('/api/auth/signup').send(body)
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ email: body.email, fullName: 'Signup Tester', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 150 })
    expect(res.body.user).not.toHaveProperty('password_hash')
    const session = getCookies(res).find((c) => c.startsWith('pf_session='))
    expect(session).toMatch(/HttpOnly/i)
    expect(session).toMatch(/SameSite=Lax/i)
    // The readable hint cookie carries no token
    const hint = getCookies(res).find((c) => c.startsWith('pf_hint='))
    expect(hint).toMatch(/^pf_hint=1;/)
    expect(hint).not.toMatch(/HttpOnly/i)
  })

  it('the hint cookie alone grants no access', async () => {
    const res = await request(ctx.app).get('/api/dashboard').set('Cookie', 'pf_hint=1')
    expect(res.status).toBe(401)
  })

  it('marks cookies Secure in production', async () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      const res = await request(ctx.app).post('/api/auth/signup').send(validSignup())
      expect(getCookies(res).every((c) => /; Secure/.test(c))).toBe(true)
    } finally {
      process.env.NODE_ENV = prev
    }
  })

  it('stores a bcrypt hash, never the plain password', async () => {
    const body = validSignup()
    await request(ctx.app).post('/api/auth/signup').send(body)
    const [row] = await ctx.sql`SELECT password_hash FROM users WHERE email = ${body.email}`
    expect(row.password_hash).not.toBe(body.password)
    expect(row.password_hash).toMatch(/^\$2[aby]\$10\$/)
  })

  it('blocks a duplicate email (case-insensitive)', async () => {
    const body = validSignup()
    await request(ctx.app).post('/api/auth/signup').send(body).expect(201)
    const res = await request(ctx.app).post('/api/auth/signup').send({ ...body, email: body.email.toUpperCase() })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already exists/i)
  })

  it.each([
    ['empty password', { password: '' }, /at least 8/],
    ['short password', { password: 'abc123' }, /at least 8/],
    ['whitespace-only password', { password: '         ' }, /at least 8/],
    ['missing name', { fullName: '  ' }, /name/i],
    ['bad email', { email: 'not-an-email' }, /email/i],
    ['weekly workouts out of range', { weeklyGoalWorkouts: 0 }, /workouts/i],
    ['weekly minutes out of range', { weeklyGoalMinutes: 5 }, /minutes/i],
  ])('rejects %s with 400', async (_, override, message) => {
    const res = await request(ctx.app).post('/api/auth/signup').send(validSignup(override))
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(message)
  })
})

describe('POST /api/auth/login + logout', () => {
  it('logs in with the right password', async () => {
    const { credentials } = await signUp(ctx.app)
    const res = await request(ctx.app).post('/api/auth/login').send({ email: credentials.email, password: credentials.password })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(credentials.email)
    expect(getCookies(res).some((c) => c.startsWith('pf_session='))).toBe(true)
  })

  it('ignores stray spaces around email and password', async () => {
    const { credentials } = await signUp(ctx.app)
    const res = await request(ctx.app)
      .post('/api/auth/login')
      .send({ email: `  ${credentials.email.toUpperCase()} `, password: ` ${credentials.password} ` })
    expect(res.status).toBe(200)
  })

  it('fails with the wrong password or an unknown email (same message, no user enumeration)', async () => {
    const { credentials } = await signUp(ctx.app)
    const wrong = await request(ctx.app).post('/api/auth/login').send({ email: credentials.email, password: 'nope-nope' })
    const unknown = await request(ctx.app).post('/api/auth/login').send({ email: 'ghost@pulsefit.test', password: 'whatever1' })
    expect(wrong.status).toBe(401)
    expect(unknown.status).toBe(401)
    expect(wrong.body.error).toBe(unknown.body.error)
    expect(getCookies(wrong).some((c) => c.startsWith('pf_session='))).toBe(false)
  })

  it('logout clears the session cookie', async () => {
    const { agent } = await signUp(ctx.app)
    await agent.get('/api/auth/me').expect(200)
    const res = await agent.post('/api/auth/logout')
    expect(res.status).toBe(200)
    const session = getCookies(res).find((c) => c.startsWith('pf_session='))
    expect(session).toMatch(/pf_session=;/)
    expect(session).toMatch(/Max-Age=0/)
    expect(getCookies(res).find((c) => c.startsWith('pf_hint='))).toMatch(/Max-Age=0/)
    await agent.get('/api/auth/me').expect(401)
    await agent.get('/api/dashboard').expect(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns the logged-in user with their streak', async () => {
    const { agent, credentials } = await signUp(ctx.app, { fullName: 'Me Tester' })
    const res = await agent.get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ email: credentials.email, fullName: 'Me Tester', streak: 0 })
  })

  it('returns 401 when logged out', async () => {
    const res = await request(ctx.app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 for a forged or tampered session cookie', async () => {
    const res = await request(ctx.app).get('/api/auth/me').set('Cookie', 'pf_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.forged')
    expect(res.status).toBe(401)
  })

  it('returns 401 if the user was deleted after logging in', async () => {
    const { agent, user } = await signUp(ctx.app)
    await ctx.sql`DELETE FROM users WHERE id = ${user.id}`
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })
})

describe('method and body handling', () => {
  it('rejects the wrong HTTP method with 405', async () => {
    expect((await request(ctx.app).get('/api/auth/login')).status).toBe(405)
  })

  it('rejects malformed JSON with 400', async () => {
    const res = await request(ctx.app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad json')
    expect(res.status).toBe(400)
  })
})
