import { db } from './db.js'

// Loads the user's workout for a date with its exercises and sets, or null.
export async function loadWorkout(userId, date) {
  const sql = db()
  const [w] = await sql`
    SELECT id, name, workout_date::text AS date, status, duration_minutes, started_at, completed_at
    FROM workouts WHERE user_id = ${userId} AND workout_date = ${date}::date`
  if (!w) return null

  const rows = await sql`
    SELECT we.id AS we_id, we.order_index, e.id AS exercise_id, e.name, e.muscle_group, e.reps, e.difficulty,
           e.rest_seconds, e.description, s.id AS set_id, s.set_number, s.completed
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
    LEFT JOIN workout_sets s ON s.workout_exercise_id = we.id
    WHERE we.workout_id = ${w.id}
    ORDER BY we.order_index, s.set_number`

  const byWe = new Map()
  for (const r of rows) {
    if (!byWe.has(r.we_id)) {
      byWe.set(r.we_id, {
        id: r.we_id,
        exerciseId: r.exercise_id,
        name: r.name,
        group: r.muscle_group,
        reps: r.reps,
        difficulty: r.difficulty,
        rest: r.rest_seconds,
        description: r.description,
        sets: [],
      })
    }
    if (r.set_id) byWe.get(r.we_id).sets.push({ id: r.set_id, number: r.set_number, completed: r.completed })
  }

  return {
    id: w.id,
    name: w.name,
    date: w.date,
    status: w.status,
    durationMinutes: w.duration_minutes,
    startedAt: w.started_at,
    completedAt: w.completed_at,
    exercises: [...byWe.values()],
  }
}

// "Chest & Arms" style name from the muscle groups in the workout.
export async function renameWorkout(workoutId) {
  const sql = db()
  const groups = await sql`
    SELECT e.muscle_group, min(we.order_index) AS first
    FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
    WHERE we.workout_id = ${workoutId}
    GROUP BY e.muscle_group ORDER BY first`
  const names = groups.map((g) => g.muscle_group)
  const name =
    names.length === 0 ? "Today's Workout" : names.length <= 2 ? `${names.join(' & ')} Session` : 'Full Body Session'
  await sql`UPDATE workouts SET name = ${name} WHERE id = ${workoutId}`
}
