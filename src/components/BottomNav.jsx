import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { navItems } from './navItems'

// Mobile nav: 5 slots, Profile lives in the mobile header avatar.
const items = navItems.filter((i) => i.to !== '/profile')

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      {/* More opaque than other glass so content scrolling underneath never washes out the labels */}
      <div className="glass flex items-center justify-around !rounded-[28px] px-2 py-2" style={{ background: 'rgb(var(--surface) / 0.92)' }}>
        {items.map(({ to, short, icon: Icon, featured }) => (
          <NavLink key={to} to={to} className="relative flex-1">
            {({ isActive }) =>
              featured ? (
                <span className="flex flex-col items-center">
                  <span
                    className={`-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-pulse-gradient text-ink-950 shadow-glow ring-4 ring-bg transition-transform ${
                      isActive ? 'scale-105' : ''
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className={`mt-1 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`}>{short}</span>
                </span>
              ) : (
                <span className="relative flex flex-col items-center gap-1 py-1.5">
                  {isActive && (
                    <motion.span
                      layoutId="bottom-active"
                      className="absolute -top-2 h-1 w-6 rounded-full bg-lime shadow-glow"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-accent' : 'text-muted'}`} />
                  <span className={`text-[11px] font-medium ${isActive ? 'text-fg' : 'text-muted'}`}>{short}</span>
                </span>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
