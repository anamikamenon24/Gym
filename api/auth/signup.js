import bcrypt from 'bcryptjs'
import { db, HttpError } from '../_lib/db.js'
import { route, bad } from '../_lib/handler.js'
import { setSession } from '../_lib/auth.js'
import { publicUser } from '../_lib/users.js'

export default route({
  async POST(req, res) {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '').trim() // login trims too, so copy-paste spaces never lock anyone out
    const fullName = String(req.body.fullName || '').trim()
    const goalWorkouts = Number(req.body.weeklyGoalWorkouts ?? 4)
    const goalMinutes = Number(req.body.weeklyGoalMinutes ?? 180)

    if (!fullName) bad('Please tell us your name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad('That email address doesn’t look right.')
    if (password.length < 8) bad('Your password needs at least 8 characters.')
    if (!Number.isInteger(goalWorkouts) || goalWorkouts < 1 || goalWorkouts > 14) bad('Weekly workouts should be between 1 and 14.')
    if (!Number.isInteger(goalMinutes) || goalMinutes < 10 || goalMinutes > 3000) bad('Weekly minutes should be between 10 and 3000.')

    const hash = await bcrypt.hash(password, 10)
    const [user] = await db()`
      INSERT INTO users (email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes)
      VALUES (${email}, ${hash}, ${fullName}, ${goalWorkouts}, ${goalMinutes})
      ON CONFLICT (email) DO NOTHING
      RETURNING *`
    if (!user) throw new HttpError(409, 'An account with that email already exists. Try logging in instead.')

    await setSession(res, user.id)
    res.status(201).json({ user: publicUser(user) })
  },
})
