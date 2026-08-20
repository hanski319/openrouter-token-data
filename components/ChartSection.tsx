'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useMemo } from 'react'

interface Week {
  date: string
  models: Array<{ model: string; tokens: number }>
}

const COLORS = [
  '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fbbf24',
  '#fb923c', '#38bdf8', '#4ade80', '#e879f9', '#f87171',
  '#94a3b8', '#2dd4bf',
]

function shortName(model: string) {
  return model
    .replace('anthropic/', '')
    .replace('google/', '')
    .replace('openai/', '')
    .replace('deepseek/', '')
    .replace('meta-llama/', '')
    .replace('mistralai/', '')
    .replace('qwen/', '')
    .replace('x-ai/', '')
    .replace('openrouter/', '')
    .replace('microsoft/', '')
    .replace('nousresearch/', '')
    .replace('gryphe/', '')
    .replace('-instruct', '')
    .replace('-20250219', '')
    .replace('-20250522', '')
}

function fmtTokens(v: number) {
  if (v >= 1e12) return (v / 1e12).toFixed(1) + 'T'
  if (v >= 1e9) return (v / 1e9).toFixed(0) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(0) + 'M'
  return String(v)
}

export default function ChartSection({ weeks }: { weeks: Week[] }) {
  // Pick top 10 models by total tokens across all weeks
  const topModels = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const w of weeks) {
      for (const m of w.models) {
        totals[m.model] = (totals[m.model] ?? 0) + m.tokens
      }
    }
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([m]) => m)
  }, [weeks])

  const chartData = useMemo(() =>
    weeks.map(w => {
      const row: Record<string, string | number> = { date: w.date.slice(0, 10) }
      const byModel: Record<string, number> = {}
      for (const m of w.models) byModel[m.model] = m.tokens
      for (const m of topModels) row[m] = byModel[m] ?? 0
      return row
    }), [weeks, topModels])

  return (
    <section className="mb-10">
      <h2 className="text-sm font-medium text-[#888] uppercase tracking-widest mb-4">
        Weekly Token Volume — Top 10 Models
      </h2>
      <div className="bg-[#111] border border-[#222] rounded-xl p-4" style={{ height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              {topModels.map((m, i) => (
                <linearGradient key={m} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#666', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v.slice(5)}
              interval={7}
            />
            <YAxis
              tickFormatter={fmtTokens}
              tick={{ fill: '#666', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: '#aaa', marginBottom: 4 }}
              formatter={(v: number, name: string) => [fmtTokens(v), shortName(name)]}
            />
            <Legend
              formatter={shortName}
              wrapperStyle={{ fontSize: 11, color: '#888', paddingTop: 8 }}
            />
            {topModels.map((m, i) => (
              <Area
                key={m}
                type="monotone"
                dataKey={m}
                stroke={COLORS[i % COLORS.length]}
                fill={`url(#grad${i})`}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
