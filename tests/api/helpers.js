// Shared setup for backend tests. Every test file gets its own fresh in-memory Postgres (PGlite)
// with the real schema + seed, so tests never touch .data/pglite or a Neon database.
import request from 'supertest'
import { openLocalDb, setupLocalDb } from '../../server/local-db.js'
import { createApp, addErrorHandler } from '../../server/app.js'

export const TEST_EMAIL_DOMAIN = 'pulsefit.test'

export async function setupTestApp() {
  delete process.env.DATABASE_URL // never fall through to a real database
  process.env.JWT_SECRET = 'vitest-only-secret-0123456789abcdefghijklmnopqrstuvwxyz'
  const { pg, sql } = await openLocalDb('memory')
  await setupLocalDb(pg)
  globalThis.__pulsefitLocalSql = sql
  const app = await createApp()
  addErrorHandler(app)

  return {
    app,
    sql,
    // Clean up after ourselves: remove every test user (cascades to workouts and sets).
    async cleanup() {
      await sql`DELETE FROM users WHERE email LIKE ${'%@' + TEST_EMAIL_DOMAIN}`
      await pg.close()
    },
  }
}

let counter = 0
export const uniqueEmail = (tag = 'user') => `vitest-${tag}-${Date.now()}-${counter++}@${TEST_EMAIL_DOMAIN}`

export const validSignup = (overrides = {}) => ({
  fullName: 'Test Runner',
  email: uniqueEmail(),
  password: 'Passw0rd!',
  weeklyGoalWorkouts: 4,
  weeklyGoalMinutes: 150,
  ...overrides,
})

// Signs up a new user and returns a supertest agent that keeps their session cookie.
export async function signUp(app, overrides = {}) {
  const agent = request.agent(app)
  const body = validSignup(overrides)
  const res = await agent.post('/api/auth/signup').send(body)
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`)
  return { agent, user: res.body.user, credentials: body }
}

// Inserts a completed workout directly, for streak/chart tests with fake dates.
export async function addCompletedWorkout(sql, userId, date, minutes = 30) {
  await sql`
    INSERT INTO workouts (user_id, name, workout_date, status, duration_minutes, started_at, completed_at)
    VALUES (${userId}, 'Seeded Workout', ${date}::date, 'completed', ${minutes}, now(), now())`
}

export const getCookies = (res) => [].concat(res.headers['set-cookie'] || [])
