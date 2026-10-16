import { animate, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const format = (n, decimals) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

export default function AnimatedCounter({ value, duration = 2, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [inView, value, duration])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {format(display, decimals)}
      {suffix}
    </span>
  )
}
