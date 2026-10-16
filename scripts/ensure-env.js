// Makes sure .env exists with a JWT_SECRET, and notes which database will be used.
// Usage: node scripts/ensure-env.js
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const path = new URL('../.env', import.meta.url)
let text = existsSync(path) ? readFileSync(path, 'utf8') : ''

const get = (key) => text.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '')

const set = (key, value) => {
  if (new RegExp(`^${key}=`, 'm').test(text)) text = text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
  else text += `${text && !text.endsWith('\n') ? '\n' : ''}${key}=${value}\n`
}

if (!get('JWT_SECRET')) {
  set('JWT_SECRET', randomBytes(48).toString('base64url'))
  console.log('✔ Generated a new JWT_SECRET in .env')
}
if (get('DATABASE_URL') === undefined) set('DATABASE_URL', '')
writeFileSync(path, text)

if (!get('DATABASE_URL')) {
  console.log(`ℹ  DATABASE_URL is empty → using the local database in .data/pglite.
   To use Neon instead: console.neon.tech → your project → Connect → copy the pooled
   connection string into .env after DATABASE_URL=`)
}
