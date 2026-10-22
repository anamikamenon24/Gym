import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

const ToastContext = createContext(null)

const styles = {
  success: { icon: CheckCircle2, ring: 'text-accent', bar: 'bg-lime' },
  info: { icon: Info, ring: 'text-accent2', bar: 'bg-cyan' },
  error: { icon: AlertTriangle, ring: 'text-rose-400', bar: 'bg-rose-400' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    ({ title, message, type = 'success', duration = 3500 }) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t.slice(-2), { id, title, message, type, duration }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6 md:right-6 md:top-auto md:items-end">
        <AnimatePresence>
          {toasts.map((t) => {
            const s = styles[t.type] || styles.success
            const Icon = s.icon
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="glass pointer-events-auto relative w-full max-w-sm overflow-hidden !rounded-2xl p-4 pr-10"
                role="status"
              >
                <div className="flex gap-3">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.ring}`} />
                  <div>
                    <p className="font-display font-semibold">{t.title}</p>
                    {t.message && <p className="mt-0.5 text-sm text-muted">{t.message}</p>}
                  </div>
                </div>
                <button onClick={() => dismiss(t.id)} className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-fg" aria-label="Dismiss">
                  <X className="h-4 w-4" />
                </button>
                <motion.div
                  className={`absolute bottom-0 left-0 h-0.5 ${s.bar}`}
                  initial={{ width: '100%' }}
                  animate={{ width: 0 }}
                  transition={{ duration: t.duration / 1000, ease: 'linear' }}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
