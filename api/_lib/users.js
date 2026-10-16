import { db } from './db.js'

export const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  fullName: u.full_name,
  weeklyGoalWorkouts: u.weekly_goal_workouts,
  weeklyGoalMinutes: u.weekly_goal_minutes,
  createdAt: u.created_at,
})

export async function findUserById(id) {
  const [u] = await db()`SELECT * FROM users WHERE id = ${id}`
  return u || null
}

// Consecutive days (ending today, or yesterday if today isn't done yet) with a completed workout.
export async function getStreak(userId, today) {
  const rows = await db()`
    SELECT DISTINCT workout_date::text AS d FROM workouts
    WHERE user_id = ${userId} AND status = 'completed' AND workout_date <= ${today}::date
    ORDER BY d DESC LIMIT 400`
  const done = new Set(rows.map((r) => r.d))
  const cursor = new Date(`${today}T00:00:00Z`)
  const iso = () => cursor.toISOString().slice(0, 10)
  if (!done.has(iso())) cursor.setUTCDate(cursor.getUTCDate() - 1)
  let streak = 0
  while (done.has(iso())) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}
