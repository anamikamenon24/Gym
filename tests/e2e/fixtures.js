// Shared Playwright fixtures: every test automatically fails on browser console errors/warnings
// or uncaught page errors, unless the test explicitly allows a specific message.
import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  consoleProblems: [
    async ({ page }, use) => {
      const problems = []
      const allowed = []
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`${msg.type()}: ${msg.text()}`)
      })
      page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`))
      await use({ allow: (re) => allowed.push(re), list: problems })
      const unexpected = problems.filter((p) => !allowed.some((re) => re.test(p)))
      expect(unexpected, 'browser console should have no errors or warnings').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

let n = 0
export const uniqueEmail = (tag) => `e2e-${tag}-${Date.now()}-${n++}@pulsefit.test`

// Fast sign-up through the API (shares cookies with the page), for tests that aren't about the sign-up UI.
export async function signUpViaApi(page, tag = 'user', overrides = {}) {
  const body = { fullName: 'E2E Tester', email: uniqueEmail(tag), password: 'E2ePassw0rd!', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 150, ...overrides }
  const res = await page.request.post('/api/auth/signup', { data: body })
  expect(res.status()).toBe(201)
  return body
}

export const visible = (locator) => locator.filter({ visible: true })

export async function noHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
}
