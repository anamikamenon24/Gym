import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { setupTestApp, signUp, addCompletedWorkout } from './helpers.js'

let ctx
beforeAll(async () => (ctx = await setupTestApp()))
afterAll(() => ctx.cleanup())

describe('GET /api/stats', () => {
  it('returns members, workouts completed and classes this week as numbers', async () => {
    const res = await request(ctx.app).get('/api/stats')
    expect(res.status).toBe(200)
    for (const key of ['members', 'workoutsCompleted', 'classesThisWeek']) {
      expect(typeof res.body[key]).toBe('number')
      expect(Number.isFinite(res.body[key])).toBe(true)
    }
    expect(res.body.classesThisWeek).toBe(10)
  })

  it('counts real members and completed workouts', async () => {
    const before = (await request(ctx.app).get('/api/stats')).body
    const { user } = await signUp(ctx.app)
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-01')
    const after = (await request(ctx.app).get('/api/stats')).body
    expect(after.members).toBe(before.members + 1)
    expect(after.workoutsCompleted).toBe(before.workoutsCompleted + 1)
  })

  it('is public (no login needed)', async () => {
    expect((await request(ctx.app).get('/api/stats')).status).toBe(200)
  })
})

describe('GET /api/exercises', () => {
  it('returns all 30 exercises with the fields the UI needs', async () => {
    const res = await request(ctx.app).get('/api/exercises')
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(30)
    for (const e of res.body.exercises) {
      expect(e).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        group: expect.stringMatching(/^(Chest|Back|Legs|Arms|Core|Cardio)$/),
        sets: expect.any(Number),
        reps: expect.any(String),
        difficulty: expect.stringMatching(/^(Beginner|Intermediate|Advanced)$/),
        rest: expect.any(Number),
        description: expect.any(String),
      })
    }
  })

  it.each(['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio'])('filters by %s (5 exercises)', async (group) => {
    const res = await request(ctx.app).get('/api/exercises').query({ group })
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(5)
    expect(res.body.exercises.every((e) => e.group === group)).toBe(true)
  })

  it('ignores an unknown group and returns everything', async () => {
    const res = await request(ctx.app).get('/api/exercises').query({ group: "Chest'; DROP TABLE exercises;--" })
    expect(res.body.exercises).toHaveLength(30)
  })
})
