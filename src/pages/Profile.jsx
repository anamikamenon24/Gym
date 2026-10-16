import { motion } from 'framer-motion'
import {
  Crown, MapPin, CalendarDays, Lock, Settings, Bell, Moon, Sun, LogOut, ChevronRight,
  Flame, Sunrise, Trophy, Calendar, Dumbbell, Timer, Zap, Medal, HeartPulse, Award,
} from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { achievements } from '../data/mockData'

const Icons = { Flame, Sunrise, Trophy, Calendar, Dumbbell, Timer, Zap, Medal, HeartPulse, Award }

export default function Profile() {
  const { user } = useApp()
  const { theme, toggle } = useTheme()
  const toast = useToast()
  const unlocked = achievements.filter((a) => a.unlocked).length
  const xpPct = (user.xp / user.xpNext) * 100

  return (
    <PageWrapper>
      {/* Header card */}
      <GlassCard hover={false} className="overflow-hidden p-0">
        <div className="relative h-32 bg-pulse-gradient md:h-40">
          <div className="grid-bg absolute inset-0 opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="grid h-28 w-28 place-items-center rounded-full bg-ink-900 p-1 ring-4 ring-bg">
                <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-ink-700 to-ink-900 font-display text-4xl font-bold text-lime">
                  {user.initials}
                </div>
              </div>
              <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-lime text-ink-950 ring-4 ring-bg">
                <Crown className="h-4 w-4" />
              </span>
            </motion.div>
            <button onClick={() => toast({ title: 'Coming soon', message: 'Profile editing lands in the next update.', type: 'info' })} className="btn-ghost !py-2.5 text-sm">
              <Settings className="h-4 w-4" /> Edit profile
            </button>
          </div>
          <h1 className="mt-4 text-3xl font-bold">{user.fullName}</h1>
          <p className="text-muted">{user.handle}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {user.homeGym}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Member since {user.memberSince}</span>
          </div>
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Membership */}
        <GlassCard className="overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
          <p className="eyebrow">Membership</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-yellow-500 shadow-[0_0_30px_-6px_rgba(251,191,36,0.7)]">
              <Crown className="h-6 w-6 text-ink-950" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{user.membership}</p>
              <p className="text-sm text-muted">Unlimited classes · PT check-ins</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-semibold">Level {user.level}</span>
              <span className="tabular-nums text-muted">{user.xp.toLocaleString()} / {user.xpNext.toLocaleString()} XP</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-fg/[0.08]">
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }} className="h-full rounded-full bg-pulse-gradient shadow-glow" />
            </div>
            <p className="mt-2 text-xs text-muted">{(user.xpNext - user.xp).toLocaleString()} XP to Level {user.level + 1}</p>
          </div>
        </GlassCard>

        {/* Totals */}
        <GlassCard className="lg:col-span-2" hover={false}>
          <p className="eyebrow">Lifetime</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Workouts', user.totals.workouts],
              ['Hours', user.totals.hours],
              ['PRs', user.totals.prs],
              ['Classes', user.totals.classes],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-fg/[0.04] p-4">
                <p className="font-display text-3xl font-bold"><AnimatedCounter value={v} /></p>
                <p className="text-sm text-muted">{l}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Achievements */}
      <div className="mb-4 mt-10 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">Achievements</h2>
          <p className="text-sm text-muted">{unlocked} of {achievements.length} badges unlocked</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {achievements.map((a, i) => {
          const Icon = Icons[a.icon] || Icons.Award
          return (
            <GlassCard key={a.id} className={`flex flex-col items-center p-5 text-center ${a.unlocked ? '' : 'opacity-70'}`}>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 260, damping: 15, delay: i * 0.05 }}
                className={`relative grid h-16 w-16 place-items-center rounded-full ${a.unlocked ? 'bg-pulse-gradient shadow-glow' : 'bg-fg/[0.06] ring-1 ring-line/10'}`}
              >
                <Icon className={`h-7 w-7 ${a.unlocked ? 'text-ink-950' : 'text-muted'}`} />
                {!a.unlocked && (
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-surface ring-1 ring-line/10">
                    <Lock className="h-3 w-3 text-muted" />
                  </span>
                )}
              </motion.div>
              <p className="mt-3 font-display font-semibold leading-tight">{a.title}</p>
              <p className="mt-1 text-xs text-muted">{a.desc}</p>
              {!a.unlocked && (
                <div className="mt-3 w-full">
                  <div className="h-1.5 overflow-hidden rounded-full bg-fg/[0.08]">
                    <div className="h-full rounded-full bg-fg/40" style={{ width: `${(a.progress / a.target) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] tabular-nums text-muted">{a.progress.toLocaleString()} / {a.target.toLocaleString()}</p>
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>

      {/* Settings */}
      <h2 className="mb-4 mt-10 text-2xl font-bold">Settings</h2>
      <GlassCard hover={false} className="divide-y divide-line/[0.06] p-2">
        <button onClick={toggle} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition hover:bg-fg/[0.04]">
          {theme === 'dark' ? <Moon className="h-5 w-5 text-muted" /> : <Sun className="h-5 w-5 text-muted" />}
          <span className="flex-1 font-medium">Appearance</span>
          <span className="text-sm text-muted">{theme === 'dark' ? 'Dark' : 'Light'}</span>
          <span className={`relative h-6 w-11 rounded-full transition ${theme === 'dark' ? 'bg-lime' : 'bg-fg/20'}`}>
            <motion.span layout className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${theme === 'dark' ? 'right-0.5' : 'left-0.5'}`} />
          </span>
        </button>
        <button onClick={() => toast({ title: 'Reminders on', message: "We'll nudge you at 6:30am on training days." })} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition hover:bg-fg/[0.04]">
          <Bell className="h-5 w-5 text-muted" />
          <span className="flex-1 font-medium">Workout reminders</span>
          <ChevronRight className="h-4 w-4 text-muted" />
        </button>
        <button onClick={() => toast({ title: "Can't sign out right now", message: 'This is a demo — there is no account backend yet.', type: 'error' })} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left text-rose-400 transition hover:bg-rose-500/10">
          <LogOut className="h-5 w-5" />
          <span className="flex-1 font-medium">Sign out</span>
        </button>
      </GlassCard>
    </PageWrapper>
  )
}
