import { db } from './_lib/db.js'
import { route } from './_lib/handler.js'

// The seed only creates classes for the week it runs in. When a new week starts with no classes,
// copy the most recent week's timetable forward so "classes this week" stays real.
async function ensureClassesThisWeek(sql) {
  const [{ n }] = await sql`
    SELECT count(*)::int AS n FROM classes
    WHERE start_time >= date_trunc('week', now()) AND start_time < date_trunc('week', now()) + interval '7 days'`
  if (n > 0) return
  await sql`
    INSERT INTO classes (title, class_type, coach_name, start_time, duration_minutes, capacity, intensity)
    SELECT title, class_type, coach_name,
           date_trunc('week', now())::timestamp + (start_time - date_trunc('week', start_time)),
           duration_minutes, capacity, intensity
    FROM classes
    WHERE start_time >= (SELECT date_trunc('week', max(start_time)) FROM classes WHERE start_time < date_trunc('week', now()))
      AND start_time < date_trunc('week', now())
    ON CONFLICT (title, start_time) DO NOTHING`
}

// Public landing-page counters.
export default route({
  async GET(req, res) {
    const sql = db()
    await ensureClassesThisWeek(sql)
    const [row] = await sql`
      SELECT
        (SELECT count(*)::int FROM users) AS members,
        (SELECT count(*)::int FROM workouts WHERE status = 'completed') AS workouts_completed,
        (SELECT count(*)::int FROM classes
           WHERE start_time >= date_trunc('week', now()) AND start_time < date_trunc('week', now()) + interval '7 days') AS classes_this_week`
    res.setHeader('Cache-Control', 'public, max-age=30')
    res.json({ members: row.members, workoutsCompleted: row.workouts_completed, classesThisWeek: row.classes_this_week })
  },
})
