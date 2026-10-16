import { db } from './_lib/db.js'
import { route } from './_lib/handler.js'

// Public landing-page counters.
export default route({
  async GET(req, res) {
    const [row] = await db()`
      SELECT
        (SELECT count(*)::int FROM users) AS members,
        (SELECT count(*)::int FROM workouts WHERE status = 'completed') AS workouts_completed,
        (SELECT count(*)::int FROM classes
           WHERE start_time >= date_trunc('week', now()) AND start_time < date_trunc('week', now()) + interval '7 days') AS classes_this_week`
    res.setHeader('Cache-Control', 'public, max-age=30')
    res.json({ members: row.members, workoutsCompleted: row.workouts_completed, classesThisWeek: row.classes_this_week })
  },
})
