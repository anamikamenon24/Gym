import { neon } from '@neondatabase/serverless'
import { getDatabase, MissingDatabaseConnectionError } from '@netlify/database'

let sql

// Returns the SQL client — a tagged template that resolves to an array of rows. In order:
//   1. DATABASE_URL set              → Neon (Vercel, or any Postgres you point it at)
//   2. local dev server / tests      → PGlite provided by server/dev-api.js
//   3. running on Netlify            → Netlify Database (auto-provisioned, NETLIFY_DB_URL)
export function db() {
  if (process.env.DATABASE_URL) {
    sql ??= neon(process.env.DATABASE_URL)
    return sql
  }
  if (globalThis.__pulsefitLocalSql) return globalThis.__pulsefitLocalSql
  if (!sql) {
    try {
      const database = getDatabase()
      // node-postgres emits 'error' on the pool when the server drops an IDLE connection. With no
      // listener that crashes the whole function; log it instead — the pool reconnects on next use.
      database.pool?.on?.('error', (err) => console.error('[db] idle connection closed:', err.message))
      sql = (strings, ...values) => database.sql(strings, ...values)
    } catch (err) {
      if (err instanceof MissingDatabaseConnectionError) {
        throw new HttpError(503, 'The database is not configured yet. On Netlify it is created on the next deploy; locally run "npm run dev".')
      }
      throw err
    }
  }
  return sql
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
