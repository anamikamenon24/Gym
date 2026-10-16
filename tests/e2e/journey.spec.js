// The full member journey, in order, as one user: sign up → library → build workout → train → dashboard → refresh → logout.
import { test, expect, uniqueEmail, visible } from './fixtures.js'

test.describe.configure({ mode: 'serial' })

test('complete member journey', async ({ page }) => {
  const email = uniqueEmail('journey')
  const password = 'Journey123!'

  await test.step('sign up and land on the Dashboard', async () => {
    await page.goto('/signup')
    await page.getByLabel('Full name').fill('Jordan Lift')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByLabel('Workouts').fill('4')
    await page.getByLabel('Active minutes').fill('150')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Jordan')
    await expect(page.getByText('No workout yet today.')).toBeVisible()
  })

  await test.step('Workout Library: each muscle group filter shows only that group', async () => {
    await visible(page.getByRole('link', { name: /Open the Library/ })).click()
    await expect(page).toHaveURL(/\/library$/)
    const cards = page.getByTestId('exercise-card')
    await expect(cards).toHaveCount(30)
    for (const group of ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']) {
      await page.getByRole('button', { name: new RegExp(`^${group}`) }).click()
      await expect
        .poll(async () => {
          const groups = await cards.evaluateAll((els) => els.map((el) => el.dataset.group))
          return groups.length === 5 && groups.every((g) => g === group)
        }, { message: `${group} filter` })
        .toBe(true)
    }
    await page.getByRole('button', { name: /^All/ }).click()
    await expect(cards).toHaveCount(30)
  })

  await test.step("add 2 exercises to today's workout", async () => {
    for (const name of ['Tempo Push-Up', 'Plank Hold']) {
      const card = page.getByTestId('exercise-card').filter({ has: page.getByRole('heading', { name, exact: true }) })
      await card.getByRole('button', { name: "Add to today's workout" }).click()
      await expect(card.getByRole('button', { name: "In today's workout" })).toBeVisible()
      await expect(visible(page.getByText(/Added to today.s workout/)).last()).toBeVisible() // toasts can stack
    }
  })

  await test.step("Dashboard shows today's workout, click Start", async () => {
    await visible(page.getByRole('link', { name: /Dashboard|Home/ })).first().click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Chest & Core Session' })).toBeVisible()
    await expect(page.getByText('Tempo Push-Up', { exact: true })).toBeVisible()
    await expect(page.getByText('Plank Hold', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: /^Start/ }).click()
    await expect(page).toHaveURL(/\/workout$/)
  })

  await test.step('Live Workout: rest timer counts down', async () => {
    await page.getByRole('button', { name: 'Tempo Push-Up set 1' }).click()
    const timer = page.getByTestId('rest-timer')
    await expect(timer).toBeVisible()
    const first = await timer.innerText()
    expect(first).toMatch(/^0:4[45]$/) // Tempo Push-Up rest_seconds = 45 — never more
    await expect.poll(() => timer.innerText(), { timeout: 4000 }).not.toBe(first)
    const toSeconds = (t) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1])
    expect(toSeconds(await timer.innerText())).toBeLessThan(toSeconds(first))
  })

  await test.step('tick every set (one with the keyboard) and finish → confetti', async () => {
    const setButtons = page.getByRole('button', { name: /set \d+$/ })
    await expect(setButtons).toHaveCount(6)
    // Keyboard: focus a set and press Space
    const kb = page.getByRole('button', { name: 'Tempo Push-Up set 2' })
    await kb.focus()
    await page.keyboard.press('Space')
    await expect(kb).toHaveAttribute('aria-pressed', 'true')
    for (const name of ['Tempo Push-Up set 3', 'Plank Hold set 1', 'Plank Hold set 2', 'Plank Hold set 3']) {
      await page.getByRole('button', { name }).click()
      await expect(page.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
    }
    await expect(page.getByRole('heading', { name: 'Workout complete!' })).toBeVisible()
    await expect.poll(() => page.locator('canvas').count(), { message: 'confetti canvas', timeout: 2000 }).toBeGreaterThan(0)
  })

  await test.step('Dashboard updates: streak, chart and rings show the new workout', async () => {
    await page.getByRole('link', { name: /See dashboard/ }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText(/Completed in \d+ min/)).toBeVisible()
    await expect(page.getByText('day in a row')).toBeVisible()
    await expect(visible(page.getByText('1/4'))).toBeVisible() // workouts ring
    await expect(page.getByText('1 active day', { exact: true })).toBeVisible() // chart summary
    await expect(page.locator('.recharts-bar-rectangle path').last()).toBeAttached()
  })

  await test.step('refresh: data is still there', async () => {
    await page.reload()
    await expect(page.getByText(/Completed in \d+ min/)).toBeVisible()
    await expect(page.getByText('day in a row')).toBeVisible()
    await page.goto('/workout')
    await expect(page.getByText(/Saved · \d+ min/)).toBeVisible()
    await expect(page.getByRole('button', { name: /set \d+$/, pressed: true })).toHaveCount(6)
  })

  await test.step('logout, then protected pages redirect to login', async () => {
    await visible(page.getByRole('button', { name: 'Log out' })).click()
    await expect(page).toHaveURL(/\/$/)
    for (const path of ['/dashboard', '/library', '/workout', '/profile']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login$/)
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    }
  })

  await test.step('log back in: same data', async () => {
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Log in' }).click()
    // Returns to the page you were trying to open (the last redirect was from /profile)
    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByRole('heading', { name: 'Jordan Lift' })).toBeVisible()
    await page.goto('/dashboard')
    await expect(page.getByText(/Completed in \d+ min/)).toBeVisible()
  })
})
