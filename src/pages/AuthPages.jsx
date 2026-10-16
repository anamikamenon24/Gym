import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Lock, User, Dumbbell, Timer, AlertTriangle } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="ambient relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative w-full max-w-md overflow-hidden p-7 sm:p-9"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-lime/15 blur-3xl" />
        <div className="relative">
          <Logo />
          <h1 className="mt-8 text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </motion.div>
    </div>
  )
}

function Field({ icon: Icon, label, type = 'text', trailing, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type={type}
          className="w-full rounded-2xl border border-line/10 bg-fg/[0.03] py-3 pl-11 pr-11 text-fg placeholder:text-muted/70 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-lime/10"
          {...props}
        />
        {trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>}
      </span>
    </label>
  )
}

function PasswordField(props) {
  const [show, setShow] = useState(false)
  return (
    <Field
      icon={Lock}
      label="Password"
      type={show ? 'text' : 'password'}
      trailing={
        <button type="button" onClick={() => setShow((s) => !s)} className="text-muted hover:text-fg" aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  )
}

function FormError({ message }) {
  if (!message) return null
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400 ring-1 ring-rose-500/20" role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {message}
    </motion.p>
  )
}

const Submit = ({ busy, children }) => (
  <button type="submit" disabled={busy} className="btn-primary group w-full !py-3.5">
    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
  </button>
)

export function Login() {
  const { user, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user && !busy) return <Navigate to={location.state?.from || '/dashboard'} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await login(form.email, form.password)
      toast({ title: `Welcome back, ${u.fullName.split(' ')[0]}! 💪` })
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={<>New to PulseFit? <Link to="/signup" className="font-semibold text-accent hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field icon={Mail} label="Email" type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordField autoComplete="current-password" required placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <FormError message={error} />
        <Submit busy={busy}>Log in</Submit>
      </form>
    </AuthShell>
  )
}

export function Signup() {
  const { user, signup } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', weeklyGoalWorkouts: 4, weeklyGoalMinutes: 180 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user && !busy) return <Navigate to="/dashboard" replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await signup({ ...form, weeklyGoalWorkouts: Number(form.weeklyGoalWorkouts), weeklyGoalMinutes: Number(form.weeklyGoalMinutes) })
      toast({ title: `Welcome to PulseFit, ${u.fullName.split(' ')[0]}! 🎉`, message: 'Pick a few exercises to build your first workout.' })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Start your journey"
      subtitle="Create your free account and set your weekly goals."
      footer={<>Already a member? <Link to="/login" className="font-semibold text-accent hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field icon={User} label="Full name" autoComplete="name" required placeholder="Alex Rivera" value={form.fullName} onChange={set('fullName')} />
        <Field icon={Mail} label="Email" type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} />
        <PasswordField autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" value={form.password} onChange={set('password')} />

        <div className="rounded-2xl border border-line/[0.08] bg-fg/[0.02] p-4">
          <p className="eyebrow mb-3">Your weekly goals</p>
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Dumbbell} label="Workouts" type="number" min={1} max={14} required value={form.weeklyGoalWorkouts} onChange={set('weeklyGoalWorkouts')} />
            <Field icon={Timer} label="Active minutes" type="number" min={10} max={3000} step={10} required value={form.weeklyGoalMinutes} onChange={set('weeklyGoalMinutes')} />
          </div>
        </div>

        <FormError message={error} />
        <Submit busy={busy}>Create account</Submit>
      </form>
    </AuthShell>
  )
}
