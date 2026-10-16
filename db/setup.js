// npm run db:setup — runs db/schema.sql then db/seed.sql and prints row counts. Safe to run repeatedly.
//   DATABASE_URL set   → runs against Neon
//   DATABASE_URL empty → runs against the local PGlite database in .data/pglite
import { readFileSync } from 'node:fs'

try {
  process.loadEnvFile()
} catch {
  /* no .env */
}

const API_PORT = Number(process.env.API_PORT || 3001)

async function setupNeon() {
  const { Pool } = await import('@neondatabase/serverless')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    for (const file of ['schema.sql', 'seed.sql']) {
      await pool.query(readFileSync(new URL(file, import.meta.url), 'utf8')) // multi-statement, no params
      console.log(`✔ Ran db/${file}`)
    }
    const { rows } = await pool.query(`
      SELECT 'exercises' AS "table", count(*)::int AS rows FROM exercises
      UNION ALL SELECT 'classes', count(*)::int FROM classes
      UNION ALL SELECT 'classes this week', count(*)::int FROM classes
        WHERE start_time >= date_trunc('week', now()) AND start_time < date_trunc('week', now()) + interval '7 days'
      UNION ALL SELECT 'users', count(*)::int FROM users
      UNION ALL SELECT 'workouts', count(*)::int FROM workouts`)
    return rows
  } finally {
    await pool.end()
  }
}

async function setupLocal() {
  // PGlite allows one process at a time. If the dev server is running it owns the database, so ask it.
  try {
    const res = await fetch(`http://localhost:${API_PORT}/__dev/db-setup`, { method: 'POST' })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error)
    console.log('✔ Ran db/schema.sql and db/seed.sql via the running dev server')
    return body.rows
  } catch (err) {
    if (err.cause?.code !== 'ECONNREFUSED' && !/fetch failed/.test(err.message)) throw err
  }
  const { openLocalDb, setupLocalDb, localDbDir } = await import('../server/local-db.js')
  const { pg } = await openLocalDb()
  try {
    const rows = await setupLocalDb(pg)
    console.log(`✔ Ran db/schema.sql and db/seed.sql on the local database (${localDbDir()})`)
    return rows
  } finally {
    await pg.close()
  }
}

try {
  const rows = process.env.DATABASE_URL ? await setupNeon() : await setupLocal()
  console.table(rows)
} catch (err) {
  console.error('✖ Database setup failed:', err.message)
  process.exitCode = 1
}
