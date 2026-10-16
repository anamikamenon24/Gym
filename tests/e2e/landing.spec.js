import { test, expect, signUpViaApi } from './fixtures.js'

test.describe('Landing page', () => {
  test('shows PulseFit in the tab title, navbar, hero and footer', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/PulseFit/)
    await expect(page.locator('header').first()).toContainText('PulseFit')
    const hero = page.locator('main section').first()
    await expect(hero.getByRole('heading', { level: 1 })).toHaveText(/Train smarter\.\s*Get stronger\./)
    await expect(hero).toContainText('PulseFit')
    await expect(page.locator('footer')).toContainText('PulseFit')
  })

  test('has a favicon', async ({ page, request }) => {
    await page.goto('/')
    const href = await page.locator('link[rel="icon"]').getAttribute('href')
    const res = await request.get(href)
    expect(res.status()).toBe(200)
    expect(await res.text()).toContain('<svg')
  })

  test('counters animate up to the real numbers from /api/stats', async ({ page, request }) => {
    await page.goto('/')
    const label = page.getByText('Classes this week', { exact: true })
    const value = label.locator('xpath=preceding-sibling::p[1]')
    await label.scrollIntoViewIfNeeded()
    const seen = new Set()
    const end = Date.now() + 3500
    while (Date.now() < end) {
      const n = Number((await value.innerText()).replace(/[^\d]/g, ''))
      if (!Number.isNaN(n)) seen.add(n)
      await page.waitForTimeout(80)
    }
    const stats = await (await request.get('/api/stats')).json()
    expect([...seen].pop()).toBe(stats.classesThisWeek)
    expect(seen.size, `counter should pass through intermediate values, saw ${[...seen]}`).toBeGreaterThan(2)
  })

  test('"Start Your Workout" goes to sign up when logged out', async ({ page }) => {
    await page.goto('/')
    const buttons = page.getByRole('link', { name: 'Start Your Workout' })
    await expect(buttons).toHaveCount(2) // hero + bottom banner — both must go to sign up
    for (const href of await buttons.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) expect(href).toBe('/signup')
    await buttons.first().click()
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByRole('heading', { name: 'Start your journey' })).toBeVisible()
  })

  test('"Start Your Workout" goes to the Dashboard when logged in', async ({ page }) => {
    await signUpViaApi(page, 'start')
    await page.goto('/')
    await page.getByRole('link', { name: 'Start Your Workout' }).first().click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('navbar shows the name and a logout button when logged in', async ({ page }) => {
    await signUpViaApi(page, 'navbar', { fullName: 'Navbar Person' })
    await page.goto('/')
    const header = page.locator('header').first()
    await expect(header.getByRole('button', { name: 'Log out' })).toBeVisible()
    await expect(header.getByRole('link', { name: /Navbar/ })).toBeAttached()
    await header.getByRole('button', { name: 'Log out' }).click()
    await expect(header.getByRole('link', { name: 'Get started' })).toBeVisible()
  })

  test('unknown pages show the friendly 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByRole('heading', { name: 'This page skipped leg day' })).toBeVisible()
  })
})
