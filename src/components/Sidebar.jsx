import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, LogOut } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { useLogout } from './UserMenu'
import { navItems } from './navItems'
import { useApp } from '../context/AppContext'

export default function Sidebar() {
  const { user } = useApp()
  const onLogout = useLogout()
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line/[0.06] bg-surface/40 px-4 py-6 backdrop-blur-xl md:flex">
      <div className="px-2">
        <Logo to="/" />
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="relative">
            {({ isActive }) => (
              <span
                className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] font-medium transition-colors ${
                  isActive ? 'text-ink-950' : 'text-muted hover:bg-fg/[0.04] hover:text-fg'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-lime shadow-glow"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {user ? (
        <>
          <div className="glass !rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/15">
                <Flame className="h-5 w-5 animate-beat text-orange-400" />
              </div>
              <div>
                <p className="font-display text-lg font-bold leading-none">
                  {user.streak} day{user.streak === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-xs text-muted">Current streak</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 px-1">
            <NavLink to="/profile" className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pulse-gradient text-sm font-bold text-ink-950">
                {user.initials}
              </span>
              <span className="min-w-0 text-sm">
                <span className="block truncate font-semibold leading-tight">{user.name}</span>
                <span className="block text-xs text-muted">{user.membership}</span>
              </span>
            </NavLink>
            <div className="flex gap-1.5">
              <ThemeToggle />
              <button
                onClick={onLogout}
                aria-label="Log out"
                title="Log out"
                className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-fg/[0.03] text-muted transition hover:border-rose-400/40 hover:text-rose-400"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 px-1">
          <NavLink to="/login" className="btn-primary flex-1 !py-2.5 text-sm">
            Log in
          </NavLink>
          <ThemeToggle />
        </div>
      )}
    </aside>
  )
}
