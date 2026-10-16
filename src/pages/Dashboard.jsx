import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Play, Flame, Timer, Dumbbell, Target, CalendarDays, ArrowRight, Clock, Zap, CheckCircle2, ClipboardList } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import GlassCard from '../components/GlassCard'
import ProgressRing from '../components/ProgressRing'
import AnimatedCounter from '../components/AnimatedCounter'
import QuoteCard from '../components/QuoteCard'
import ChartTooltip from '../components/ChartTooltip'
import ErrorState from '../components/ErrorState'
import { CardSkeleton, Skeleton } from '../components/Skeleton'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useChartColors } from '../context/ThemeContext'
import { useApi } from '../lib/useApi'
import { percent } from '../lib/progress'
import { classes } from '../data/mockData'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

// Rough session length: ~40s of work per set plus the prescribed rest.
const estimateMinutes = (exercises) =>
  Math.max(5, Math.round(exercises.reduce((s, e) => s + e.sets.length * (40 + e.rest), 0) / 60))

const groupsOf = (exercises) => [...new Set(exercises.map((e) => e.group))].join(' · ')

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <CardSkeleton className="h-72 lg:col-span-2" lines={4} />
      <CardSkeleton className="h-72" />
      <div className="glass grid grid-cols-3 gap-6 p-6 lg:col-span-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton className="h-24 w-24 !rounded-full sm:h-36 sm:w-36" />
            <Skeleton className="mt-3 h-4 w-20" />
          </div>
        ))}
      </div>
      <CardSkeleton className="h-72 lg:col-span-2" />
      <CardSkeleton className="h-72" />
    </div>
  )
}

function TodayCard({ workout }) {
  if (!workout || workout.exercises.length === 0) {
    return (
      <GlassCard className="flex flex-col items-start justify-center overflow-hidden p-6 md:p-7 lg:col-span-2">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lime/15 blur-3xl" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-3 py-1 text-xs font-semibold text-accent">
          <Zap className="h-3.5 w-3.5" /> Today's workout
        </span>
        <div className="relative mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-fg/[0.05] ring-1 ring-line/10">
          <ClipboardList className="h-6 w-6 animate-float text-accent" />
        </div>
        <h2 className="relative mt-4 text-2xl font-bold md:text-3xl">No workout yet today.</h2>
        <p className="relative mt-1 text-muted">Pick one from the Library! Add a few exercises and they'll show up right here.</p>
        <Link to="/library" className="btn-primary group relative mt-6">
          <Dumbbell className="h-4 w-4" /> Open the Library
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </GlassCard>
    )
  }

  const done = workout.status === 'completed'
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0)
  const doneSets = workout.exercises.reduce((s, e) => s + e.sets.filter((x) => x.completed).length, 0)

  return (
    <GlassCard className="overflow-hidden p-0 lg:col-span-2">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lime/15 blur-3xl" />
      <div className="relative p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-3 py-1 text-xs font-semibold text-accent">
              <Zap className="h-3.5 w-3.5" /> Today's workout
            </span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">{workout.name}</h2>
            <p className="mt-1 text-muted">{groupsOf(workout.exercises)}</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-display text-3xl font-bold">
              {done ? workout.durationMinutes : estimateMinutes(workout.exercises)}
              <span className="text-base text-muted"> min</span>
            </p>
            <p className="text-sm text-muted">{done ? 'trained' : `${doneSets}/${totalSets} sets done`}</p>
          </div>
        </div>

        <div className="no-scrollbar -mx-6 mt-6 flex gap-2 overflow-x-auto px-6 md:-mx-7 md:px-7">
          {workout.exercises.map((e, i) => (
            <div key={e.id} className="shrink-0 rounded-2xl border border-line/[0.08] bg-fg/[0.03] px-4 py-3">
              <p className="text-xs text-muted">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-0.5 whitespace-nowrap font-medium">{e.name}</p>
              <p className="text-xs text-muted">{e.sets.length} × {e.reps}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {done ? (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-lime/15 px-5 py-3 font-display font-semibold text-accent">
              <CheckCircle2 className="h-5 w-5" /> Completed in {workout.durationMinutes} min — nice work!
            </span>
          ) : (
            <Link to="/workout" className="btn-primary group">
              <Play className="h-4 w-4 fill-current" /> {workout.status === 'in_progress' ? 'Continue' : 'Start'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          {!done && <Link to="/library" className="btn-ghost">Add exercises</Link>}
        </div>
      </div>
    </GlassCard>
  )
}

export default function Dashboard() {
  const { bookings } = useApp()
  const { user } = useAuth()
  const colors = useChartColors()
  const { data, error, loading, reload } = useApi('dashboard')
  const nextClass = classes.find((c) => bookings.includes(c.id))

  const header = {
    eyebrow: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    title: `${greeting()}, ${user?.name ?? 'athlete'} 👋`,
  }

  if (loading && !data) return <PageWrapper {...header} subtitle="Loading your week…"><DashboardSkeleton /></PageWrapper>
  if (error && !data) return <PageWrapper {...header}><ErrorState error={error} onRetry={reload} /></PageWrapper>

  const { week, activity, streak, todayWorkout } = data
  const lastIdx = activity.length - 1
  const totalMinutes = activity.reduce((s, d) => s + d.minutes, 0)
  const activeDays = activity.filter((d) => d.minutes > 0).length
  const left = week.workouts.target - week.workouts.done
  const subtitle =
    left <= 0
      ? "You've smashed this week's workout goal. Legend. 🏆"
      : `You're ${left} workout${left === 1 ? '' : 's'} away from this week's goal. Let's go.`

  const rings = [
    { label: 'Workouts', icon: Dumbbell, value: week.workouts.done, max: week.workouts.target, display: `${week.workouts.done}/${week.workouts.target}`, from: '#C6FF3D', to: '#86EFAC' },
    { label: 'Active min', icon: Timer, value: week.minutes.done, max: week.minutes.target, display: week.minutes.done, from: '#22E5FF', to: '#60A5FA' },
    { label: 'Goals hit', icon: Target, value: week.goals.done, max: week.goals.target, display: `${week.goals.done}/${week.goals.target}`, from: '#FB923C', to: '#F472B6' },
  ]

  return (
    <PageWrapper {...header} subtitle={subtitle}>
      <div className="grid gap-4 lg:grid-cols-3">
        <TodayCard workout={todayWorkout} />

        {/* Streak */}
        <GlassCard className="flex flex-col overflow-hidden">
          <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="flex items-center justify-between">
            <p className="eyebrow">Streak</p>
            <span className="text-xs text-muted">{streak > 0 ? 'Keep it alive!' : 'Start one today'}</span>
          </div>
          <div className="my-auto flex items-center gap-4 py-6">
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.3 }}
              className={`relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-orange-400 to-rose-500 ${streak ? 'shadow-[0_0_40px_-6px_rgba(251,146,60,0.7)]' : 'opacity-50 grayscale'}`}
            >
              <Flame className={`h-10 w-10 fill-white/30 text-white ${streak ? 'animate-beat' : ''}`} />
            </motion.div>
            <div>
              <p className="font-display text-6xl font-bold leading-none">
                <AnimatedCounter value={streak} duration={1.5} />
              </p>
              <p className="mt-1 text-muted">day{streak === 1 ? '' : 's'} in a row</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {activity.map((d, i) => (
              <div key={d.date} className="flex-1 text-center">
                <div className={`mx-auto mb-1 h-2 rounded-full ${d.minutes > 0 ? 'bg-gradient-to-r from-orange-400 to-rose-500' : 'bg-fg/10'} ${i === lastIdx ? 'ring-2 ring-orange-400/40 ring-offset-2 ring-offset-transparent' : ''}`} />
                <span className={`text-[11px] ${i === lastIdx ? 'font-bold text-fg' : 'text-muted'}`}>{d.day[0]}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Progress rings */}
        <GlassCard className="lg:col-span-3" hover={false}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold">This week</h3>
            <span className="text-right text-sm text-muted" title={week.goals.items.map((g) => `${g.hit ? '✓' : '○'} ${g.label}`).join('\n')}>
              Goals: {week.goals.items.map((g) => g.label.toLowerCase()).join(', ')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            {rings.map((r) => (
              <div key={r.label} className="flex flex-col items-center">
                <div className="sm:hidden">
                  <ProgressRing value={r.value} max={r.max} size={92} stroke={8} from={r.from} to={r.to}>
                    <p className="font-display text-lg font-bold">{r.display}</p>
                  </ProgressRing>
                </div>
                <div className="hidden sm:block">
                  <ProgressRing value={r.value} max={r.max} size={140} stroke={12} from={r.from} to={r.to}>
                    <div>
                      <r.icon className="mx-auto mb-1 h-5 w-5 text-muted" />
                      <p className="font-display text-2xl font-bold">{r.display}</p>
                    </div>
                  </ProgressRing>
                </div>
                <p className="mt-3 text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted">{percent(r.value, r.max)}% of goal</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Weekly activity */}
        <GlassCard className="lg:col-span-2" hover={false}>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-semibold">Weekly activity</h3>
              <p className="text-sm text-muted">Active minutes · last 7 days</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold">
                <AnimatedCounter value={totalMinutes} /> <span className="text-sm font-normal text-muted">min</span>
              </p>
              <p className="text-xs text-muted">
                {activeDays} active day{activeDays === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 12 }} allowDecimals={false} domain={[0, (max) => Math.max(30, max)]} />
                <Tooltip cursor={{ fill: colors.grid }} content={<ChartTooltip unit=" min" labelMap={{ minutes: 'Active' }} />} />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]} animationDuration={1200} animationEasing="ease-out" minPointSize={2}>
                  {activity.map((d, i) => (
                    <Cell key={d.date} fill={i === lastIdx ? colors.cyan : colors.lime} fillOpacity={d.minutes ? 1 : 0.25} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <GlassCard>
            <div className="flex items-center justify-between">
              <p className="eyebrow">Next class</p>
              <CalendarDays className="h-4 w-4 text-muted" />
            </div>
            {nextClass ? (
              <>
                <p className="mt-3 font-display text-xl font-bold">{nextClass.title}</p>
                <p className="text-sm text-muted">{nextClass.type} · with {nextClass.coach}</p>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-accent" /> {nextClass.day} at {nextClass.time} · {nextClass.duration} min
                </div>
              </>
            ) : (
              <p className="mt-3 text-muted">No classes booked yet. Grab a spot before they fill up!</p>
            )}
            <Link to="/classes" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
              {nextClass ? 'View schedule' : 'Book a class'} <ArrowRight className="h-4 w-4" />
            </Link>
          </GlassCard>
          <QuoteCard className="flex-1" />
        </div>
      </div>
    </PageWrapper>
  )
}
