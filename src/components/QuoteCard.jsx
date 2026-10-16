import { Quote } from 'lucide-react'
import GlassCard from './GlassCard'
import { quoteOfTheDay } from '../data/mockData'

export default function QuoteCard({ className = '' }) {
  const q = quoteOfTheDay()
  return (
    <GlassCard className={`overflow-hidden ${className}`} hover={false}>
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-cyan/10 blur-2xl" />
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pulse-gradient text-ink-950">
          <Quote className="h-5 w-5" />
        </div>
        <div>
          <p className="eyebrow mb-1.5">Quote of the day</p>
          <p className="font-display text-lg font-medium leading-snug">“{q.text}”</p>
          <p className="mt-2 text-sm text-muted">— {q.author}</p>
        </div>
      </div>
    </GlassCard>
  )
}
