import { route } from '../_lib/handler.js'
import { clearSession } from '../_lib/auth.js'

export default route({
  async POST(req, res) {
    clearSession(res)
    res.json({ ok: true })
  },
})
