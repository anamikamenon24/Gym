import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dumbbell, ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'

export default function NotFound() {
  return (
    <main className="ambient grid min-h-dvh place-items-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass max-w-md p-10 text-center">
        <Logo />
        <motion.div animate={{ rotate: [0, -12, 12, -8, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }} className="mx-auto mt-8 grid h-20 w-20 place-items-center rounded-3xl bg-lime/10 ring-1 ring-lime/20">
          <Dumbbell className="h-10 w-10 text-accent" />
        </motion.div>
        <p className="mt-6 font-display text-6xl font-bold text-gradient">404</p>
        <h1 className="mt-2 text-2xl font-bold">This page skipped leg day</h1>
        <p className="mt-2 text-muted">We couldn't find what you were looking for. Let's get you back to training.</p>
        <Link to="/dashboard" className="btn-primary mt-8">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </motion.div>
    </main>
  )
}
