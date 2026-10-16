import { Link, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// Name + logout when signed in, "Log in" when not. Used in the landing navbar and mobile header.
export default function UserMenu({ compact = false }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const onLogout = async () => {
    try {
      await logout()
      toast({ title: 'Logged out', message: 'See you at your next session 👋', type: 'info' })
      navigate('/')
    } catch (e) {
      toast({ title: "Couldn't log out", message: e.message, type: 'error' })
    }
  }

  if (!user) {
    return (
      <Link to="/login" className="btn-ghost !px-4 !py-2.5 text-sm">
        Log in
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link to="/profile" className="flex items-center gap-2" aria-label="Profile">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-pulse-gradient text-sm font-bold text-ink-950">{user.initials}</span>
        {!compact && <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>}
      </Link>
      <button
        onClick={onLogout}
        aria-label="Log out"
        title="Log out"
        className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-fg/[0.03] text-muted transition hover:border-rose-400/40 hover:text-rose-400"
      >
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    </div>
  )
}
