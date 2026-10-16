import { db, HttpError } from './_lib/db.js'
import { route, bad } from './_lib/handler.js'
import { requireUserId } from './_lib/auth.js'

// PATCH /api/sets { setId, completed } → tick or untick a set (only within the user's own workouts)
export default route({
  async PATCH(req, res) {
    const userId = await requireUserId(req)
    const setId = Number(req.body.setId)
    const completed = req.body.completed === true
    if (!Number.isInteger(setId)) bad('Missing set.')

    const sql = db()
    const [row] = await sql`
      UPDATE workout_sets s SET completed = ${completed}, completed_at = CASE WHEN ${completed}::boolean THEN now() END
      FROM workout_exercises we, workouts w
      WHERE s.id = ${setId} AND we.id = s.workout_exercise_id AND w.id = we.workout_id
        AND w.user_id = ${userId} AND w.status <> 'completed'
      RETURNING s.id, s.completed, w.id AS workout_id`
    if (!row) throw new HttpError(404, "That set couldn't be updated — the workout may already be finished.")

    // The first ticked set starts the workout clock.
    const [w] = await sql`
      UPDATE workouts SET status = 'in_progress', started_at = coalesce(started_at, now())
      WHERE id = ${row.workout_id} AND status = 'planned' AND ${completed}::boolean
      RETURNING started_at`

    res.json({ set: { id: row.id, completed: row.completed }, startedAt: w?.started_at ?? null })
  },
})
