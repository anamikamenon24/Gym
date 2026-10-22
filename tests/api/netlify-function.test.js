// The Netlify Function adapter (netlify/functions/api.mjs) runs the same /api handlers.
// These tests call it exactly like Netlify does: with a web Request, expecting a web Response.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readdirSync } from 'node:fs'
import { setupTestApp, uniqueEmail } from './helpers.js'
import handler, { routes } from '../../netlify/functions/api.mjs'

const SITE = 'https://pulsefit-test.netlify.app'

let ctx
beforeAll(async () => (ctx = await setupTestApp()))
afterAll(() => ctx.cleanup())

const call = (path, { method = 'GET', body, cookie, base = SITE } = {}) =>
  handler(
    new Request(`${base}${path}`, {
      method,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )

const cookieHeader = (res) => res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')

describe('Netlify function adapter', () => {
  it('serves every route file in /api (none forgotten)', () => {
    const files = []
    const walk = (dir, prefix = '') => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.name.startsWith('_')) continue
        if (e.isDirectory()) walk(`${dir}/${e.name}`, `${prefix}${e.name}/`)
        else if (e.name.endsWith('.js')) files.push(prefix + e.name.replace(/\.js$/, ''))
      }
    }
    walk('api')
    expect(Object.keys(routes).sort()).toEqual(files.sort())
  })

  it('GET /api/stats returns JSON numbers', async () => {
    const res = await call('/api/stats')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    const body = await res.json()
    expect(body).toEqual({ members: expect.any(Number), workoutsCompleted: expect.any(Number), classesThisWeek: 10 })
  })

  it('also accepts the rewritten /.netlify/functions/api/... path', async () => {
    const res = await call('/.netlify/functions/api/exercises')
    expect(res.status).toBe(200)
    expect((await res.json()).exercises).toHaveLength(30)
  })

  it('passes query strings through (exercise filter)', async () => {
    const res = await call('/api/exercises?group=Legs')
    const { exercises } = await res.json()
    expect(exercises).toHaveLength(5)
    expect(exercises.every((e) => e.group === 'Legs')).toBe(true)
  })

  it('sign up → both cookies, marked Secure on https → session works for /me and the dashboard', async () => {
    const email = uniqueEmail('netlify')
    const signup = await call('/api/auth/signup', { method: 'POST', body: { fullName: 'Net Lify', email, password: 'Netlify123!' } })
    expect(signup.status).toBe(201)
    const cookies = signup.headers.getSetCookie()
    expect(cookies).toHaveLength(2)
    expect(cookies.every((c) => /; Secure/.test(c))).toBe(true)
    expect(cookies.find((c) => c.startsWith('pf_session='))).toMatch(/HttpOnly/)

    const cookie = cookieHeader(signup)
    const me = await call('/api/auth/me', { cookie })
    expect(me.status).toBe(200)
    expect((await me.json()).user.email).toBe(email)
    const dash = await call('/api/dashboard?date=2026-10-14', { cookie })
    expect(dash.status).toBe(200)
    expect((await dash.json()).activity).toHaveLength(7)
  })

  it('full workout flow through the adapter: add → tick → complete', async () => {
    const signup = await call('/api/auth/signup', { method: 'POST', body: { fullName: 'Flow Test', email: uniqueEmail('flow'), password: 'Flowflow1!' } })
    const cookie = cookieHeader(signup)
    const { exercises } = await (await call('/api/exercises')).json()
    const add = await call('/api/workouts?date=2026-10-14', { method: 'POST', cookie, body: { exerciseId: exercises[0].id } })
    expect(add.status).toBe(201)
    const { workout } = await add.json()
    for (const s of workout.exercises[0].sets) {
      expect((await call('/api/sets', { method: 'PATCH', cookie, body: { setId: s.id, completed: true } })).status).toBe(200)
    }
    const done = await call('/api/workouts', { method: 'PATCH', cookie, body: { workoutId: workout.id, action: 'complete' } })
    expect((await done.json()).workout.status).toBe('completed')
  })

  it('does not add Secure on plain http (local netlify dev)', async () => {
    const res = await call('/api/auth/signup', { method: 'POST', base: 'http://localhost:8888', body: { fullName: 'Local', email: uniqueEmail('http'), password: 'Localhost1!' } })
    expect(res.headers.getSetCookie().some((c) => /; Secure/.test(c))).toBe(false)
  })

  it('401 without a session, 404 for unknown routes, 400 for bad JSON, 405 for wrong method', async () => {
    expect((await call('/api/dashboard')).status).toBe(401)
    expect((await call('/api/nope')).status).toBe(404)
    expect((await call('/api/auth/login', { method: 'POST', body: '{broken' })).status).toBe(400)
    expect((await call('/api/auth/login')).status).toBe(405)
  })
})
