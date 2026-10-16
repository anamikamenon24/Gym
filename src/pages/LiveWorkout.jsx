import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Check, Pause, Play, RotateCcw, SkipForward, Plus, Trophy, Flame, Timer, Dumbbell, ArrowRight, X, ClipboardList, Flag, Loader2 } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import ProgressRing from '../components/ProgressRing'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { CardSkeleton, Skeleton } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../lib/useApi'
import { api } from '../lib/api'

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const celebrate = () => {
  const colors = ['#C6FF3D', '#22E5FF', '#6BFFB0', '#FFFFFF']
  const end = Date.now() + 1800
  confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors, scalar: 1.1 })
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

const updateSet = (workout, setId, completed) => ({
  ...workout,
  exercises: workout.exercises.map((e) => ({
    ...e,
    sets: e.sets.map((s) => (s.id === setId ? { ...s, completed } : s)),
  })),
})

const NO_REST = { total: 0, endsAt: null, pausedLeft: null, label: '' }

export default function LiveWorkout() {
  const toast = useToast()
  const { refresh: refreshAuth } = useAuth()
  const { data, error, loading, reload, setData } = useApi('workouts')
  const workout = data?.workout

  const [rest, setRest] = useState(NO_REST)
  const [now, setNow] = useState(Date.now())
  const [localStart, setLocalStart] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const restDoneRef = useRef(false)
  const pendingRef = useRef(new Set())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [])

  const remaining = rest.pausedLeft ?? (rest.endsAt ? Math.max(0, (rest.endsAt - now) / 1000) : 0)
  const resting = rest.total > 0 && remaining > 0
  const paused = rest.pausedLeft != null

  useEffect(() => {
    if (rest.endsAt && !paused && remaining === 0 && !restDoneRef.current) {
      restDoneRef.current = true
      navigator.vibrate?.(300)
      toast({ title: 'Rest over 💪', message: 'Time for your next set.', type: 'info', duration: 2500 })
      setRest(NO_REST)
    }
  }, [remaining, rest.endsAt, paused, toast])

  if (loading && !data) {
    return (
      <PageWrapper eyebrow="Live workout" title="Warming up…">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="glass flex flex-col items-center p-6">
            <Skeleton className="h-64 w-64 !rounded-full" />
            <Skeleton className="mt-6 h-12 w-48" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <CardSkeleton key={i} className="h-36" lines={2} />)}
          </div>
        </div>
      </PageWrapper>
    )
  }
  if (error && !data) return <PageWrapper eyebrow="Live workout" title="Live workout"><ErrorState error={error} onRetry={reload} /></PageWrapper>
  if (!workout || workout.exercises.length === 0) {
    return (
      <PageWrapper eyebrow="Live workout" title="Ready when you are">
        <EmptyState
          icon={ClipboardList}
          title="No workout yet today."
          message="Pick one from the Library! Add a few exercises and come back here to train."
          action={<Link to="/library" className="btn-primary"><Dumbbell className="h-4 w-4" /> Open the Library</Link>}
        />
      </PageWrapper>
    )
  }

  const finished = workout.status === 'completed'
  const allSets = workout.exercises.flatMap((e) => e.sets)
  const totalSets = allSets.length
  const doneSets = allSets.filter((s) => s.completed).length
  const startedAt = workout.startedAt ? new Date(workout.startedAt).getTime() : localStart
  const elapsed = finished ? (workout.durationMinutes ?? 0) * 60 : startedAt ? Math.max(0, (now - startedAt) / 1000) : 0
  const currentEx = workout.exercises.find((e) => e.sets.some((s) => !s.completed))

  const startRest = (seconds, label) => {
    if (!seconds) return
    restDoneRef.current = false
    setRest({ total: seconds, endsAt: Date.now() + seconds * 1000, pausedLeft: null, label })
  }

  const finish = async () => {
    setFinishing(true)
    setRest(NO_REST)
    try {
      await Promise.allSettled([...pendingRef.current]) // make sure every tick is saved first
      const { workout: saved } = await api('workouts', { method: 'PATCH', body: { workoutId: workout.id, action: 'complete' } })
      setData({ workout: saved })
      setShowModal(true)
      setTimeout(celebrate, 150)
      refreshAuth() // updates the streak in the sidebar
    } catch (err) {
      toast({ title: "Couldn't save your workout", message: `${err.message} Your sets are safe — tap “Finish workout” to try again.`, type: 'error', duration: 6000 })
    } finally {
      setFinishing(false)
    }
  }

  const toggleSet = (ex, set, index) => {
    if (finished || finishing) return
    const completed = !set.completed
    const next = updateSet(workout, set.id, completed)
    setData({ workout: next }) // optimistic
    if (completed && !startedAt) setLocalStart(Date.now())

    const req = api('sets', { method: 'PATCH', body: { setId: set.id, completed } })
      .then(({ startedAt: serverStart }) => {
        if (serverStart) setData((d) => (d?.workout ? { workout: { ...d.workout, startedAt: serverStart, status: 'in_progress' } } : d))
      })
      .catch((err) => {
        setData((d) => (d?.workout ? { workout: updateSet(d.workout, set.id, !completed) } : d))
        toast({ title: "That set didn't save", message: err.message, type: 'error' })
        throw err
      })
      .finally(() => pendingRef.current.delete(req))
    pendingRef.current.add(req)
    req.catch(() => {})

    if (!completed) return
    if (next.exercises.every((e) => e.sets.every((s) => s.completed))) finish()
    else startRest(ex.rest, `Rest after ${ex.name} · set ${index + 1}`)
  }

  const togglePause = () => {
    if (!resting) return
    setRest((r) =>
      r.pausedLeft != null
        ? { ...r, endsAt: Date.now() + r.pausedLeft * 1000, pausedLeft: null }
        : { ...r, pausedLeft: Math.max(0, (r.endsAt - Date.now()) / 1000) },
    )
  }

  const addTime = () => {
    if (!resting) return
    setRest((r) =>
      r.pausedLeft != null ? { ...r, total: r.total + 15, pausedLeft: r.pausedLeft + 15 } : { ...r, total: r.total + 15, endsAt: r.endsAt + 15000 },
    )
  }

  const skip = () => {
    restDoneRef.current = true
    setRest(NO_REST)
  }

  const resetAll = async () => {
    if (finished) return
    skip()
    setLocalStart(null)
    try {
      await Promise.allSettled([...pendingRef.current])
      const { workout: saved } = await api('workouts', { method: 'PATCH', body: { workoutId: workout.id, action: 'reset' } })
      setData({ workout: saved })
      toast({ title: 'Workout restarted', message: 'Fresh start — all sets cleared.', type: 'info' })
    } catch (err) {
      toast({ title: "Couldn't restart", message: err.message, type: 'error' })
    }
  }

  return (
    <PageWrapper
      eyebrow="Live workout"
      title={workout.name}
      subtitle={[...new Set(workout.exercises.map((e) => e.group))].join(' · ')}
      action={
        <div className="flex items-center gap-2">
          <div className="glass flex items-center gap-2 !rounded-2xl px-4 py-2.5">
            <span className={`h-2 w-2 rounded-full ${startedAt && !finished ? 'animate-pulse bg-rose-500' : 'bg-fg/30'}`} />
            <span className="font-display text-lg font-bold tabular-nums">{fmt(elapsed)}</span>
          </div>
          {!finished && (
            <button onClick={resetAll} className="btn-ghost !px-3.5 !py-2.5" aria-label="Restart workout" title="Restart workout">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Timer */}
        <motion.section variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="glass relative overflow-hidden p-6 lg:sticky lg:top-8 lg:self-start">
          <div className={`absolute inset-0 transition-opacity duration-700 ${resting ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan/20 blur-3xl" />
          </div>
          <div className="relative flex flex-col items-center">
            <p className="eyebrow">{resting ? (paused ? 'Paused' : 'Resting') : finished ? 'Done' : 'Up next'}</p>
            <div className="my-6">
              <ProgressRing
                value={resting ? remaining : finished ? 1 : 0}
                max={resting ? rest.total : 1}
                size={260}
                stroke={16}
                from={resting ? '#22E5FF' : '#C6FF3D'}
                to={resting ? '#C6FF3D' : '#22E5FF'}
                duration={resting ? 0.25 : 0.8}
              >
                <div>
                  {resting ? (
                    <>
                      <p className="font-display text-7xl font-bold tabular-nums">{fmt(Math.ceil(remaining))}</p>
                      <p className="mt-1 text-sm text-muted">of {fmt(rest.total)}</p>
                    </>
                  ) : finished ? (
                    <Trophy className="mx-auto h-16 w-16 text-accent" />
                  ) : (
                    <>
                      <Timer className="mx-auto h-8 w-8 text-accent" />
                      <p className="mt-2 max-w-[160px] font-display text-lg font-semibold leading-tight">{currentEx?.name}</p>
                      <p className="mt-1 text-xs text-muted">{currentEx?.rest ? `${currentEx.rest}s rest after each set` : 'Tick a set to start'}</p>
                    </>
                  )}
                </div>
              </ProgressRing>
            </div>
            <p className="mb-5 h-5 text-center text-sm text-muted">{resting ? rest.label : ''}</p>
            <div className="flex items-center gap-3">
              <button onClick={addTime} disabled={!resting} className="btn-ghost !rounded-full !p-3.5 disabled:opacity-30" aria-label="Add 15 seconds">
                <Plus className="h-5 w-5" />
              </button>
              <button onClick={togglePause} disabled={!resting} className="btn-primary !rounded-full !p-5" aria-label={paused ? 'Resume' : 'Pause'}>
                {paused ? <Play className="h-7 w-7 fill-current" /> : <Pause className="h-7 w-7 fill-current" />}
              </button>
              <button onClick={skip} disabled={!resting} className="btn-ghost !rounded-full !p-3.5 disabled:opacity-30" aria-label="Skip rest">
                <SkipForward className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 w-full">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted">Workout progress</span>
                <span className="font-semibold tabular-nums">{doneSets}/{totalSets} sets</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-fg/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-pulse-gradient shadow-glow"
                  animate={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
            </div>

            {finished ? (
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                <Check className="h-4 w-4" /> Saved · {workout.durationMinutes} min
              </p>
            ) : (
              doneSets > 0 && (
                <button onClick={finish} disabled={finishing} className="btn-ghost mt-6 w-full">
                  {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                  {finishing ? 'Saving…' : doneSets === totalSets ? 'Finish workout' : 'Finish early'}
                </button>
              )
            )}
          </div>
        </motion.section>

        {/* Exercise list */}
        <div className="space-y-3">
          {workout.exercises.map((ex, idx) => {
            const exDone = ex.sets.length > 0 && ex.sets.every((s) => s.completed)
            const active = !finished && currentEx?.id === ex.id
            return (
              <motion.section
                key={ex.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className={`glass p-5 transition-all duration-300 ${active ? 'shadow-glow ring-2 ring-lime/50' : ''} ${exDone ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display font-bold transition ${exDone ? 'bg-lime text-ink-950' : 'bg-fg/[0.06] text-muted'}`}>
                    {exDone ? <Check className="h-5 w-5" /> : String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`truncate text-lg font-semibold ${exDone ? 'line-through decoration-lime/60' : ''}`}>{ex.name}</h3>
                    <p className="text-sm text-muted">{ex.sets.length} sets × {ex.reps} · {ex.rest}s rest</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ex.sets.map((s, i) => (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleSet(ex, s, i)}
                      disabled={finished}
                      className={`relative flex h-12 min-w-[64px] items-center justify-center gap-1.5 rounded-2xl border px-4 font-display font-semibold transition-colors disabled:cursor-default ${
                        s.completed ? 'border-transparent bg-lime text-ink-950 shadow-glow' : 'border-line/10 bg-fg/[0.03] text-fg hover:border-accent/50'
                      }`}
                      aria-pressed={s.completed}
                      aria-label={`${ex.name} set ${s.number}`}
                    >
                      <AnimatePresence initial={false}>
                        {s.completed && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      Set {s.number}
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )
          })}
        </div>
      </div>

      {/* Completion modal */}
      <AnimatePresence>
        {finished && showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.2 }}
              className="glass relative w-full max-w-md overflow-hidden p-8 text-center"
            >
              <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-muted hover:text-fg" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
              <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-lime/30 blur-3xl" />
              <motion.div
                initial={{ rotate: -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.4 }}
                className="relative mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-pulse-gradient shadow-glow"
              >
                <Trophy className="h-10 w-10 text-ink-950" />
              </motion.div>
              <h2 className="relative mt-6 text-3xl font-bold">Workout complete!</h2>
              <p className="relative mt-2 text-muted">You crushed {workout.name}. It's saved to your history 🔥</p>
              <div className="relative mt-6 grid grid-cols-3 gap-2">
                {[
                  [Timer, `${workout.durationMinutes}m`, 'Time'],
                  [Dumbbell, `${doneSets}/${totalSets}`, 'Sets'],
                  [Flame, workout.exercises.length, 'Exercises'],
                ].map(([Icon, v, l]) => (
                  <div key={l} className="rounded-2xl bg-fg/[0.05] py-3">
                    <Icon className="mx-auto h-4 w-4 text-accent" />
                    <p className="mt-1 font-display text-xl font-bold">{v}</p>
                    <p className="text-xs text-muted">{l}</p>
                  </div>
                ))}
              </div>
              <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to="/dashboard" className="btn-primary flex-1">
                  See dashboard <ArrowRight className="h-4 w-4" />
                </Link>
                <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
