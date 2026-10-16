import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { setupTestApp, signUp } from './helpers.js'

const TODAY = '2026-10-14'

let ctx, alice, bob, aliceWorkout
beforeAll(async () => {
  ctx = await setupTestApp()
  alice = await signUp(ctx.app, { fullName: 'Alice A' })
  bob = await signUp(ctx.app, { fullName: 'Bob B' })
  const [ex] = await ctx.sql`SELECT id FROM exercises WHERE name = 'Back Squat'`
  aliceWorkout = (await alice.agent.post('/api/workouts').query({ date: TODAY }).send({ exerciseId: ex.id })).body.workout
})
afterAll(() => ctx.cleanup())

describe('protected routes need a login', () => {
  it.each([
    ['GET', '/api/dashboard'],
    ['GET', '/api/workouts'],
    ['POST', '/api/workouts'],
    ['PATCH', '/api/workouts'],
    ['PATCH', '/api/sets'],
    ['GET', '/api/auth/me'],
  ])('%s %s → 401 without a session', async (method, path) => {
    const res = await request(ctx.app)[method.toLowerCase()](path).send({ exerciseId: 1, setId: 1, workoutId: 1, action: 'complete' })
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/log in/i)
  })
})

describe("user A cannot see or change user B's data", () => {
  it("Bob does not see Alice's workout", async () => {
    const res = await bob.agent.get('/api/workouts').query({ date: TODAY })
    expect(res.body.workout).toBeNull()
    const dash = await bob.agent.get('/api/dashboard').query({ date: TODAY })
    expect(dash.body.todayWorkout).toBeNull()
    expect(dash.body.user.email).toBe(bob.credentials.email)
  })

  it("Bob cannot tick or untick Alice's sets", async () => {
    const setId = aliceWorkout.exercises[0].sets[0].id
    const res = await bob.agent.patch('/api/sets').send({ setId, completed: true })
    expect(res.status).toBe(404)
    const [row] = await ctx.sql`SELECT completed FROM workout_sets WHERE id = ${setId}`
    expect(row.completed).toBe(false)
  })

  it("Bob cannot complete or reset Alice's workout", async () => {
    expect((await bob.agent.patch('/api/workouts').send({ workoutId: aliceWorkout.id, action: 'complete' })).status).toBe(404)
    expect((await bob.agent.patch('/api/workouts').send({ workoutId: aliceWorkout.id, action: 'reset' })).status).toBe(404)
    const [row] = await ctx.sql`SELECT status FROM workouts WHERE id = ${aliceWorkout.id}`
    expect(row.status).toBe('planned')
  })

  it("Bob adding exercises only ever touches Bob's own workout", async () => {
    const [ex] = await ctx.sql`SELECT id FROM exercises WHERE name = 'Jump Rope'`
    const res = await bob.agent.post('/api/workouts').query({ date: TODAY }).send({ exerciseId: ex.id, workoutId: aliceWorkout.id, userId: alice.user.id })
    expect(res.status).toBe(201)
    expect(res.body.workout.id).not.toBe(aliceWorkout.id)
    const aliceNow = (await alice.agent.get('/api/workouts').query({ date: TODAY })).body.workout
    expect(aliceNow.exercises.map((e) => e.name)).toEqual(['Back Squat'])
  })

  it("Alice's dashboard is unaffected by Bob's activity", async () => {
    const dash = await alice.agent.get('/api/dashboard').query({ date: TODAY })
    expect(dash.body.user.email).toBe(alice.credentials.email)
    expect(dash.body.todayWorkout.id).toBe(aliceWorkout.id)
  })

  it('a session cookie signed with a different secret is rejected', async () => {
    const { SignJWT } = await import('jose')
    const forged = await new SignJWT({ sub: String(alice.user.id) })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('attacker-secret'))
    const res = await request(ctx.app).get('/api/workouts').set('Cookie', `pf_session=${forged}`)
    expect(res.status).toBe(401)
  })
})
