// Tiny fetch wrapper for the /api functions. Never talks to the database directly.

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// The user's local calendar date, so "today" matches their timezone.
export const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function api(path, { method = 'GET', body, query } = {}) {
  const params = new URLSearchParams({ date: localToday(), ...query })
  let res
  try {
    res = await fetch(`/api/${path}?${params}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, "Can't reach PulseFit right now. Check your connection and try again.")
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON (e.g. the API server isn't running and the proxy returned an error page) */
  }
  if (!res.ok) {
    const fallback =
      res.status >= 500 && !data
        ? "PulseFit's server isn't responding. Is it running? (npm run dev)"
        : 'Something went wrong. Please try again.'
    throw new ApiError(res.status, data?.error || fallback)
  }
  return data
}
