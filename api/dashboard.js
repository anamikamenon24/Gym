import { db, HttpError } from './_lib/db.js'
import { route, localDate } from './_lib/handler.js'
import { requireUserId } from './_lib/auth.js'
import { findUserById, getStreak, publicUser } from './_lib/users.js'
import { loadWorkout } from './_lib/workouts.js'

const mondayOf = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

export default route({
  async GET(req, res) {
    const userId = await requireUserId(req)
    const today = localDate(req)
    const weekStart = mondayOf(today)
    const sql = db()

    const user = await findUserById(userId)
    if (!user) throw new HttpError(401, 'Please log in to continue.')

    const [activity, [week], streak, todayWorkout] = await Promise.all([
      sql`
        SELECT d::date::text AS date, to_char(d, 'Dy') AS day,
               coalesce(sum(w.duration_minutes) FILTER (WHERE w.status = 'completed'), 0)::int AS minutes
        FROM generate_series(${today}::date - 6, ${today}::date, interval '1 day') AS d
        LEFT JOIN workouts w ON w.workout_date = d::date AND w.user_id = ${userId}
        GROUP BY d ORDER BY d`,
      sql`
        SELECT count(*)::int AS workouts, coalesce(sum(duration_minutes), 0)::int AS minutes
        FROM workouts
        WHERE user_id = ${userId} AND status = 'completed'
          AND workout_date BETWEEN ${weekStart}::date AND ${today}::date`,
      getStreak(userId, today),
      loadWorkout(userId, today),
    ])

    const goals = [
      { label: 'Weekly workouts', hit: week.workouts >= user.weekly_goal_workouts },
      { label: 'Weekly minutes', hit: week.minutes >= user.weekly_goal_minutes },
      { label: '3-day streak', hit: streak >= 3 },
    ]

    res.json({
      user: publicUser(user),
      today,
      todayWorkout,
      activity,
      streak,
      week: {
        workouts: { done: week.workouts, target: user.weekly_goal_workouts },
        minutes: { done: week.minutes, target: user.weekly_goal_minutes },
        goals: { done: goals.filter((g) => g.hit).length, target: goals.length, items: goals },
      },
    })
  },
})
