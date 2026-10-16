import { route, localDate } from '../_lib/handler.js'
import { getUserId, clearSession } from '../_lib/auth.js'
import { findUserById, getStreak, publicUser } from '../_lib/users.js'

export default route({
  async GET(req, res) {
    const id = await getUserId(req)
    const user = id && (await findUserById(id))
    if (!user) {
      clearSession(res) // drop stale or invalid cookies
      return res.status(401).json({ error: 'Please log in to continue.' })
    }
    res.json({ user: { ...publicUser(user), streak: await getStreak(id, localDate(req)) } })
  },
})
