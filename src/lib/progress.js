// Safe progress maths for rings and bars: always a finite number in [0, 1] / [0, 100].
export function ratio(value, max) {
  const v = Number(value)
  const m = Number(max)
  if (!Number.isFinite(v) || !Number.isFinite(m) || m <= 0) return 0
  return Math.min(1, Math.max(0, v / m))
}

export const percent = (value, max) => Math.round(ratio(value, max) * 100)
