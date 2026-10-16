import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Dumbbell, Timer, Plus, Check, Repeat, SearchX, X, Loader2, Play } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import DifficultyBadge from '../components/DifficultyBadge'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import { CardSkeleton } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { useApi } from '../lib/useApi'
import { api } from '../lib/api'

const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

const groupAccent = {
  Chest: 'from-lime/30', Back: 'from-cyan/30', Legs: 'from-violet-500/30',
  Arms: 'from-orange-400/30', Core: 'from-pink-500/30', Cardio: 'from-rose-500/30',
}

export default function Library() {
  const [group, setGroup] = useState('All')
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState(() => new Set())
  const toast = useToast()

  const ex = useApi('exercises')
  const today = useApi('workouts')
  const exercises = ex.data?.exercises ?? []
  const workout = today.data?.workout
  const addedIds = new Set(workout?.exercises.map((e) => e.exerciseId) ?? [])
  const workoutDone = workout?.status === 'completed'

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return exercises.filter(
      (e) => (group === 'All' || e.group === group) && (e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)),
    )
  }, [exercises, group, query])

  const reset = () => {
    setGroup('All')
    setQuery('')
  }

  const add = async (e) => {
    setPending((p) => new Set(p).add(e.id))
    // Optimistically mark it as added
    today.setData((d) => ({
      workout: { ...(d?.workout ?? { status: 'planned', exercises: [] }), exercises: [...(d?.workout?.exercises ?? []), { exerciseId: e.id, sets: [] }] },
    }))
    try {
      const { workout } = await api('workouts', { method: 'POST', body: { exerciseId: e.id } })
      today.setData({ workout })
      toast({ title: 'Added to today’s workout', message: `${e.name} · ${e.sets} sets` })
    } catch (err) {
      today.reload()
      toast({ title: "Couldn't add that one", message: err.message, type: 'error' })
    } finally {
      setPending((p) => {
        const n = new Set(p)
        n.delete(e.id)
        return n
      })
    }
  }

  const count = workout?.exercises.length ?? 0

  return (
    <PageWrapper
      eyebrow="Workout library"
      title="Find your next move"
      subtitle={ex.data ? `${exercises.length} exercises across 6 muscle groups. Add a few to build today's workout.` : 'Loading exercises…'}
      action={
        count > 0 && !workoutDone ? (
          <Link to="/workout" className="btn-primary">
            <Play className="h-4 w-4 fill-current" /> Start workout · {count}
          </Link>
        ) : null
      }
    >
      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="sticky top-[65px] z-30 -mx-4 mb-6 bg-bg/70 px-4 py-3 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="relative mb-3 md:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            className="w-full rounded-2xl border border-line/10 bg-fg/[0.03] py-3 pl-11 pr-10 text-fg placeholder:text-muted focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-lime/10"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {muscleGroups.map((g) => (
            <button key={g} onClick={() => setGroup(g)} className={`chip shrink-0 ${group === g ? 'chip-active' : ''}`}>
              {g}
              {g !== 'All' && ex.data && <span className="ml-1.5 opacity-60">{exercises.filter((e) => e.group === g).length}</span>}
            </button>
          ))}
        </div>
      </motion.div>

      {ex.loading && !ex.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} className="h-64" lines={4} />)}
        </div>
      ) : ex.error && !ex.data ? (
        <ErrorState error={ex.error} onRetry={ex.reload} />
      ) : exercises.length === 0 ? (
        <EmptyState icon={Dumbbell} title="The library is empty" message="No exercises in the database yet. Run “npm run db:setup” to load the sample exercises." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No exercises found"
          message={`We couldn't find anything matching “${query}”${group !== 'All' ? ` in ${group}` : ''}. Try another word or muscle group.`}
          action={<button onClick={reset} className="btn-ghost">Clear filters</button>}
        />
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((e) => {
              const added = addedIds.has(e.id)
              const busy = pending.has(e.id)
              return (
                <motion.article
                  key={e.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className={`glass group relative flex flex-col overflow-hidden p-5 ${added ? 'ring-1 ring-lime/40' : ''}`}
                >
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${groupAccent[e.group]} to-transparent opacity-50 transition-opacity group-hover:opacity-100`} />
                  <div className="relative flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-fg/[0.06] ring-1 ring-line/10">
                        <Dumbbell className="h-5 w-5 text-accent" />
                      </div>
                      <DifficultyBadge level={e.difficulty} />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{e.group}</p>
                    <h3 className="mt-1 text-lg font-semibold leading-snug">{e.name}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted">{e.description}</p>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        [Repeat, e.sets, 'sets'],
                        [Dumbbell, e.reps, 'reps'],
                        [Timer, `${e.rest}s`, 'rest'],
                      ].map(([, v, l]) => (
                        <div key={l} className="rounded-xl bg-fg/[0.04] px-2 py-2.5 text-center">
                          <p className="font-display text-sm font-bold">{v}</p>
                          <p className="text-[11px] text-muted">{l}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-4">
                      <button
                        onClick={() => add(e)}
                        disabled={added || busy || workoutDone || today.loading}
                        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                          added
                            ? 'bg-lime/15 text-accent'
                            : 'bg-lime text-ink-950 hover:shadow-glow disabled:opacity-40 disabled:hover:shadow-none'
                        }`}
                        title={workoutDone ? "Today's workout is already finished" : undefined}
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {added ? "In today's workout" : "Add to today's workout"}
                      </button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </PageWrapper>
  )
}
