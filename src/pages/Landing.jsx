import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Dumbbell, Flame, Timer, Trophy, CalendarDays, TrendingUp, Play, HeartPulse, Sparkles, Check,
} from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'
import AnimatedCounter from '../components/AnimatedCounter'
import ProgressRing from '../components/ProgressRing'
import GlassCard, { fadeUp } from '../components/GlassCard'
import QuoteCard from '../components/QuoteCard'
import UserMenu from '../components/UserMenu'
import { Skeleton } from '../components/Skeleton'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../lib/useApi'

const features = [
  { icon: Dumbbell, title: 'Smart workout library', text: 'Exercises filtered by muscle group, with sets, reps and difficulty built in.' },
  { icon: Timer, title: 'Live workout mode', text: 'A rest timer that starts itself and sets you tick off as you go.' },
  { icon: TrendingUp, title: 'Progress that shows', text: 'Strength curves and PR trophies that make every kilo count.' },
  { icon: CalendarDays, title: 'One-tap class booking', text: 'Yoga, HIIT, Spin and Boxing — see spots left and grab yours.' },
  { icon: Flame, title: 'Streaks & rewards', text: 'Daily streaks, badges and achievements that keep you showing up.' },
  { icon: Trophy, title: 'Personal records', text: 'Every PR is tracked automatically and celebrated loudly.' },
]

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[420px]">
      <div className="absolute inset-8 rounded-full bg-lime/20 blur-[90px]" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="glass absolute inset-x-6 top-6 bottom-16 flex flex-col p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Today</p>
            <p className="mt-1 font-display text-2xl font-bold">Push Power</p>
          </div>
          <span className="rounded-full bg-lime/15 px-3 py-1 text-xs font-semibold text-accent">48 min</span>
        </div>
        <div className="my-auto grid place-items-center">
          <ProgressRing value={78} size={190} stroke={14}>
            <div>
              <p className="font-display text-5xl font-bold">
                <AnimatedCounter value={78} />%
              </p>
              <p className="text-sm text-muted">weekly goal</p>
            </div>
          </ProgressRing>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['4/5', 'Workouts'], ['212', 'Minutes'], ['6', 'Goals']].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-fg/[0.04] py-3">
              <p className="font-display text-lg font-bold">{v}</p>
              <p className="text-[11px] text-muted">{l}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating streak */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute -left-2 top-1/3 sm:-left-10"
      >
        <div className="glass flex animate-float items-center gap-3 !rounded-2xl px-4 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/15">
            <Flame className="h-5 w-5 animate-beat text-orange-400" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none">12 days</p>
            <p className="text-xs text-muted">Streak 🔥</p>
          </div>
        </div>
      </motion.div>

      {/* Floating heart rate */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute -right-2 top-10 sm:-right-8"
      >
        <div className="glass !rounded-2xl px-4 py-3 [animation-delay:1.5s] animate-float">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-400" />
            <span className="font-display text-lg font-bold">142</span>
            <span className="text-xs text-muted">bpm</span>
          </div>
          <svg viewBox="0 0 120 30" className="mt-1 h-6 w-28">
            <motion.path
              d="M0 15 H30 L36 4 L44 26 L50 10 L56 15 H120"
              fill="none"
              stroke="#22E5FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.4, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Floating PR */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-2 right-2 sm:-right-4"
      >
        <div className="glass flex items-center gap-3 !rounded-2xl px-4 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/15">
            <Trophy className="h-5 w-5 text-amber-400" />
          </span>
          <div>
            <p className="text-xs text-muted">New PR · Deadlift</p>
            <p className="font-display text-lg font-bold leading-none">125 kg</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const stats = useApi('stats')
  const startLink = user ? '/dashboard' : '/signup'
  const statItems = stats.data && [
    { label: stats.data.members === 1 ? 'Member' : 'Members', value: stats.data.members },
    { label: 'Workouts completed', value: stats.data.workoutsCompleted },
    { label: 'Classes this week', value: stats.data.classesThisWeek },
  ]

  return (
    <div className="ambient relative min-h-dvh overflow-x-hidden">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[900px]" />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-line/[0.06] bg-bg/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a href="#features" className="transition hover:text-fg">Features</a>
            <Link to="/classes" className="transition hover:text-fg">Classes</Link>
            <Link to="/library" className="transition hover:text-fg">Workouts</Link>
            <Link to="/progress" className="transition hover:text-fg">Progress</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/dashboard" className="btn-primary hidden !px-4 !py-2.5 text-sm sm:inline-flex">
                  Open app <ArrowRight className="h-4 w-4" />
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <span className="hidden sm:block">
                  <UserMenu />
                </span>
                <Link to="/signup" className="btn-primary !px-4 !py-2.5 text-sm">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:px-10">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3.5 py-1.5 text-sm font-medium text-accent">
            <Sparkles className="h-4 w-4" /> New: Live mode with auto rest timers
          </motion.div>
          <motion.h1 variants={fadeUp} className="mt-6 text-[clamp(2.75rem,8vw,5.25rem)] font-bold leading-[0.95]">
            Train smarter.
            <br />
            <span className="text-gradient animate-shimmer">Get stronger.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-lg text-lg text-muted">
            PulseFit plans your workouts, tracks every rep, books your favourite classes and keeps your streak alive —
            so all you have to do is show up.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link to={startLink} className="btn-primary group text-lg !px-7 !py-4">
              <Play className="h-5 w-5 fill-current" /> Start Your Workout
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to={user ? '/library' : '/login'} className="btn-ghost text-lg !px-7 !py-4">
              {user ? 'Browse workouts' : 'Log in'}
            </Link>
          </motion.div>
          <motion.ul variants={fadeUp} className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {['Free 14-day trial', 'No equipment needed to start', 'Cancel anytime'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-accent" /> {t}
              </li>
            ))}
          </motion.ul>
        </motion.div>
        <HeroVisual />
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="glass grid grid-cols-1 divide-y divide-line/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          {statItems
            ? statItems.map((s) => (
                <motion.div key={s.label} variants={fadeUp} className="px-6 py-8 text-center">
                  <p className="font-display text-4xl font-bold md:text-5xl">
                    <AnimatedCounter value={s.value} duration={2.4} className="text-gradient" />
                  </p>
                  <p className="mt-2 text-muted">{s.label}</p>
                </motion.div>
              ))
            : stats.error
              ? (
                <div className="px-6 py-8 text-center text-muted sm:col-span-3">
                  Live stats are catching their breath — we couldn't reach the server.{' '}
                  <button onClick={stats.reload} className="font-semibold text-accent hover:underline">Try again</button>
                </div>
              )
              : ['a', 'b', 'c'].map((k) => (
                  <div key={k} className="flex flex-col items-center px-6 py-8">
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="mt-3 h-4 w-24" />
                  </div>
                ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Everything in one app</p>
          <h2 className="mt-3 text-4xl font-bold md:text-5xl">
            Built for the way you <span className="text-gradient">actually train</span>
          </h2>
        </div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map(({ icon: Icon, title, text }) => (
            <GlassCard key={title} className="group p-6">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-lime/10 ring-1 ring-lime/20 transition group-hover:bg-lime group-hover:shadow-glow">
                <Icon className="h-6 w-6 text-accent transition group-hover:text-ink-950" />
              </div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </GlassCard>
          ))}
        </motion.div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl bg-pulse-gradient p-8 text-ink-950 md:p-12">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
            <h2 className="relative text-3xl font-bold md:text-4xl">Your next PR starts today.</h2>
            <p className="relative mt-3 max-w-md text-ink-950/75">Plan it, track it, crush it — your training, all in one place.</p>
            <Link
              to={startLink}
              className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-ink-950 px-6 py-3.5 font-display font-semibold text-lime transition hover:-translate-y-0.5"
            >
              Start Your Workout <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <QuoteCard className="flex items-center" />
        </div>
      </section>

      </main>

      <Footer />
    </div>
  )
}
