-- PulseFit sample data. Safe to run repeatedly: existing rows are updated, never duplicated.

INSERT INTO exercises (name, muscle_group, sets, reps, difficulty, rest_seconds, description) VALUES
  -- Chest
  ('Barbell Bench Press',      'Chest',  4, '6–8',        'Intermediate',  90, 'The classic upper-body strength builder. Keep shoulder blades pinned and feet planted.'),
  ('Incline Dumbbell Press',   'Chest',  3, '8–10',       'Intermediate',  75, 'Targets the upper chest. Set the bench at 30° and press with control.'),
  ('Tempo Push-Up',            'Chest',  3, '12–15',      'Beginner',      45, 'Three seconds down, one second up. Brace your core like a plank.'),
  ('Cable Fly',                'Chest',  3, '12',         'Beginner',      60, 'Hug a big tree. Soft elbows and a deep stretch at the bottom.'),
  ('Weighted Dip',             'Chest',  4, '6–8',        'Advanced',      90, 'Lean forward slightly to bias the chest. Add a belt plate when bodyweight gets easy.'),
  -- Back
  ('Conventional Deadlift',    'Back',   5, '5',          'Advanced',     120, 'Bar over mid-foot, flat back, push the floor away. The king of posterior-chain lifts.'),
  ('Weighted Pull-Up',         'Back',   4, '6–8',        'Advanced',      90, 'Full hang to chin over bar. Drive elbows down to your back pockets.'),
  ('Bent-Over Barbell Row',    'Back',   4, '8–10',       'Intermediate',  90, 'Hinge to 45°, pull the bar to your belly button and squeeze.'),
  ('Lat Pulldown',             'Back',   3, '10–12',      'Beginner',      60, 'Chest up, pull to the collarbone, control the return.'),
  ('Single-Arm Dumbbell Row',  'Back',   3, '10 / side',  'Beginner',      60, 'Brace on a bench and row the dumbbell towards your hip.'),
  -- Legs
  ('Back Squat',               'Legs',   5, '5',          'Advanced',     120, 'Brace, sit between your hips and drive up through the whole foot.'),
  ('Romanian Deadlift',        'Legs',   4, '8',          'Intermediate',  90, 'Soft knees, push hips back until you feel a big hamstring stretch.'),
  ('Walking Lunge',            'Legs',   3, '12 / leg',   'Beginner',      60, 'Long steps, upright torso, back knee kisses the floor.'),
  ('Leg Press',                'Legs',   4, '10–12',      'Beginner',      90, 'Feet shoulder-width, lower until knees reach 90°, never lock out hard.'),
  ('Bulgarian Split Squat',    'Legs',   3, '8 / leg',    'Intermediate',  75, 'Rear foot on a bench. Brutal, effective, worth it.'),
  -- Arms
  ('Barbell Curl',             'Arms',   3, '10',         'Beginner',      60, 'Elbows pinned to your sides, no swinging.'),
  ('Close-Grip Bench Press',   'Arms',   4, '8',          'Intermediate',  90, 'Hands shoulder-width to shift the work onto the triceps.'),
  ('EZ-Bar Skull Crusher',     'Arms',   3, '10–12',      'Intermediate',  60, 'Lower the bar behind your head for a deeper triceps stretch.'),
  ('Hammer Curl',              'Arms',   3, '12',         'Beginner',      45, 'Neutral grip hits the brachialis for thicker-looking arms.'),
  ('Ring Muscle-Up Negative',  'Arms',   3, '3–5',        'Advanced',      90, 'Jump to the top and lower yourself as slowly as you can.'),
  -- Core
  ('Plank Hold',               'Core',   3, '45 sec',     'Beginner',      30, 'Squeeze glutes and quads, ribs down, breathe.'),
  ('Hanging Leg Raise',        'Core',   3, '10–12',      'Intermediate',  45, 'Curl the pelvis up — don''t just swing the legs.'),
  ('Ab Wheel Rollout',         'Core',   3, '8–10',       'Advanced',      60, 'Roll out only as far as you can keep a flat back.'),
  ('Dead Bug',                 'Core',   3, '10 / side',  'Beginner',      30, 'Lower back glued to the floor as opposite arm and leg extend.'),
  ('Pallof Press',             'Core',   3, '12 / side',  'Intermediate',  45, 'Anti-rotation work: press the cable out and resist the twist.'),
  -- Cardio
  ('Treadmill Intervals',      'Cardio', 8, '30s sprint', 'Intermediate',  60, 'Sprint hard for 30 seconds, walk to recover. Repeat.'),
  ('Rower 500m Repeats',       'Cardio', 5, '500 m',      'Advanced',      90, 'Legs, then body, then arms. Aim for a steady split each rep.'),
  ('Jump Rope',                'Cardio', 5, '60 sec',     'Beginner',      30, 'Light on the toes, small hops, wrists do the work.'),
  ('Assault Bike Sprints',     'Cardio', 6, '20 sec',     'Advanced',      70, 'All-out effort. You''ll hate it and love the results.'),
  ('Incline Walk',             'Cardio', 1, '20 min',     'Beginner',       0, '12% incline, brisk pace, no holding the rails.')
ON CONFLICT (name) DO UPDATE SET
  muscle_group = EXCLUDED.muscle_group,
  sets         = EXCLUDED.sets,
  reps         = EXCLUDED.reps,
  difficulty   = EXCLUDED.difficulty,
  rest_seconds = EXCLUDED.rest_seconds,
  description  = EXCLUDED.description;

-- Classes for the current week (Monday-based). Re-running in a later week adds that week's classes.
WITH week AS (SELECT date_trunc('week', now())::timestamp AS monday)
INSERT INTO classes (title, class_type, coach_name, start_time, duration_minutes, capacity, intensity)
SELECT v.title, v.class_type, v.coach_name, week.monday + v.offset_time, v.duration_minutes, v.capacity, v.intensity
FROM week, (VALUES
  ('Sunrise Shred',        'HIIT',     'Kabir R.', interval '0 days 06:30', 45, 20, 'High'),
  ('Vinyasa Flow',         'Yoga',     'Meera S.', interval '0 days 18:00', 60, 18, 'Low'),
  ('Climb Club',           'Spin',     'Tara K.',  interval '1 days 07:00', 45, 24, 'High'),
  ('Bag Work Basics',      'Boxing',   'Arjun D.', interval '1 days 18:30', 50, 16, 'High'),
  ('Barbell Strength 101', 'Strength', 'Priya N.', interval '2 days 19:00', 60, 12, 'Medium'),
  ('Power Yoga',           'Yoga',     'Leah P.',  interval '3 days 07:30', 60, 18, 'Medium'),
  ('Tabata Inferno',       'HIIT',     'Kabir R.', interval '3 days 19:00', 40, 20, 'High'),
  ('Friday Night Lights',  'Spin',     'Tara K.',  interval '4 days 18:00', 45, 24, 'High'),
  ('Combo Lab',            'Boxing',   'Arjun D.', interval '5 days 10:30', 50, 16, 'High'),
  ('Sunday Mobility',      'Mobility', 'Leah P.',  interval '6 days 09:00', 45, 20, 'Low')
) AS v(title, class_type, coach_name, offset_time, duration_minutes, capacity, intensity)
ON CONFLICT (title, start_time) DO NOTHING;
