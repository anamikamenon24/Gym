import { db, HttpError } from './_lib/db.js'
import { route, localDate, bad } from './_lib/handler.js'
import { requireUserId } from './_lib/auth.js'
import { loadWorkout, renameWorkout } from './_lib/workouts.js'

// Fetch a workout only if it belongs to the logged-in user.
async function ownedWorkout(userId, workoutId) {
  const [w] = await db()`SELECT * FROM workouts WHERE id = ${workoutId} AND user_id = ${userId}`
  if (!w) throw new HttpError(404, "We couldn't find that workout.")
  return w
}

export default route({
  // GET /api/workouts?date=YYYY-MM-DD → today's workout with exercises and sets (or null)
  async GET(req, res) {
    const userId = await requireUserId(req)
    res.json({ workout: await loadWorkout(userId, localDate(req)) })
  },

  // POST /api/workouts { exerciseId, date } → add an exercise to that day's workout
  async POST(req, res) {
    const userId = await requireUserId(req)
    const date = localDate(req)
    const exerciseId = Number(req.body.exerciseId)
    if (!Number.isInteger(exerciseId)) bad('Pick an exercise to add.')

    const sql = db()
    const [exercise] = await sql`SELECT id, name, sets FROM exercises WHERE id = ${exerciseId}`
    if (!exercise) throw new HttpError(404, "That exercise doesn't exist anymore.")

    const [workout] = await sql`
      INSERT INTO workouts (user_id, name, workout_date) VALUES (${userId}, 'Today''s Workout', ${date}::date)
      ON CONFLICT (user_id, workout_date) DO UPDATE SET user_id = EXCLUDED.user_id
      RETURNING id, status`
    if (workout.status === 'completed') {
      throw new HttpError(409, "You've already finished today's workout — rest up and add it tomorrow!")
    }

    const [we] = await sql`
      INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
      SELECT ${workout.id}, ${exerciseId}, coalesce(max(order_index) + 1, 0)
      FROM workout_exercises WHERE workout_id = ${workout.id}
      ON CONFLICT (workout_id, exercise_id) DO NOTHING
      RETURNING id`
    if (!we) throw new HttpError(409, `${exercise.name} is already in today's workout.`)

    await sql`
      INSERT INTO workout_sets (workout_exercise_id, set_number)
      SELECT ${we.id}, n FROM generate_series(1, ${exercise.sets}::int) AS n
      ON CONFLICT DO NOTHING`
    await renameWorkout(workout.id)

    res.status(201).json({ workout: await loadWorkout(userId, date) })
  },

  // PATCH /api/workouts { workoutId, action: 'complete' | 'reset' }
  async PATCH(req, res) {
    const userId = await requireUserId(req)
    const w = await ownedWorkout(userId, Number(req.body.workoutId))
    const sql = db()

    if (req.body.action === 'complete') {
      // Already-completed workouts keep their original duration (finishing twice is a no-op).
      await sql`
        UPDATE workouts SET
          status = 'completed',
          started_at = coalesce(started_at, now()),
          completed_at = now(),
          duration_minutes = greatest(1, ceil(extract(epoch FROM now() - coalesce(started_at, now())) / 60))::int
        WHERE id = ${w.id} AND user_id = ${userId} AND status <> 'completed'`
    } else if (req.body.action === 'reset') {
      await sql`
        UPDATE workout_sets SET completed = false, completed_at = NULL
        WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = ${w.id})`
      await sql`
        UPDATE workouts SET status = 'planned', started_at = NULL, completed_at = NULL, duration_minutes = NULL
        WHERE id = ${w.id} AND user_id = ${userId}`
    } else {
      bad('Unknown action.')
    }

    const [{ date }] = await sql`SELECT workout_date::text AS date FROM workouts WHERE id = ${w.id}`
    res.json({ workout: await loadWorkout(userId, date) })
  },
})
