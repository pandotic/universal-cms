"use client";

interface SparklineProps {
  values: (number | null)[]
  width?: number
  height?: number
  color?: string
  showDots?: boolean
}

export function Sparkline({ values, width = 120, height = 32, color = 'var(--accent)', showDots }: SparklineProps) {
  const nums = values.filter((v): v is number => v !== null)
  if (nums.length < 2) {
    return <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>—</span>
  }

  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min || 1
  const padding = 4

  const points = nums.map((v, i) => {
    const x = padding + (i / (nums.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return { x, y, value: v }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg width={width} height={height} className="shrink-0">
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {showDots && points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />
      ))}
      {/* Last value dot always visible */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1]!.x}
          cy={points[points.length - 1]!.y}
          r={3}
          fill={color}
        />
      )}
    </svg>
  )
}
