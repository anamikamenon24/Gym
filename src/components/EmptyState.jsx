import { motion } from 'framer-motion'

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass flex flex-col items-center px-6 py-14 text-center"
    >
      <div className="relative mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-fg/[0.04] ring-1 ring-line/10">
        <Icon className="h-7 w-7 text-accent animate-float" />
        <span className="absolute inset-0 -z-10 rounded-2xl bg-lime/20 blur-xl" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-muted">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}
