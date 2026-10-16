-- PulseFit schema. Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS users (
  id                    SERIAL PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE,
  password_hash         TEXT NOT NULL,
  full_name             TEXT NOT NULL,
  weekly_goal_workouts  INTEGER NOT NULL DEFAULT 4 CHECK (weekly_goal_workouts BETWEEN 1 AND 14),
  weekly_goal_minutes   INTEGER NOT NULL DEFAULT 180 CHECK (weekly_goal_minutes BETWEEN 10 AND 3000),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercises (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  muscle_group  TEXT NOT NULL CHECK (muscle_group IN ('Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio')),
  sets          INTEGER NOT NULL CHECK (sets BETWEEN 1 AND 20),
  reps          TEXT NOT NULL,
  difficulty    TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  rest_seconds  INTEGER NOT NULL CHECK (rest_seconds BETWEEN 0 AND 600),
  description   TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS exercises_muscle_group_idx ON exercises (muscle_group);

CREATE TABLE IF NOT EXISTS workouts (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  workout_date      DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  duration_minutes  INTEGER,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  UNIQUE (user_id, workout_date)  -- one workout per user per day
);
CREATE INDEX IF NOT EXISTS workouts_user_date_idx ON workouts (user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS workouts_status_idx ON workouts (status);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id           SERIAL PRIMARY KEY,
  workout_id   INTEGER NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
  exercise_id  INTEGER NOT NULL REFERENCES exercises (id) ON DELETE RESTRICT,
  order_index  INTEGER NOT NULL,
  UNIQUE (workout_id, exercise_id)
);
CREATE INDEX IF NOT EXISTS workout_exercises_workout_idx ON workout_exercises (workout_id, order_index);

CREATE TABLE IF NOT EXISTS workout_sets (
  id                   SERIAL PRIMARY KEY,
  workout_exercise_id  INTEGER NOT NULL REFERENCES workout_exercises (id) ON DELETE CASCADE,
  set_number           INTEGER NOT NULL,
  completed            BOOLEAN NOT NULL DEFAULT false,
  completed_at         TIMESTAMPTZ,
  UNIQUE (workout_exercise_id, set_number)
);
CREATE INDEX IF NOT EXISTS workout_sets_we_idx ON workout_sets (workout_exercise_id);

CREATE TABLE IF NOT EXISTS classes (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  class_type        TEXT NOT NULL,
  coach_name        TEXT NOT NULL,
  start_time        TIMESTAMP NOT NULL,  -- gym-local wall-clock time
  duration_minutes  INTEGER NOT NULL CHECK (duration_minutes > 0),
  capacity          INTEGER NOT NULL CHECK (capacity > 0),
  intensity         TEXT NOT NULL CHECK (intensity IN ('Low', 'Medium', 'High')),
  UNIQUE (title, start_time)
);
CREATE INDEX IF NOT EXISTS classes_start_time_idx ON classes (start_time);
