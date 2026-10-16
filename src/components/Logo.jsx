import { Link } from 'react-router-dom'

export function PulseMark({ className = 'h-9 w-9' }) {
  return (
    <span className={`relative inline-grid place-items-center rounded-xl bg-ink-900 ring-1 ring-white/10 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-[70%] w-[70%]" aria-hidden="true">
        <defs>
          <linearGradient id="pulse-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#C6FF3D" />
            <stop offset="1" stopColor="#22E5FF" />
          </linearGradient>
        </defs>
        <path
          d="M4 34h13l5-13 9 25 6-18 4 6h19"
          fill="none"
          stroke="url(#pulse-g)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="[stroke-dasharray:120] [animation:dash_2.4s_ease-in-out_infinite]"
        />
      </svg>
      <span className="absolute inset-0 -z-10 rounded-xl bg-lime/30 blur-md" />
    </span>
  )
}

export default function Logo({ to = '/', size = 'md' }) {
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5" aria-label="PulseFit home">
      <PulseMark className={size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'} />
      <span className={`font-display font-bold italic tracking-tight ${text}`}>
        <span className="text-gradient animate-shimmer">PulseFit</span>
      </span>
    </Link>
  )
}
