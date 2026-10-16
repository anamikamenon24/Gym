import { neon } from '@neondatabase/serverless'

let sql

// Returns the SQL client: Neon when DATABASE_URL is set (production / Vercel), otherwise the local
// PGlite database that server/dev-api.js provides during development. Same tagged-template API.
export function db() {
  if (process.env.DATABASE_URL) {
    sql ??= neon(process.env.DATABASE_URL)
    return sql
  }
  if (globalThis.__pulsefitLocalSql) return globalThis.__pulsefitLocalSql
  throw new HttpError(503, 'The database is not configured. Set DATABASE_URL in your environment.')
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
