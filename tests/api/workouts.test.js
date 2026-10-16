import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setupTestApp, signUp } from './helpers.js'

const TODAY = '2026-10-14' // a Wednesday — fixed so results don't depend on the real clock

let ctx, exercises
beforeAll(async () => {
  ctx = await setupTestApp()
  exercises = (await ctx.sql`SELECT id, name, sets, rest_seconds FROM exercises ORDER BY id`)
})
afterAll(() => ctx.cleanup())

const byName = (name) => exercises.find((e) => e.name === name)

describe('workout lifecycle: create → add → start → tick/untick → complete', () => {
  let agent, workout

  beforeAll(async () => {
    ;({ agent } = await signUp(ctx.app))
  })

  it('has no workout before anything is added', async () => {
    const res = await agent.get('/api/workouts').query({ date: TODAY })
    expect(res.status).toBe(200)
    expect(res.body.workout).toBeNull()
  })

  it("adding the first exercise creates today's workout with one set row per prescribed set", async () => {
    const ex = byName('Tempo Push-Up')
    const res = await agent.post('/api/workouts').query({ date: TODAY }).send({ exerciseId: ex.id })
    expect(res.status).toBe(201)
    workout = res.body.workout
    expect(workout).toMatchObject({ date: TODAY, status: 'planned', name: 'Chest Session' })
    expect(workout.exercises).toHaveLength(1)
    expect(workout.exercises[0]).toMatchObject({ exerciseId: ex.id, rest: ex.rest_seconds })
    expect(workout.exercises[0].sets.map((s) => s.number)).toEqual([1, 2, 3])
    expect(workout.exercises[0].sets.every((s) => s.completed === false)).toBe(true)
  })

  it('adds a second exercise in order and renames the workout from its muscle groups', async () => {
    const res = await agent.post('/api/workouts').query({ date: TODAY }).send({ exerciseId: byName('Plank Hold').id })
    expect(res.status).toBe(201)
    workout = res.body.workout
    expect(workout.name).toBe('Chest & Core Session')
    expect(workout.exercises.map((e) => e.name)).toEqual(['Tempo Push-Up', 'Plank Hold'])
  })

  it('blocks adding the same exercise twice', async () => {
    const res = await agent.post('/api/workouts').query({ date: TODAY }).send({ exerciseId: byName('Plank Hold').id })
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already in today's workout/)
  })

  it.each([
    ['missing exerciseId', {}, 400],
    ['non-numeric exerciseId', { exerciseId: 'abc' }, 400],
    ['unknown exerciseId', { exerciseId: 999999 }, 404],
  ])('rejects %s', async (_, body, status) => {
    const res = await agent.post('/api/workouts').query({ date: TODAY }).send(body)
    expect(res.status).toBe(status)
  })

  it('ticking the first set starts the workout (in_progress + started_at)', async () => {
    const set = workout.exercises[0].sets[0]
    const res = await agent.patch('/api/sets').send({ setId: set.id, completed: true })
    expect(res.status).toBe(200)
    expect(res.body.set).toEqual({ id: set.id, completed: true })
    expect(res.body.startedAt).toBeTruthy()
    const w = (await agent.get('/api/workouts').query({ date: TODAY })).body.workout
    expect(w.status).toBe('in_progress')
    expect(w.startedAt).toBeTruthy()
    expect(w.exercises[0].sets[0].completed).toBe(true)
  })

  it('unticking a set saves it as not completed', async () => {
    const set = workout.exercises[0].sets[0]
    const res = await agent.patch('/api/sets').send({ setId: set.id, completed: false })
    expect(res.status).toBe(200)
    expect(res.body.set.completed).toBe(false)
    const w = (await agent.get('/api/workouts').query({ date: TODAY })).body.workout
    expect(w.exercises[0].sets[0].completed).toBe(false)
    expect(w.status).toBe('in_progress') // started stays started
  })

  it('rejects a set update without a valid setId', async () => {
    expect((await agent.patch('/api/sets').send({ completed: true })).status).toBe(400)
    expect((await agent.patch('/api/sets').send({ setId: 999999, completed: true })).status).toBe(404)
  })

  it('completes the workout and saves a whole-minute duration', async () => {
    for (const s of workout.exercises.flatMap((e) => e.sets)) {
      await agent.patch('/api/sets').send({ setId: s.id, completed: true }).expect(200)
    }
    const res = await agent.patch('/api/workouts').send({ workoutId: workout.id, action: 'complete' })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('completed')
    expect(Number.isInteger(res.body.workout.durationMinutes)).toBe(true)
    expect(res.body.workout.durationMinutes).toBeGreaterThanOrEqual(1)
    expect(res.body.workout.completedAt).toBeTruthy()
  })

  it('completing twice keeps the original duration', async () => {
    await ctx.sql`UPDATE workouts SET duration_minutes = 42 WHERE id = ${workout.id}`
    const res = await agent.patch('/api/workouts').send({ workoutId: workout.id, action: 'complete' })
    expect(res.body.workout.durationMinutes).toBe(42)
  })

  it('locks a finished workout: no ticking sets, no adding exercises', async () => {
    const set = workout.exercises[0].sets[0]
    expect((await agent.patch('/api/sets').send({ setId: set.id, completed: false })).status).toBe(404)
    const add = await agent.post('/api/workouts').query({ date: TODAY }).send({ exerciseId: byName('Jump Rope').id })
    expect(add.status).toBe(409)
  })

  it('rejects an unknown PATCH action', async () => {
    expect((await agent.patch('/api/workouts').send({ workoutId: workout.id, action: 'explode' })).status).toBe(400)
  })
})

describe('restart (reset) an in-progress workout', () => {
  it('clears ticked sets and returns the workout to planned', async () => {
    const { agent } = await signUp(ctx.app)
    const w = (await agent.post('/api/workouts').query({ date: TODAY }).send({ exerciseId: byName('Lat Pulldown').id })).body.workout
    await agent.patch('/api/sets').send({ setId: w.exercises[0].sets[0].id, completed: true }).expect(200)
    const res = await agent.patch('/api/workouts').send({ workoutId: w.id, action: 'reset' })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('planned')
    expect(res.body.workout.startedAt).toBeNull()
    expect(res.body.workout.exercises[0].sets.every((s) => !s.completed)).toBe(true)
  })
})

describe('dates', () => {
  it('keeps separate workouts per day for the same user', async () => {
    const { agent } = await signUp(ctx.app)
    await agent.post('/api/workouts').query({ date: '2026-10-13' }).send({ exerciseId: byName('Back Squat').id }).expect(201)
    await agent.post('/api/workouts').query({ date: '2026-10-14' }).send({ exerciseId: byName('Jump Rope').id }).expect(201)
    const mon = (await agent.get('/api/workouts').query({ date: '2026-10-13' })).body.workout
    const tue = (await agent.get('/api/workouts').query({ date: '2026-10-14' })).body.workout
    expect(mon.exercises.map((e) => e.name)).toEqual(['Back Squat'])
    expect(tue.exercises.map((e) => e.name)).toEqual(['Jump Rope'])
  })

  it('falls back to the server date for an invalid date parameter', async () => {
    const { agent } = await signUp(ctx.app)
    const res = await agent.get('/api/workouts').query({ date: "2026-99-99' OR 1=1" })
    expect(res.status).toBe(200)
  })
})
