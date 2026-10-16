import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, User, Users, CalendarX, Check, Flame, Bell } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import EmptyState from '../components/EmptyState'
import { useToast } from '../context/ToastContext'
import { useApp } from '../context/AppContext'
import { classTypes, classes, days } from '../data/mockData'

const typeStyle = {
  Yoga: { grad: 'from-violet-500/25', dot: 'bg-violet-400', text: 'text-violet-400' },
  HIIT: { grad: 'from-orange-500/25', dot: 'bg-orange-400', text: 'text-orange-400' },
  Spin: { grad: 'from-cyan/25', dot: 'bg-cyan', text: 'text-accent2' },
  Boxing: { grad: 'from-rose-500/25', dot: 'bg-rose-400', text: 'text-rose-400' },
}

const todayIdx = (new Date().getDay() + 6) % 7

export default function Classes() {
  const [day, setDay] = useState(days[todayIdx])
  const [type, setType] = useState('All')
  const { bookings, toggleBooking } = useApp()
  const toast = useToast()

  const list = useMemo(() => classes.filter((c) => c.day === day && (type === 'All' || c.type === type)), [day, type])

  const book = (c) => {
    if (bookings.includes(c.id)) {
      toggleBooking(c.id)
      toast({ title: 'Booking cancelled', message: `Your spot in ${c.title} was released.`, type: 'info' })
      return
    }
    if (c.spots === 0) {
      toast({ title: "You're on the waitlist", message: `We'll ping you if a spot opens in ${c.title}.`, type: 'info' })
      return
    }
    toggleBooking(c.id)
    toast({ title: 'You’re booked! 🎉', message: `${c.title} · ${c.day} ${c.time} with ${c.coach}` })
  }

  return (
    <PageWrapper eyebrow="Class booking" title="This week's classes" subtitle="Yoga, HIIT, Spin and Boxing with our best coaches. Spots go fast.">
      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mb-6 space-y-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {days.map((d, i) => {
            const count = classes.filter((c) => c.day === d).length
            const active = d === day
            return (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`relative flex min-w-[64px] shrink-0 flex-col items-center rounded-2xl border px-3 py-3 transition md:flex-1 ${
                  active ? 'border-transparent text-ink-950' : 'border-line/10 text-muted hover:text-fg'
                }`}
              >
                {active && (
                  <motion.span layoutId="day-pill" className="absolute inset-0 rounded-2xl bg-lime shadow-glow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <span className="relative text-xs font-semibold uppercase">{i === todayIdx ? 'Today' : d}</span>
                <span className="relative mt-0.5 font-display text-lg font-bold">{count}</span>
                <span className="relative text-[10px]">classes</span>
              </button>
            )
          })}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {classTypes.map((t) => (
            <button key={t} onClick={() => setType(t)} className={`chip shrink-0 ${type === t ? 'chip-active' : ''}`}>
              {t !== 'All' && <span className={`mr-2 inline-block h-2 w-2 rounded-full ${typeStyle[t].dot}`} />}
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {list.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={type === 'All' ? 'Rest day — no classes' : `No ${type} on ${day}`}
          message={type === 'All' ? 'The studio is quiet today. Perfect time for a solo session or some mobility work.' : 'Try another day, or switch to a different class type.'}
          action={type !== 'All' && <button onClick={() => setType('All')} className="btn-ghost">Show all classes</button>}
        />
      ) : (
        <motion.div layout className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {list.map((c) => {
              const booked = bookings.includes(c.id)
              const spotsLeft = booked ? c.spots - 1 : c.spots
              const full = c.spots === 0 && !booked
              const pctFull = ((c.capacity - Math.max(spotsLeft, 0)) / c.capacity) * 100
              const s = typeStyle[c.type]
              return (
                <motion.article
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  className={`glass relative overflow-hidden p-5 ${booked ? 'ring-2 ring-lime/50' : ''}`}
                >
                  <div className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r ${s.grad} to-transparent opacity-60`} />
                  <div className="relative flex items-start gap-4">
                    <div className="w-16 shrink-0 text-center">
                      <p className="font-display text-2xl font-bold leading-none">{c.time}</p>
                      <p className="mt-1 text-xs text-muted">{c.duration} min</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${s.text}`}>{c.type}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Flame className="h-3 w-3" /> {c.intensity}
                        </span>
                        {booked && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-xs font-semibold text-accent">
                            <Check className="h-3 w-3" /> Booked
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 truncate text-lg font-semibold">{c.title}</h3>
                      <p className="inline-flex items-center gap-1.5 text-sm text-muted">
                        <User className="h-3.5 w-3.5" /> {c.coach}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-muted">
                        <Users className="h-3.5 w-3.5" /> {c.capacity - Math.max(spotsLeft, 0)}/{c.capacity} booked
                      </span>
                      <span className={`font-semibold ${full ? 'text-rose-400' : spotsLeft <= 3 ? 'text-orange-400' : 'text-accent'}`}>
                        {full ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-fg/[0.08]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctFull}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        className={`h-full rounded-full ${full ? 'bg-rose-400' : spotsLeft <= 3 ? 'bg-orange-400' : 'bg-pulse-gradient'}`}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => book(c)}
                    className={`relative mt-4 w-full ${booked ? 'btn-ghost' : full ? 'btn-ghost' : 'btn-primary'}`}
                  >
                    {booked ? 'Cancel booking' : full ? (<><Bell className="h-4 w-4" /> Join waitlist</>) : (<><Clock className="h-4 w-4" /> Book spot</>)}
                  </button>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </PageWrapper>
  )
}
