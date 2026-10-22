// Netlify Function that serves every /api route by running the SAME handlers in /api
// (written in the Vercel/Express (req, res) style). netlify.toml rewrites /api/* to this function.
// Local dev (server/dev-api.js) and the tests use those handlers directly, so all three stay in sync.
import signup from '../../api/auth/signup.js'
import login from '../../api/auth/login.js'
import logout from '../../api/auth/logout.js'
import me from '../../api/auth/me.js'
import dashboard from '../../api/dashboard.js'
import exercises from '../../api/exercises.js'
import sets from '../../api/sets.js'
import stats from '../../api/stats.js'
import workouts from '../../api/workouts.js'

export const routes = {
  'auth/signup': signup,
  'auth/login': login,
  'auth/logout': logout,
  'auth/me': me,
  dashboard,
  exercises,
  sets,
  stats,
  workouts,
}

const json = (status, body) => Response.json(body, { status })

export default async function handler(request) {
  const url = new URL(request.url)
  // Works whether Netlify passes the original /api/... path or the rewritten /.netlify/functions/api/... path
  const path = url.pathname.replace(/^\/(\.netlify\/functions\/)?api\/?/, '').replace(/\/+$/, '')
  const route = routes[path]
  if (!route) return json(404, { error: `No API route at /api/${path}` })

  let body = {}
  const text = ['GET', 'HEAD'].includes(request.method) ? '' : await request.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      return json(400, { error: 'That request was not valid JSON.' })
    }
  }

  const req = {
    method: request.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers), // lower-cased names, like Node
    query: Object.fromEntries(url.searchParams),
    body,
  }

  // Minimal Vercel/Express-style response object
  let status = 200
  let payload = null
  const headers = new Headers()
  const res = {
    status(code) {
      status = code
      return res
    },
    setHeader(name, value) {
      headers.delete(name)
      for (const v of [].concat(value)) headers.append(name, String(v))
      return res
    },
    json(data) {
      headers.set('Content-Type', 'application/json; charset=utf-8')
      payload = JSON.stringify(data)
      return res
    },
    send(data) {
      payload = typeof data === 'string' ? data : JSON.stringify(data)
      return res
    },
    end() {
      return res
    },
  }

  await route(req, res)

  // The site is served over HTTPS on Netlify, so mark cookies Secure there.
  if (url.protocol === 'https:') {
    const cookies = headers.getSetCookie()
    if (cookies.length) {
      headers.delete('Set-Cookie')
      for (const c of cookies) headers.append('Set-Cookie', /;\s*Secure/i.test(c) ? c : `${c}; Secure`)
    }
  }

  return new Response(payload, { status, headers })
}
