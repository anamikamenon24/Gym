import { db } from './_lib/db.js'
import { route } from './_lib/handler.js'

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

export default route({
  async GET(req, res) {
    const group = GROUPS.includes(req.query?.group) ? req.query.group : null
    const rows = group
      ? await db()`SELECT * FROM exercises WHERE muscle_group = ${group} ORDER BY id`
      : await db()`SELECT * FROM exercises ORDER BY id`
    res.json({
      exercises: rows.map((e) => ({
        id: e.id,
        name: e.name,
        group: e.muscle_group,
        sets: e.sets,
        reps: e.reps,
        difficulty: e.difficulty,
        rest: e.rest_seconds,
        description: e.description,
      })),
    })
  },
})
