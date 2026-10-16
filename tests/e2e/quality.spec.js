import AxeBuilder from '@axe-core/playwright'
import { test, expect, signUpViaApi, noHorizontalScroll } from './fixtures.js'

const PUBLIC_PAGES = ['/', '/login', '/signup', '/progress', '/classes', '/nope-404']
const PRIVATE_PAGES = ['/dashboard', '/library', '/workout', '/profile']

// Wait for animations / data so checks see the settled page.
async function settle(page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(700)
}

async function addAWorkout(page) {
  const { exercises } = await (await page.request.get('/api/exercises')).json()
  const plank = exercises.find((e) => e.name === 'Plank Hold')
  await page.request.post('/api/workouts', { data: { exerciseId: plank.id } })
}

test.describe('every page: no console errors, no horizontal scroll at 375px, no accessibility violations', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const path of PUBLIC_PAGES) {
    test(`public ${path}`, async ({ page }) => {
      await page.goto(path)
      await settle(page)
      expect(await noHorizontalScroll(page), 'no horizontal scroll').toBe(true)
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    })
  }

  for (const path of PRIVATE_PAGES) {
    test(`logged-in ${path}`, async ({ page }) => {
      await signUpViaApi(page, 'quality')
      await addAWorkout(page)
      await page.goto(path)
      await settle(page)
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      expect(await noHorizontalScroll(page), 'no horizontal scroll').toBe(true)
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    })
  }
})

test.describe('light mode: contrast and accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pulsefit-theme', 'light'))
  })

  for (const path of ['/', '/login', '/dashboard', '/library', '/workout', '/progress', '/classes', '/profile']) {
    test(`light ${path}`, async ({ page }) => {
      if (!['/', '/login', '/progress', '/classes'].includes(path)) {
        await signUpViaApi(page, 'light')
        await addAWorkout(page)
      }
      await page.goto(path)
      await settle(page)
      expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false)
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    })
  }
})

test.describe('labels', () => {
  test('every button and link has readable text or a label; every image has alt text', async ({ page }) => {
    await signUpViaApi(page, 'labels')
    await addAWorkout(page)
    for (const path of ['/', ...PRIVATE_PAGES, '/progress', '/classes']) {
      await page.goto(path)
      await settle(page)
      const unlabeled = await page.evaluate(() =>
        [...document.querySelectorAll('button, a[href], [role="button"], input, img, svg[role="img"]')]
          .filter((el) => {
            if (el.tagName === 'IMG') return !el.hasAttribute('alt')
            if (el.tagName === 'INPUT') return !(el.labels?.length || el.getAttribute('aria-label'))
            const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim()
            return !name
          })
          .map((el) => el.outerHTML.slice(0, 120)),
      )
      expect(unlabeled, `unlabelled controls on ${path}`).toEqual([])
    }
  })
})

test.describe('keyboard', () => {
  test('landing: Tab reaches "Start Your Workout" and Enter opens sign up', async ({ page, browserName }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-iphone', 'physical keyboard flow is a desktop concern')
    await page.goto('/')
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab')
      if ((await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Start Your Workout') break
    }
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('Start Your Workout')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('login form works with only the keyboard', async ({ page, consoleProblems }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-iphone', 'physical keyboard flow is a desktop concern')
    const user = await signUpViaApi(page, 'keyboard')
    await page.request.post('/api/auth/logout')
    await page.context().clearCookies()
    await page.goto('/login')
    // Tab until the email field is focused
    for (let i = 0; i < 10 && (await page.evaluate(() => document.activeElement?.type)) !== 'email'; i++) await page.keyboard.press('Tab')
    await page.keyboard.type(user.email)
    await page.keyboard.press('Tab')
    await page.keyboard.type(user.password)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('sidebar navigation is reachable by keyboard', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-iphone', 'sidebar is desktop-only')
    await signUpViaApi(page, 'kbnav')
    await page.goto('/dashboard')
    await settle(page)
    const library = page.getByRole('link', { name: 'Workout Library' })
    await library.focus()
    await expect(library).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/library$/)
  })
})

test.describe('friendly errors', () => {
  test('wrong password shows a friendly message', async ({ page, consoleProblems }) => {
    consoleProblems.allow(/status of 401/) // the browser always logs failed requests
    const user = await signUpViaApi(page, 'wrongpw')
    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password', { exact: true }).fill('not-the-password')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toContainText('Wrong email or password')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('API down: dashboard shows a friendly error with retry, not a crash', async ({ page, consoleProblems }) => {
    consoleProblems.allow(/status of 50\d/)
    await signUpViaApi(page, 'apidown')
    await page.route('**/api/dashboard*', (route) => route.fulfill({ status: 503, json: { error: "We can't reach the database right now. Please try again in a moment." } }))
    await page.goto('/dashboard')
    await expect(page.getByText("We can't reach the database right now")).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  test('empty states: new user sees "No workout yet today" on Dashboard and Live Workout', async ({ page }) => {
    await signUpViaApi(page, 'empty')
    await page.goto('/dashboard')
    await expect(page.getByText('No workout yet today.')).toBeVisible()
    await page.goto('/workout')
    await expect(page.getByText('No workout yet today.')).toBeVisible()
  })

  test('library search with no matches shows an empty state', async ({ page }) => {
    await signUpViaApi(page, 'search')
    await page.goto('/library')
    await page.getByLabel('Search exercises').fill('zzzz-nothing')
    await expect(page.getByText('No exercises found')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.getByTestId('exercise-card')).toHaveCount(30)
  })
})
