import { motion } from 'framer-motion'
import { CloudOff, RotateCcw } from 'lucide-react'

// Friendly full-card error with a retry button (e.g. database unreachable).
export default function ErrorState({ error, onRetry, title }) {
  const offline = !error?.status || error.status >= 500
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass flex flex-col items-center px-6 py-14 text-center">
      <div className="relative mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-orange-400/10 ring-1 ring-orange-400/25">
        <CloudOff className="h-7 w-7 text-orange-400" />
      </div>
      <h3 className="text-xl font-semibold">{title || (offline ? "We can't reach the gym floor" : 'Something went wrong')}</h3>
      <p className="mt-2 max-w-sm text-muted">{error?.message || 'Please try again in a moment.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-6">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      )}
    </motion.div>
  )
}
