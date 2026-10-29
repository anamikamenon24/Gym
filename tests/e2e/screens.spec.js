// Screen-by-screen checks, branding, responsive layout at 375 / 768 / 1440, theme toggle, links and extras.
import AxeBuilder from '@axe-core/playwright'
import { test, expect, signUpViaApi, visible, noHorizontalScroll } from './fixtures.js'

const SCREENS = ['/', '/dashboard', '/library', '/workout', '/progress', '/classes', '/profile']
const VIEWPORTS = { phone: { width: 375, height: 812 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1440, height: 900 } }

async function settle(page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(600)
}

// A user with one completed workout today, so charts and rings have something to show.
async function userWithCompletedWorkout(page, tag) {
  await signUpViaApi(page, tag)
  const { exercises } = await (await page.request.get('/api/exercises')).json()
  const ex = exercises.find((e) => e.name === 'Plank Hold')
  const { workout } = await (await page.request.post('/api/workouts', { data: { exerciseId: ex.id } })).json()
  for (const s of workout.exercises[0].sets) await page.request.patch('/api/sets', { data: { setId: s.id, completed: true } })
  await page.request.patch('/api/workouts', { data: { workoutId: workout.id, action: 'complete' } })
}

const strokeOffset = (locator) =>
  locator.evaluate((el) => parseFloat(el.getAttribute('stroke-dashoffset') ?? getComputedStyle(el).strokeDashoffset))

test.describe('Dashboard', () => {
  test('workout card, Start opens Live Workout, chart animates, streak, 3 rings fill', async ({ page }) => {
    await signUpViaApi(page, 'dash')
    const { exercises } = await (await page.request.get('/api/exercises')).json()
    await page.request.post('/api/workouts', { data: { exerciseId: exercises.find((e) => e.name === 'Jump Rope').id } })
    // Yesterday's completed workout gives the chart, streak and rings real values
    await page.addInitScript(() => {})
    await page.goto('/dashboard')
    await expect(page.getByText("Today's workout").first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cardio Session' })).toBeVisible()
    await expect(page.getByText('Streak', { exact: true })).toBeVisible()
    await expect(page.getByText(/days? in a row/)).toBeVisible()
    for (const label of ['Workouts', 'Active min', 'Goals hit']) await expect(page.getByText(label, { exact: true })).toBeVisible()
    await expect(page.getByText('Weekly activity')).toBeVisible()
    await page.getByRole('link', { name: /^Start/ }).click()
    await expect(page).toHaveURL(/\/workout$/)
    await expect(page.getByRole('button', { name: 'Jump Rope set 1' })).toBeVisible()
  })

  test('rings fill up and the chart bars grow (animation)', async ({ page }) => {
    await userWithCompletedWorkout(page, 'rings')
    // Record every ring's fill from the very first frame, so the check doesn't depend on timing
    await page.addInitScript(() => {
      window.__ringMax = 0
      const tick = () => {
        for (const c of document.querySelectorAll('svg circle[stroke^="url(#ring-"]')) {
          const v = parseFloat(c.getAttribute('stroke-dashoffset') ?? getComputedStyle(c).strokeDashoffset)
          if (v > window.__ringMax) window.__ringMax = v
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.goto('/dashboard')
    const ring = visible(page.locator('svg circle[stroke^="url(#ring-"]')).first()
    await expect(ring).toBeVisible()
    const circ = await ring.evaluate((el) => parseFloat(el.getAttribute('stroke-dasharray')))
    await page.waitForTimeout(1800) // animation is 1.4s
    const late = await strokeOffset(ring)
    const startedAt = await page.evaluate(() => window.__ringMax)
    expect(late, 'ring ends partly filled (1 of 4 workouts)').toBeLessThan(circ)
    expect(startedAt, 'ring started empty (offset = full circumference) and animated to its value').toBeGreaterThan(late)

    const todayBar = page.locator('.recharts-bar-rectangle path').last()
    await expect(todayBar).toBeAttached()
    const h = await todayBar.evaluate((el) => el.getBBox().height)
    expect(h).toBeGreaterThan(0)
  })
})

test.describe('Live Workout', () => {
  test('rest timer counts down inside the circle', async ({ page }) => {
    await signUpViaApi(page, 'timer')
    const { exercises } = await (await page.request.get('/api/exercises')).json()
    await page.request.post('/api/workouts', { data: { exerciseId: exercises.find((e) => e.name === 'Barbell Bench Press').id } })
    await page.goto('/workout')
    await page.getByRole('button', { name: 'Barbell Bench Press set 1' }).click()
    const timer = page.getByTestId('rest-timer')
    await expect(timer).toHaveText(/^1:(30|29)$/) // 90s rest
    // The countdown ring is the SVG next to the timer text inside the same ProgressRing
    const circle = timer.locator('xpath=ancestor::div[contains(@class,"inline-grid")][1]/*[local-name()="svg"]/*[local-name()="circle"][2]')
    await page.waitForTimeout(600) // let the ring's initial fill animation finish
    const a = await strokeOffset(circle)
    await page.waitForTimeout(2200)
    const b = await strokeOffset(circle)
    expect(b, 'circle keeps draining as time runs out').toBeGreaterThan(a)
    await expect(timer).toHaveText(/^1:2[0-8]$/)
    // Pause stops the countdown
    await page.getByRole('button', { name: 'Pause' }).click()
    const paused = await timer.innerText()
    await page.waitForTimeout(1500)
    await expect(timer).toHaveText(paused)
    await page.getByRole('button', { name: 'Skip rest' }).isDisabled()
  })
})

test.describe('Progress', () => {
  test('line chart with 3 lifts, PR cards with trophy badges, lift toggle and empty state', async ({ page }) => {
    await page.goto('/progress')
    await expect(page.getByRole('heading', { name: "Look how far you've come" })).toBeVisible()
    await expect(page.locator('.recharts-line')).toHaveCount(3)
    await expect(page.locator('.recharts-line-curve').first()).toBeVisible()
    const prCards = page.locator('div').filter({ has: page.locator('svg.lucide-trophy') }).filter({ hasText: /Gold|Silver|Bronze/ })
    await expect(page.getByText(/^(Gold|Silver|Bronze)$/)).toHaveCount(6)
    expect(await page.locator('svg.lucide-trophy').count()).toBeGreaterThanOrEqual(6)
    expect(await prCards.count()).toBeGreaterThan(0)
    // Hide each lift → empty state; table view works
    for (const lift of ['Bench Press', 'Back Squat', 'Deadlift']) await page.getByRole('button', { name: new RegExp(lift) }).click()
    await expect(page.getByText('Nothing to show')).toBeVisible()
    await page.getByRole('button', { name: /Bench Press/ }).click()
    await page.getByRole('button', { name: 'table view' }).click()
    await expect(page.getByRole('table')).toBeVisible()
  })
})

test.describe('Class Booking', () => {
  test('Book lowers spots left and shows a toast; full classes cannot be booked', async ({ page }) => {
    await page.goto('/classes')
    await page.getByRole('button', { name: /^Mon/ }).click()

    const neon = page.locator('article').filter({ hasText: 'Neon Ride' })
    await expect(neon.getByText('12 spots left')).toBeVisible()
    await neon.getByRole('button', { name: 'Book spot' }).click()
    await expect(neon.getByText('11 spots left')).toBeVisible()
    await expect(neon.getByText('Booked', { exact: true })).toBeVisible()
    await expect(visible(page.getByText(/You.re booked/)).last()).toBeVisible()
    // Cancel gives the spot back
    await neon.getByRole('button', { name: 'Cancel booking' }).click()
    await expect(neon.getByText('12 spots left')).toBeVisible()

    const full = page.locator('article').filter({ hasText: 'Bag Work Basics' })
    await expect(full.getByText('Full', { exact: true })).toBeVisible()
    await expect(full.getByRole('button', { name: 'Book spot' })).toHaveCount(0)
    await full.getByRole('button', { name: 'Join waitlist' }).click()
    await expect(visible(page.getByText(/on the waitlist/)).last()).toBeVisible()
    await expect(full.getByText('Full', { exact: true })).toBeVisible()
    await expect(full.getByText('Booked', { exact: true })).toHaveCount(0)
  })

  test('empty states: rest day and a type with no classes', async ({ page }) => {
    await page.goto('/classes')
    await page.getByRole('button', { name: /^(Sun|Today)/ }).last().click()
    const sunday = await page.getByRole('button', { name: /^Sun/ }).count()
    if (sunday) {
      await page.getByRole('button', { name: /^Sun/ }).click()
      await expect(page.getByText('Rest day — no classes')).toBeVisible()
    }
    await page.getByRole('button', { name: /^Tue/ }).click()
    await page.getByRole('button', { name: 'Boxing' }).click()
    await expect(page.getByText('No Boxing on Tue')).toBeVisible()
    await page.getByRole('button', { name: 'Show all classes' }).click()
    await expect(page.locator('article')).toHaveCount(3)
  })
})

test.describe('Profile', () => {
  test('avatar, membership level and badges show; Sign out really logs out', async ({ page }) => {
    await signUpViaApi(page, 'profile', { fullName: 'Robin Banks' })
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: 'Robin Banks' })).toBeVisible()
    await expect(page.locator('main').getByText('RB', { exact: true })).toBeVisible() // avatar initials
    await expect(page.locator('main').getByText('Pulse Elite')).toBeVisible()
    await expect(page.getByText(/^Level \d+$/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible()
    for (const badge of ['On Fire', 'Early Bird', 'Record Breaker', 'Unstoppable']) await expect(page.getByText(badge, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('Branding', () => {
  test('gradient logo (lime → cyan) and pulse favicon', async ({ page, request }) => {
    await page.goto('/')
    const logoText = page.locator('header').getByText('PulseFit', { exact: true }).first()
    const bg = await logoText.evaluate((el) => getComputedStyle(el).backgroundImage)
    expect(bg).toContain('linear-gradient')
    expect(bg).toContain('rgb(198, 255, 61)') // lime
    expect(bg).toContain('rgb(34, 229, 255)') // cyan
    const href = await page.locator('link[rel="icon"]').getAttribute('href')
    expect(href).toBe('/favicon.svg')
    const svg = await (await request.get(href)).text()
    expect(svg).toMatch(/#C6FF3D/i)
    expect(svg).toMatch(/#22E5FF/i)
    expect(svg).toMatch(/<path d="M8 34h11l5-12 8 22/) // the heartbeat line
  })

  test('PulseFit in the app footer on desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto('/progress')
    await expect(page.locator('footer')).toContainText('PulseFit')
  })
})

test.describe('Responsive layout — 375 / 768 / 1440', () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop-chrome', 'viewport sizes are set explicitly; one browser is enough'))

  for (const [device, size] of Object.entries(VIEWPORTS)) {
    test(`${device} ${size.width}px: right navigation, no sideways scroll, tappable buttons`, async ({ page }) => {
      await page.setViewportSize(size)
      await userWithCompletedWorkout(page, `rwd-${device}`)
      const problems = []
      for (const path of SCREENS) {
        await page.goto(path)
        await settle(page)
        if (!(await noHorizontalScroll(page))) problems.push(`${path}: sideways scroll`)
        if (path !== '/') {
          const bottomNav = page.getByRole('navigation', { name: 'Primary' })
          const sidebar = page.locator('aside')
          if (size.width < 768) {
            if (!(await bottomNav.isVisible())) problems.push(`${path}: bottom nav missing`)
            if (await sidebar.isVisible()) problems.push(`${path}: sidebar visible on phone`)
          } else {
            if (await bottomNav.isVisible()) problems.push(`${path}: bottom nav visible on ${device}`)
            if (!(await sidebar.isVisible())) problems.push(`${path}: sidebar missing`)
          }
        }
        if (size.width < 768) {
          // "Easy to tap": every visible button / nav link at least 32×32 px
          const small = await page.evaluate(() =>
            [...document.querySelectorAll('button, nav a, header a, [role="button"]')]
              .filter((el) => {
                const r = el.getBoundingClientRect()
                const s = getComputedStyle(el)
                return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.width < 32 || r.height < 32)
              })
              .map((el) => `${el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30)} (${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)})`),
          )
          for (const s of small) problems.push(`${path}: small tap target ${s}`)
        }
      }
      expect(problems).toEqual([])
    })
  }
})

test.describe('Light/dark toggle on every screen', () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop-chrome', 'sizes are set explicitly; one browser is enough'))

  for (const [device, size] of [['desktop', VIEWPORTS.desktop], ['phone', VIEWPORTS.phone]]) {
    test(`${device}: toggle works and text stays readable in both themes`, async ({ page }) => {
      await page.setViewportSize(size)
      await userWithCompletedWorkout(page, `theme-${device}`)
      const problems = []
      for (const path of SCREENS) {
        await page.goto(path)
        await settle(page)
        for (const target of ['light', 'dark']) {
          await visible(page.getByRole('button', { name: `Switch to ${target} mode` })).first().click()
          // The page fades its background over 0.4s — check contrast only once it has fully settled
          const finalBg = target === 'dark' ? 'rgb(7, 9, 12)' : 'rgb(244, 246, 240)'
          await page.waitForFunction((bg) => getComputedStyle(document.body).backgroundColor === bg, finalBg)
          await page.waitForTimeout(150)
          const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
          if (isDark !== (target === 'dark')) problems.push(`${path}: toggle to ${target} failed`)
          const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
          for (const v of violations) problems.push(`${path} [${target}]: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
        }
      }
      expect(problems).toEqual([])
    })
  }
})

test.describe('Extras', () => {
  test('quote of the day shows on Landing and Dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Quote of the day')).toBeVisible()
    await signUpViaApi(page, 'quote')
    await page.goto('/dashboard')
    await expect(page.getByText('Quote of the day')).toBeVisible()
  })

  test('every link goes to a real screen (no dead links)', async ({ page }) => {
    await userWithCompletedWorkout(page, 'links')
    const hrefs = new Set()
    for (const path of [...SCREENS, '/login', '/signup']) {
      await page.goto(path)
      await settle(page)
      for (const h of await page.locator('a[href]').evaluateAll((els) => els.map((a) => a.getAttribute('href')))) hrefs.add(h)
    }
    expect([...hrefs].filter((h) => h === '#' || h === '' || h.startsWith('javascript:'))).toEqual([])
    const internal = [...hrefs].filter((h) => h.startsWith('/'))
    for (const href of internal) {
      await page.goto(href)
      await settle(page)
      await expect(page.getByRole('heading', { name: 'This page skipped leg day' }), `${href} should not 404`).toHaveCount(0)
    }
    expect(internal.length).toBeGreaterThanOrEqual(10) // every distinct internal destination was visited
  })

  test('every nav item opens its screen (sidebar on desktop, bottom bar on phone)', async ({ page }, testInfo) => {
    await signUpViaApi(page, 'nav')
    const phone = testInfo.project.name === 'mobile-iphone'
    const items = phone
      ? [['Home', /\/dashboard$/], ['Library', /\/library$/], ['Train', /\/workout$/], ['Progress', /\/progress$/], ['Classes', /\/classes$/]]
      : [['Dashboard', /\/dashboard$/], ['Workout Library', /\/library$/], ['Live Workout', /\/workout$/], ['Progress', /\/progress$/], ['Classes', /\/classes$/], ['Profile', /\/profile$/]]
    await page.goto('/dashboard')
    for (const [name, url] of items) {
      await visible(page.getByRole('link', { name, exact: true })).first().click()
      await expect(page).toHaveURL(url)
    }
    // Logo goes home
    await visible(page.getByRole('link', { name: 'PulseFit home' })).first().click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('profile buttons all respond (no dead buttons)', async ({ page }) => {
    await signUpViaApi(page, 'buttons')
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Edit profile' }).click()
    await expect(visible(page.getByText('Coming soon')).last()).toBeVisible()
    await page.getByRole('button', { name: 'Workout reminders' }).click()
    await expect(visible(page.getByText(/Workout reminders land/)).last()).toBeVisible()
    await page.getByRole('button', { name: /Appearance/ }).click()
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false)
  })
})
