import { motion } from 'framer-motion'

export default function PageWrapper({ title, subtitle, eyebrow, action, children }) {
  return (
    <motion.main
      initial="hidden"
      animate="show"
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
      className="mx-auto w-full max-w-6xl px-4 pb-safe pt-4 sm:px-6 md:pb-12 md:pt-10 lg:px-10"
    >
      {title && (
        <motion.header
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8"
        >
          <div>
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-xl text-muted">{subtitle}</p>}
          </div>
          {action}
        </motion.header>
      )}
      {children}
    </motion.main>
  )
}
