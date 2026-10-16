import bcrypt from 'bcryptjs'
import { db, HttpError } from '../_lib/db.js'
import { route } from '../_lib/handler.js'
import { setSession } from '../_lib/auth.js'
import { publicUser } from '../_lib/users.js'

export default route({
  async POST(req, res) {
    const email = String(req.body.email || '').trim().toLowerCase()
    // Trim stray spaces from copy-paste (sign-up trims the same way, so hashes still match).
    const password = String(req.body.password || '').trim()
    const [user] = await db()`SELECT * FROM users WHERE email = ${email}`
    const ok = user && (await bcrypt.compare(password, user.password_hash))
    if (!ok) throw new HttpError(401, 'Wrong email or password. Give it another go.')
    await setSession(res, user.id)
    res.json({ user: publicUser(user) })
  },
})
