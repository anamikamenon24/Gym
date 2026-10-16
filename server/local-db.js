// Local development database: PGlite (real Postgres compiled to WebAssembly), stored in .data/pglite.
// Used only when DATABASE_URL is empty. Exposes the same tagged-template API as Neon's `neon()`,
// so the /api code runs unchanged against either database.
import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

export const LOCAL_DB_DIR = fileURLToPath(new URL('../.data/pglite', import.meta.url))

export async function openLocalDb() {
  mkdirSync(LOCAL_DB_DIR, { recursive: true })
  const pg = new PGlite(LOCAL_DB_DIR)
  await pg.waitReady

  // sql`SELECT ... ${value}` → parameterised query, resolves to an array of rows (like neon()).
  const sql = (strings, ...values) => {
    let text = strings[0]
    values.forEach((_, i) => (text += `$${i + 1}${strings[i + 1]}`))
    return pg.query(text, values).then((r) => r.rows)
  }

  return { pg, sql }
}

// Runs db/schema.sql + db/seed.sql (both idempotent) and returns row counts.
export async function setupLocalDb(pg) {
  for (const file of ['schema.sql', 'seed.sql']) {
    await pg.exec(readFileSync(new URL(`../db/${file}`, import.meta.url), 'utf8'))
  }
  return countRows(pg)
}

export async function countRows(pg) {
  const { rows } = await pg.query(`
    SELECT 'exercises' AS "table", count(*)::int AS rows FROM exercises
    UNION ALL SELECT 'classes', count(*)::int FROM classes
    UNION ALL SELECT 'classes this week', count(*)::int FROM classes
      WHERE start_time >= date_trunc('week', now()) AND start_time < date_trunc('week', now()) + interval '7 days'
    UNION ALL SELECT 'users', count(*)::int FROM users
    UNION ALL SELECT 'workouts', count(*)::int FROM workouts`)
  return rows
}
