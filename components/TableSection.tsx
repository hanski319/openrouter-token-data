'use client'

import { useState } from 'react'

interface Week {
  date: string
  models: Array<{ model: string; tokens: number }>
}

function fmtTokens(v: number) {
  if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T'
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(0) + 'M'
  return String(v)
}

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
}

export default function TableSection({ weeks }: { weeks: Week[] }) {
  const [selectedIdx, setSelectedIdx] = useState(weeks.length - 1)
  const week = weeks[selectedIdx]

  const maxTokens = week.models[0]?.tokens ?? 1

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#888] uppercase tracking-widest">
          Weekly Rankings
        </h2>
        <select
          value={selectedIdx}
          onChange={e => setSelectedIdx(Number(e.target.value))}
          className="bg-[#111] border border-[#222] text-[#e5e5e5] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#444] cursor-pointer"
        >
          {weeks.map((w, i) => (
            <option key={w.date} value={i}>
              Week of {w.date}
            </option>
          )).reverse()}
        </select>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="text-left px-4 py-3 text-[#555] font-medium w-10">#</th>
              <th className="text-left px-4 py-3 text-[#555] font-medium">Model</th>
              <th className="text-right px-4 py-3 text-[#555] font-medium">Tokens</th>
              <th className="px-4 py-3 w-48 hidden md:table-cell"></th>
            </tr>
          </thead>
          <tbody>
            {week.models.map((m, i) => (
              <tr key={m.model} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors">
                <td className="px-4 py-3 text-[#555]">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-[#60a5fa]">{shortName(m.model)}</div>
                  <div className="text-[10px] text-[#444] mt-0.5">{m.model.split('/')[0]}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#e5e5e5]">
                  {fmtTokens(m.tokens)}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                    <div
                      className="bg-[#60a5fa] h-1.5 rounded-full"
                      style={{ width: `${(m.tokens / maxTokens) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#444] mt-3 text-right">
        Data from Wayback Machine snapshots of openrouter.ai/rankings
      </p>
    </section>
  )
}
