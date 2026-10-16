export default function ChartTooltip({ active, payload, label, unit = '', labelMap = {} }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass !rounded-xl px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-display font-semibold">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-muted">{labelMap[p.dataKey] || p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums">
            {p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  )
}
