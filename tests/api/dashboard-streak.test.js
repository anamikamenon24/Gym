// Streak, weekly chart and progress-ring numbers with fake dates (passed as ?date=, like the browser does).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setupTestApp, signUp, addCompletedWorkout } from './helpers.js'

let ctx
beforeAll(async () => (ctx = await setupTestApp()))
afterAll(() => ctx.cleanup())

const dashboard = async (agent, date) => {
  const res = await agent.get('/api/dashboard').query({ date })
  expect(res.status).toBe(200)
  return res.body
}

describe('streak', () => {
  it('is 0 with no workouts', async () => {
    const { agent } = await signUp(ctx.app)
    expect((await dashboard(agent, '2026-10-14')).streak).toBe(0)
    expect((await agent.get('/api/auth/me').query({ date: '2026-10-14' })).body.user.streak).toBe(0)
  })

  it('is 3 for three days in a row ending today', async () => {
    const { agent, user } = await signUp(ctx.app)
    for (const d of ['2026-10-12', '2026-10-13', '2026-10-14']) await addCompletedWorkout(ctx.sql, user.id, d)
    expect((await dashboard(agent, '2026-10-14')).streak).toBe(3)
  })

  it('resets after a missed day', async () => {
    const { agent, user } = await signUp(ctx.app)
    // 10, 11 trained · 12 missed · 13, 14 trained → streak 2
    for (const d of ['2026-10-10', '2026-10-11', '2026-10-13', '2026-10-14']) await addCompletedWorkout(ctx.sql, user.id, d)
    expect((await dashboard(agent, '2026-10-14')).streak).toBe(2)
    // Two days later with nothing done: streak is gone
    expect((await dashboard(agent, '2026-10-16')).streak).toBe(0)
  })

  it('counts today plus yesterday as 2', async () => {
    const { agent, user } = await signUp(ctx.app)
    for (const d of ['2026-10-13', '2026-10-14']) await addCompletedWorkout(ctx.sql, user.id, d)
    expect((await dashboard(agent, '2026-10-14')).streak).toBe(2)
  })

  it("keeps yesterday's streak alive until today is over", async () => {
    const { agent, user } = await signUp(ctx.app)
    for (const d of ['2026-10-12', '2026-10-13']) await addCompletedWorkout(ctx.sql, user.id, d)
    expect((await dashboard(agent, '2026-10-14')).streak).toBe(2)
  })

  it('ignores planned and in-progress workouts', async () => {
    const { agent, user } = await signUp(ctx.app)
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-13')
    await ctx.sql`INSERT INTO workouts (user_id, name, workout_date, status) VALUES (${user.id}, 'Planned', '2026-10-14', 'in_progress')`
    expect((await dashboard(agent, '2026-10-14')).streak).toBe(1)
  })

  it('counts across a month boundary', async () => {
    const { agent, user } = await signUp(ctx.app)
    for (const d of ['2026-09-29', '2026-09-30', '2026-10-01']) await addCompletedWorkout(ctx.sql, user.id, d)
    expect((await dashboard(agent, '2026-10-01')).streak).toBe(3)
  })
})

describe('weekly chart and progress rings', () => {
  // Wednesday 2026-10-14; week starts Monday 2026-10-12.
  let body
  beforeAll(async () => {
    const { agent, user } = await signUp(ctx.app, { weeklyGoalWorkouts: 4, weeklyGoalMinutes: 150 })
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-10', 60) // Sat, last week
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-12', 30) // Mon
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-13', 45) // Tue
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-14', 20) // Wed (today)
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-15', 99) // tomorrow — must not count
    body = await dashboard(agent, '2026-10-14')
  })

  it('returns exactly 7 days ending today, oldest first', () => {
    expect(body.activity.map((d) => d.date)).toEqual([
      '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14',
    ])
    expect(body.activity.map((d) => d.day)).toEqual(['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'])
  })

  it('puts active minutes on the right days', () => {
    expect(body.activity.map((d) => d.minutes)).toEqual([0, 0, 60, 0, 30, 45, 20])
  })

  it('counts only this week (Mon–today) for the rings', () => {
    expect(body.week.workouts).toEqual({ done: 3, target: 4 })
    expect(body.week.minutes).toEqual({ done: 95, target: 150 })
  })

  it('goals hit = 1 of 3 (only the 3-day streak is met)', () => {
    expect(body.streak).toBe(3)
    expect(body.week.goals.done).toBe(1)
    expect(body.week.goals.target).toBe(3)
    expect(body.week.goals.items.map((g) => g.hit)).toEqual([false, false, true])
  })

  it('never returns NaN or non-numeric ring values', () => {
    for (const ring of [body.week.workouts, body.week.minutes, body.week.goals]) {
      expect(Number.isFinite(ring.done)).toBe(true)
      expect(Number.isFinite(ring.target)).toBe(true)
      expect(ring.target).toBeGreaterThan(0)
    }
  })

  it('a brand-new user gets zeros, not NaN or nulls', async () => {
    const { agent } = await signUp(ctx.app)
    const fresh = await dashboard(agent, '2026-10-14')
    expect(fresh.activity).toHaveLength(7)
    expect(fresh.activity.every((d) => d.minutes === 0)).toBe(true)
    expect(fresh.week.workouts.done).toBe(0)
    expect(fresh.week.minutes.done).toBe(0)
    expect(fresh.week.goals.done).toBe(0)
    expect(fresh.todayWorkout).toBeNull()
  })

  it('goes over goal without breaking (ring display is clamped in the UI)', async () => {
    const { agent, user } = await signUp(ctx.app, { weeklyGoalWorkouts: 1, weeklyGoalMinutes: 10 })
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-12', 50)
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-13', 50)
    const over = await dashboard(agent, '2026-10-14')
    expect(over.week.workouts).toEqual({ done: 2, target: 1 })
    expect(over.week.minutes).toEqual({ done: 100, target: 10 })
    expect(over.week.goals.items.slice(0, 2).every((g) => g.hit)).toBe(true)
  })

  it('handles a Monday (week of one day) and a Sunday (full week)', async () => {
    const { agent, user } = await signUp(ctx.app)
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-11', 40) // Sunday
    await addCompletedWorkout(ctx.sql, user.id, '2026-10-12', 25) // Monday
    expect((await dashboard(agent, '2026-10-12')).week.minutes.done).toBe(25)
    expect((await dashboard(agent, '2026-10-11')).week.minutes.done).toBe(40)
  })
})
