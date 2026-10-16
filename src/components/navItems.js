import { LayoutDashboard, Dumbbell, Timer, TrendingUp, CalendarDays, User } from 'lucide-react'

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { to: '/library', label: 'Workout Library', short: 'Library', icon: Dumbbell },
  { to: '/workout', label: 'Live Workout', short: 'Train', icon: Timer, featured: true },
  { to: '/progress', label: 'Progress', short: 'Progress', icon: TrendingUp },
  { to: '/classes', label: 'Classes', short: 'Classes', icon: CalendarDays },
  { to: '/profile', label: 'Profile', short: 'Me', icon: User },
]
