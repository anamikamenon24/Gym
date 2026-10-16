// Local stand-in for Vercel Functions. Serves /api on API_PORT (default 3001).
// No DATABASE_URL → uses the local PGlite database (PULSEFIT_DB_DIR, default .data/pglite; "memory" = throwaway).
import { relative } from 'node:path'
import { createApp, addErrorHandler } from './app.js'

try {
  process.loadEnvFile()
} catch {
  /* no .env file */
}

const PORT = Number(process.env.API_PORT || 3001)
let localPg = null
let dbLabel = 'Neon database'

if (!process.env.DATABASE_URL) {
  const { openLocalDb, setupLocalDb, localDbDir } = await import('./local-db.js')
  const dir = localDbDir()
  const { pg, sql } = await openLocalDb(dir)
  localPg = pg
  globalThis.__pulsefitLocalSql = sql
  await setupLocalDb(pg)
  dbLabel = dir === 'memory' ? 'in-memory database' : `local database at ${relative(process.cwd(), dir)}`
}

const app = await createApp({ log: true })

if (localPg) {
  // Dev-only helper for `npm run db:setup` while this server holds the database. Not under /api, never deployed.
  const { setupLocalDb } = await import('./local-db.js')
  app.post('/__dev/db-setup', async (req, res) => {
    try {
      res.json({ rows: await setupLocalDb(localPg) })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
  const shutdown = async () => {
    await localPg.close().catch(() => {})
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

addErrorHandler(app)

app.listen(PORT, () => console.log(`\nPulseFit API ready on http://localhost:${PORT} (${dbLabel})`))
