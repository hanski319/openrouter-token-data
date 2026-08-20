import { type RankingsData, fmtTokens, monthLabel, providerOf, shortModel } from '@/lib/rankings'

const PROVIDER_COLOR: Record<string, string> = {
  Anthropic: 'text-[#d97757]',
  Google: 'text-[#60a5fa]',
  OpenAI: 'text-[#34d399]',
  DeepSeek: 'text-[#a78bfa]',
  Qwen: 'text-[#f472b6]',
  xAI: 'text-[#e5e5e5]',
  Meta: 'text-[#38bdf8]',
  Mistral: 'text-[#fb923c]',
  Moonshot: 'text-[#fbbf24]',
  Tencent: 'text-[#4ade80]',
  Xiaomi: 'text-[#fb7185]',
  MiniMax: 'text-[#c084fc]',
  StepFun: 'text-[#2dd4bf]',
  'Z-AI': 'text-[#facc15]',
  NVIDIA: 'text-[#84cc16]',
}
const colorFor = (model: string) => PROVIDER_COLOR[providerOf(model)] ?? 'text-[#94a3b8]'

export default function MonthMatrix({ data }: { data: RankingsData }) {
  const months = data.months
  const ranks = Array.from({ length: data.topN }, (_, i) => i + 1)

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-3 gap-4 flex-wrap">
        <h2 className="text-sm font-medium text-[#888] uppercase tracking-widest">
          Top {data.topN} Models — Last Full Week of Each Month
        </h2>
        <span className="text-xs text-[#555]">{months.length} months · scroll horizontally →</span>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-x-auto">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="sticky left-0 z-10 bg-[#111] text-left px-3 py-2.5 text-[#555] font-medium w-12 border-r border-[#1e1e1e]">
                #
              </th>
              {months.map((m) => (
                <th key={m.month} className="text-left px-3 py-2 font-medium min-w-[230px] border-r border-[#1a1a1a] last:border-0">
                  <div className="text-[#e5e5e5]">
                    {monthLabel(m.month)}
                    {(m.partial || m.straddles) && (
                      <span
                        className="ml-1 text-[#7a6a3a]"
                        title={m.partial
                          ? 'From the Top Models chart, which lists only the top 9 plus an Others bucket'
                          : 'Week runs past month end — no capture landed inside the month'}
                      >
                        *
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#555] font-normal mt-0.5">wk ending {m.weekEnding}</div>
                  <div className="text-[10px] text-[#444] font-normal">{fmtTokens(m.weekTotal)} total</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranks.map((r) => (
              <tr key={r} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#141414] transition-colors">
                <td className="sticky left-0 z-10 bg-[#111] px-3 py-2 text-[#555] font-mono text-xs border-r border-[#1e1e1e]">
                  {r}
                </td>
                {months.map((m) => {
                  const row = m.models[r - 1]
                  if (!row) return <td key={m.month} className="px-3 py-2 text-[#333] border-r border-[#1a1a1a] last:border-0">—</td>
                  return (
                    <td key={m.month} className="px-3 py-2 border-r border-[#1a1a1a] last:border-0 align-top">
                      <div className={`font-mono text-xs ${colorFor(row.model)}`}>{shortModel(row.model)}</div>
                      <div className="text-[10px] text-[#555] mt-0.5">
                        {providerOf(row.model)} · {fmtTokens(row.tokens)}
                        <span className="text-[#777]"> · {(row.share * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
