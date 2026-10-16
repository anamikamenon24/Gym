// npm run lighthouse [-- --desktop] [-- --no-build] — builds the app, serves the production build
// (vite preview + API on an in-memory database), runs Lighthouse on key pages and prints the scores.
// Writes test-results/lighthouse.json. Never touches .data/pglite or Neon.
import { spawn, execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'
import { chromium } from '@playwright/test'
import puppeteer from 'puppeteer-core'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const DESKTOP = process.argv.includes('--desktop') // default: mobile (slow 4G + 4× CPU throttling)

const API_PORT = 3102
const WEB_PORT = 4174
const BASE = `http://localhost:${WEB_PORT}`
const env = { ...process.env, API_PORT: String(API_PORT), PULSEFIT_DB_DIR: 'memory', DATABASE_URL: '', JWT_SECRET: 'lighthouse-only-secret-0123456789abcdef' }

const children = []
const start = (cmd) => {
  const child = spawn(cmd, { shell: true, env, stdio: 'ignore' })
  children.push(child)
  return child
}
const stopAll = () => {
  for (const c of children) {
    try {
      if (process.platform === 'win32') execSync(`taskkill /pid ${c.pid} /T /F`, { stdio: 'ignore' })
      else c.kill('SIGTERM')
    } catch {
      /* already gone */
    }
  }
}
const waitFor = async (url, ms = 60000) => {
  const end = Date.now() + ms
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).status < 500) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

let chrome
try {
  if (!process.argv.includes('--no-build')) {
    console.log('Building…')
    execSync('npx vite build', { stdio: 'ignore', env })
  }
  start('node server/dev-api.js')
  start(`npx vite preview --port ${WEB_PORT} --strictPort`)
  await waitFor(`${BASE}/api/stats`)
  await waitFor(BASE)

  // A throwaway user so the Dashboard can be audited logged-in.
  const signup = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Lighthouse Bot', email: `lh-${Date.now()}@pulsefit.test`, password: 'Lighthouse1!', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 150 }),
  })
  // Real browser cookies (not just a header) so the app's pf_hint check sees the session too.
  const cookies = signup.headers.getSetCookie().map((c) => {
    const [name, value] = c.split(';')[0].split('=')
    return { name, value, url: BASE }
  })

  chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox'] })
  const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` })
  const pages = [
    ['Landing', '/', false],
    ['Login', '/login', false],
    ['Dashboard', '/dashboard', true],
  ]
  const categories = ['performance', 'accessibility', 'best-practices', 'seo']
  const results = {}
  for (const [name, path, loggedIn] of pages) {
    const page = await browser.newPage()
    if (loggedIn) await browser.setCookie(...cookies)
    const { lhr } = await lighthouse(
      `${BASE}${path}`,
      { logLevel: 'error', output: 'json', onlyCategories: categories, disableStorageReset: loggedIn },
      DESKTOP ? desktopConfig : undefined,
      page,
    )
    await page.close()
    if (lhr.finalDisplayedUrl.replace(BASE, '') !== path) console.warn(`⚠ ${name}: ended on ${lhr.finalDisplayedUrl}`)
    results[name] = Object.fromEntries(categories.map((k) => [k, Math.round(lhr.categories[k].score * 100)]))
    results[name].failing = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
      .map((a) => `${a.id}${a.displayValue ? ` (${a.displayValue})` : ''}`)
  }

  console.table(Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { Performance: v.performance, Accessibility: v.accessibility, 'Best Practices': v['best-practices'], SEO: v.seo }])))
  for (const [name, r] of Object.entries(results)) if (r.failing.length) console.log(`${name} — audits below 90: ${r.failing.join(', ')}`)
  mkdirSync('test-results', { recursive: true })
  writeFileSync(`test-results/lighthouse${DESKTOP ? '-desktop' : ''}.json`, JSON.stringify(results, null, 2))
} catch (err) {
  console.error('Lighthouse run failed:', err.message)
  process.exitCode = 1
} finally {
  await chrome?.kill()
  stopAll()
}
