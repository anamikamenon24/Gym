import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { setupTestApp, signUp } from './helpers.js'
import { _resetSecretCache } from '../../api/_lib/auth.js'

let ctx
beforeAll(async () => (ctx = await setupTestApp()))
afterAll(async () => {
  process.env.JWT_SECRET = 'vitest-only-secret-0123456789abcdefghijklmnopqrstuvwxyz'
  _resetSecretCache()
  await ctx.cleanup()
})

describe('JWT secret without JWT_SECRET (zero-config deploys)', () => {
  it('generates one strong secret, stores it in the database and keeps sessions working', async () => {
    delete process.env.JWT_SECRET
    _resetSecretCache()
    const { agent } = await signUp(ctx.app)
    const [row] = await ctx.sql`SELECT value FROM app_settings WHERE key = 'jwt_secret'`
    expect(row.value.length).toBeGreaterThanOrEqual(60)
    expect((await agent.get('/api/auth/me')).status).toBe(200)

    // A "cold start" (cache cleared) reuses the same stored secret, so existing sessions stay valid
    _resetSecretCache()
    expect((await agent.get('/api/auth/me')).status).toBe(200)
    const rows = await ctx.sql`SELECT count(*)::int AS n FROM app_settings WHERE key = 'jwt_secret'`
    expect(rows[0].n).toBe(1)
  })

  it('JWT_SECRET in the environment takes priority', async () => {
    process.env.JWT_SECRET = 'env-secret-for-this-test-0123456789abcdefghijkl'
    _resetSecretCache()
    const { agent } = await signUp(ctx.app)
    expect((await agent.get('/api/auth/me')).status).toBe(200)
    // Switching back to the DB secret invalidates env-signed sessions (proves env was used)
    delete process.env.JWT_SECRET
    _resetSecretCache()
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })
})

describe('classes this week roll forward', () => {
  it("copies the latest week's timetable when the current week is empty", async () => {
    process.env.JWT_SECRET = 'vitest-only-secret-0123456789abcdefghijklmnopqrstuvwxyz'
    // Pretend the seed ran last week: move every class back 7 days
    await ctx.sql`UPDATE classes SET start_time = start_time - interval '7 days'`
    const before = await ctx.sql`SELECT count(*)::int AS n FROM classes`
    const res = await request(ctx.app).get('/api/stats')
    expect(res.body.classesThisWeek).toBe(10)
    const after = await ctx.sql`SELECT count(*)::int AS n FROM classes`
    expect(after[0].n).toBe(before[0].n + 10)
    // Running again does not duplicate
    await request(ctx.app).get('/api/stats')
    expect((await ctx.sql`SELECT count(*)::int AS n FROM classes`)[0].n).toBe(after[0].n)
  })
})
