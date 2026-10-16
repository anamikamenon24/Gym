import { route, localDate } from '../_lib/handler.js'
import { getUserId, clearSession } from '../_lib/auth.js'
import { findUserById, getStreak, publicUser } from '../_lib/users.js'

export default route({
  async GET(req, res) {
    const id = await getUserId(req)
    if (!id) return res.json({ user: null })
    const user = await findUserById(id)
    if (!user) {
      clearSession(res)
      return res.json({ user: null })
    }
    res.json({ user: { ...publicUser(user), streak: await getStreak(id, localDate(req)) } })
  },
})
