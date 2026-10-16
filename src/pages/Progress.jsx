import { useState } from 'react'
import { motion } from 'framer-motion'
import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Trophy, TrendingUp, Dumbbell, Clock, Medal, LineChart as LineIcon, Table2 } from 'lucide-react'
import PageWrapper from '../components/PageWrapper'
import GlassCard from '../components/GlassCard'
import AnimatedCounter from '../components/AnimatedCounter'
import ChartTooltip from '../components/ChartTooltip'
import EmptyState from '../components/EmptyState'
import { useChartColors } from '../context/ThemeContext'
import { lifts, personalRecords, strengthHistory, user } from '../data/mockData'

const tierStyle = {
  gold: { ring: 'from-amber-300 to-yellow-500', glow: 'shadow-[0_0_30px_-6px_rgba(251,191,36,0.7)]', label: 'Gold' },
  silver: { ring: 'from-slate-200 to-slate-400', glow: 'shadow-[0_0_30px_-8px_rgba(203,213,225,0.6)]', label: 'Silver' },
  bronze: { ring: 'from-orange-300 to-amber-700', glow: 'shadow-[0_0_30px_-8px_rgba(217,119,6,0.6)]', label: 'Bronze' },
}

const labelMap = Object.fromEntries(lifts.map((l) => [l.key, l.label]))

export default function Progress() {
  const colors = useChartColors()
  const [visible, setVisible] = useState(lifts.map((l) => l.key))
  const [view, setView] = useState('chart')

  const toggle = (key) => setVisible((v) => (v.includes(key) ? v.filter((k) => k !== key) : [...v, key]))

  const first = strengthHistory[0]
  const last = strengthHistory[strengthHistory.length - 1]
  const totalGain = lifts.reduce((s, l) => s + (last[l.key] - first[l.key]), 0)

  const stats = [
    { icon: Dumbbell, label: 'Workouts', value: user.totals.workouts },
    { icon: Clock, label: 'Hours trained', value: user.totals.hours },
    { icon: Trophy, label: 'PRs set', value: user.totals.prs },
    { icon: TrendingUp, label: 'kg added (big 3)', value: totalGain, prefix: '+' },
  ]

  return (
    <PageWrapper eyebrow="Progress" title="Look how far you've come" subtitle="Strength gains over the last 15 weeks, plus every record you've smashed.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <GlassCard key={s.label}>
            <s.icon className="h-5 w-5 text-accent" />
            <p className="mt-4 font-display text-3xl font-bold">
              <AnimatedCounter value={s.value} prefix={s.prefix} decimals={s.value % 1 ? 1 : 0} />
            </p>
            <p className="text-sm text-muted">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-4" hover={false}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Strength gains</h3>
            <p className="text-sm text-muted">Working weight in kg · tap a lift to show or hide it</p>
          </div>
          <div className="flex rounded-xl border border-line/10 p-1">
            {[['chart', LineIcon], ['table', Table2]].map(([v, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`grid h-8 w-9 place-items-center rounded-lg transition ${view === v ? 'bg-fg/10 text-fg' : 'text-muted hover:text-fg'}`}
                aria-label={`${v} view`}
                aria-pressed={view === v}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {lifts.map((l, i) => {
            const on = visible.includes(l.key)
            return (
              <button
                key={l.key}
                onClick={() => toggle(l.key)}
                aria-pressed={on}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${on ? 'border-line/15 bg-fg/[0.05] text-fg' : 'border-line/10 text-muted line-through opacity-60'}`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors.series[i] }} />
                {l.label}
                <span className="text-muted">{last[l.key]} kg</span>
              </button>
            )
          })}
        </div>

        {visible.length === 0 ? (
          <EmptyState icon={LineIcon} title="Nothing to show" message="All lifts are hidden. Tap a lift above to bring it back." />
        ) : view === 'chart' ? (
          <div className="h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthHistory} margin={{ top: 10, right: 56, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 12 }} domain={[40, 'auto']} />
                <Tooltip content={<ChartTooltip unit=" kg" labelMap={labelMap} />} cursor={{ stroke: colors.axis, strokeDasharray: '4 4' }} />
                {lifts.map((l, i) =>
                  visible.includes(l.key) ? (
                    <Line
                      key={l.key}
                      type="monotone"
                      dataKey={l.key}
                      name={l.label}
                      stroke={colors.series[i]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: colors.surface }}
                      animationDuration={1400}
                    >
                      <LabelList
                        dataKey={l.key}
                        content={({ x, y, index, value }) =>
                          index === strengthHistory.length - 1 ? (
                            <text x={x + 8} y={y + 4} fill={colors.text} fontSize={12} fontWeight={600}>
                              {value}
                            </text>
                          ) : null
                        }
                      />
                    </Line>
                  ) : null,
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-line/10 text-left text-muted">
                  <th className="py-2 font-medium">Week</th>
                  {lifts.filter((l) => visible.includes(l.key)).map((l) => (
                    <th key={l.key} className="py-2 text-right font-medium">{l.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strengthHistory.map((row) => (
                  <tr key={row.week} className="border-b border-line/[0.05]">
                    <td className="py-2.5">{row.week}</td>
                    {lifts.filter((l) => visible.includes(l.key)).map((l) => (
                      <td key={l.key} className="py-2.5 text-right tabular-nums">{row[l.key]} kg</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <div className="mb-4 mt-10 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personal records</h2>
          <p className="text-sm text-muted">Your all-time bests</p>
        </div>
        <Medal className="h-6 w-6 text-amber-400" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {personalRecords.map((pr, i) => {
          const t = tierStyle[pr.tier]
          return (
            <GlassCard key={pr.id} className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 220, damping: 14, delay: i * 0.06 }}
                className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${t.ring} ${t.glow}`}
              >
                <Trophy className="h-8 w-8 text-ink-950/80" />
                <span className="absolute -bottom-2 rounded-full bg-ink-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {t.label}
                </span>
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{pr.lift}</p>
                <p className="font-display text-2xl font-bold">{pr.value}</p>
                <p className="text-xs text-muted">
                  <span className="font-semibold text-accent">{pr.delta}</span> · {pr.date}
                </p>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </PageWrapper>
  )
}
