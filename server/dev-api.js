// Local stand-in for Vercel Functions: mounts every file in /api as a route, same paths as on Vercel.
//   api/stats.js       → /api/stats
//   api/auth/login.js  → /api/auth/login
// Files and folders starting with "_" (e.g. api/_lib) are helpers, not routes — same rule as Vercel.
import express from 'express'
import { readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

try {
  process.loadEnvFile()
} catch {
  /* no .env file */
}

const root = fileURLToPath(new URL('../api', import.meta.url))
const PORT = Number(process.env.API_PORT || 3001)

const findRoutes = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) return []
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return findRoutes(full)
    return entry.name.endsWith('.js') ? [full] : []
  })

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

// No DATABASE_URL → use the local PGlite database (schema + seed applied automatically, both idempotent).
let localPg = null
if (!process.env.DATABASE_URL) {
  const { openLocalDb, setupLocalDb, LOCAL_DB_DIR } = await import('./local-db.js')
  const { pg, sql } = await openLocalDb()
  localPg = pg
  globalThis.__pulsefitLocalSql = sql
  await setupLocalDb(pg)
  console.log(`Using local database at ${relative(process.cwd(), LOCAL_DB_DIR)}`)

  // Dev-only helper for `npm run db:setup` while this server holds the database. Not under /api, never deployed.
  app.post('/__dev/db-setup', async (req, res) => {
    try {
      res.json({ rows: await setupLocalDb(pg) })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  const shutdown = async () => {
    await localPg?.close().catch(() => {})
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

for (const file of findRoutes(root)) {
  const path = '/api/' + relative(root, file).split(sep).join('/').replace(/\.js$/, '').replace(/\/index$/, '')
  const { default: handler } = await import(pathToFileURL(file).href)
  app.all(path, (req, res) => handler(req, res))
  console.log(`  ↳ ${path}`)
}

app.use('/api', (req, res) => res.status(404).json({ error: `No API route at ${req.path}` }))

// Malformed JSON bodies etc.
app.use((err, req, res, _next) => {
  res.status(err.status || 500).json({ error: err.status === 400 ? 'That request was not valid JSON.' : 'Server error.' })
})

app.listen(PORT, () => {
  console.log(`\nPulseFit API ready on http://localhost:${PORT} (${process.env.DATABASE_URL ? 'Neon database' : 'local database'})`)
})
