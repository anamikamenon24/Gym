const map = {
  Beginner: { bars: 1, cls: 'text-accent2 bg-cyan/10 ring-cyan/25' },
  Intermediate: { bars: 2, cls: 'text-accent bg-lime/10 ring-lime/25' },
  Advanced: { bars: 3, cls: 'text-orange-400 bg-orange-400/10 ring-orange-400/25' },
}

export default function DifficultyBadge({ level }) {
  const m = map[level] || map.Beginner
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${m.cls}`}>
      <span className="flex items-end gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`w-[3px] rounded-full bg-current ${i <= m.bars ? '' : 'opacity-25'}`} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      {level}
    </span>
  )
}
