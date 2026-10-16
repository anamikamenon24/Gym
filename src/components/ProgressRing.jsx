import { motion } from 'framer-motion'
import { useId } from 'react'
import { ratio } from '../lib/progress'

export default function ProgressRing({
  value,
  max = 100,
  size = 120,
  stroke = 10,
  from = '#C6FF3D',
  to = '#22E5FF',
  children,
  duration = 1.4,
  animateKey,
}) {
  const id = useId().replace(/:/g, '')
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = ratio(value, max)

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} style={{ stroke: 'rgb(var(--line) / 0.08)' }} />
        <motion.circle
          key={animateKey}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${from}66)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
