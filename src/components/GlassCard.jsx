import { motion } from 'framer-motion'

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function GlassCard({ children, className = '', hover = true, as = 'div', ...props }) {
  const Comp = motion[as] || motion.div
  return (
    <Comp
      variants={fadeUp}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={`glass relative p-5 transition-shadow duration-300 ${hover ? 'hover:shadow-[0_18px_50px_-18px_rgba(198,255,61,0.28)]' : ''} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  )
}
