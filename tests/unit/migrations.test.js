// Netlify Database applies netlify/database/migrations on deploy; local dev and `npm run db:setup`
// use db/*.sql. They must stay identical. If you change the schema later, add a NEW numbered
// migration (e.g. 0003_add_column.sql) — Netlify only runs each migration file once.
import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')

describe('Netlify Database migrations', () => {
  it('0001_schema.sql matches db/schema.sql', () => {
    expect(read('netlify/database/migrations/0001_schema.sql')).toBe(read('db/schema.sql'))
  })

  it('0002_seed.sql matches db/seed.sql', () => {
    expect(read('netlify/database/migrations/0002_seed.sql')).toBe(read('db/seed.sql'))
  })

  it('every migration file follows the <number>_<slug>.sql naming rule', () => {
    for (const f of readdirSync('netlify/database/migrations')) expect(f).toMatch(/^\d+_[a-z0-9_-]+\.sql$/)
  })
})
