import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import Logo from './Logo'

export default function Footer({ compact = false }) {
  const year = new Date().getFullYear()
  if (compact) {
    return (
      <footer className="mx-auto hidden w-full max-w-6xl items-center justify-between px-10 pb-8 text-sm text-muted md:flex">
        <span>© {year} PulseFit. Train smarter. Get stronger.</span>
        <span className="inline-flex items-center gap-1.5">
          Made with <Heart className="h-3.5 w-3.5 fill-current text-accent" /> for lifters
        </span>
      </footer>
    )
  }
  return (
    <footer className="border-t border-line/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-10">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-muted">Plan workouts, track progress, book classes and stay motivated — all in one place.</p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          {/* Only screens that exist — no placeholder links */}
          {[
            ['Train', [['Workout Library', '/library'], ['Live Workout', '/workout'], ['Progress', '/progress']]],
            ['Explore', [['Features', '/#features'], ['Classes', '/classes'], ['Dashboard', '/dashboard']]],
            ['Account', [['Sign up', '/signup'], ['Log in', '/login'], ['Profile', '/profile']]],
          ].map(([h, links]) => (
            <div key={h}>
              <p className="eyebrow mb-3">{h}</p>
              <ul className="space-y-2">
                {links.map(([label, to]) => (
                  <li key={label}>
                    {to.startsWith('/#') ? (
                      <a href={to} className="text-muted transition hover:text-fg">{label}</a>
                    ) : (
                      <Link to={to} className="text-muted transition hover:text-fg">{label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line/[0.06] py-6 text-center text-sm text-muted">© {year} PulseFit. All rights reserved.</div>
    </footer>
  )
}
