// Builds the Express app that serves every /api route file, with the same paths Vercel uses:
//   api/stats.js → /api/stats,  api/auth/login.js → /api/auth/login
// Files and folders starting with "_" (e.g. api/_lib) are helpers, not routes — same rule as Vercel.
// Used by the local dev server and by the backend tests.
import express from 'express'
import { readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../api', import.meta.url))

const findRoutes = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) return []
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return findRoutes(full)
    return entry.name.endsWith('.js') ? [full] : []
  })

export async function createApp({ log = false } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))

  for (const file of findRoutes(root).sort()) {
    const path = '/api/' + relative(root, file).split(sep).join('/').replace(/\.js$/, '').replace(/\/index$/, '')
    const { default: handler } = await import(pathToFileURL(file).href)
    app.all(path, (req, res) => handler(req, res))
    if (log) console.log(`  ↳ ${path}`)
  }

  app.use('/api', (req, res) => res.status(404).json({ error: `No API route at ${req.path}` }))
  return app
}

// Call after adding any extra routes: JSON errors for malformed bodies etc.
export function addErrorHandler(app) {
  app.use((err, req, res, _next) => {
    res.status(err.status || 500).json({ error: err.status === 400 ? 'That request was not valid JSON.' : 'Server error.' })
  })
}
