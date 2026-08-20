import { type RankingsData, fmtTokens, monthLabel, summarizeProviders } from '@/lib/rankings'

export default function ProviderSummary({ data }: { data: RankingsData }) {
  const rows = summarizeProviders(data)
  const max = rows[0]?.totalTokens ?? 1

  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between mb-3 gap-4 flex-wrap">
        <h2 className="text-sm font-medium text-[#888] uppercase tracking-widest">
          Aggregate by Provider
        </h2>
        <span className="text-xs text-[#555]">
          {monthLabel(data.months[0]?.month ?? '')} – {monthLabel(data.months[data.months.length - 1]?.month ?? '')}
        </span>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-[#1e1e1e]">
              <th className="text-left px-4 py-3 text-[#555] font-medium w-10">#</th>
              <th className="text-left px-4 py-3 text-[#555] font-medium">Provider</th>
              <th className="text-right px-4 py-3 text-[#555] font-medium">Total Tokens</th>
              <th className="text-right px-4 py-3 text-[#555] font-medium">Avg Vol Share</th>
              <th className="text-right px-4 py-3 text-[#555] font-medium">Peak</th>
              <th className="text-right px-4 py-3 text-[#555] font-medium">Top-15 Slots</th>
              <th className="text-right px-4 py-3 text-[#555] font-medium">Models</th>
              <th className="text-right px-4 py-3 text-[#555] font-medium">Best</th>
              <th className="px-4 py-3 w-40 hidden lg:table-cell"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.provider} className="border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors">
                <td className="px-4 py-2.5 text-[#555] font-mono text-xs">{i + 1}</td>
                <td className="px-4 py-2.5 text-[#e5e5e5]">{p.provider}</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#e5e5e5]">{fmtTokens(p.totalTokens)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#888]">{(p.avgVolumeShare * 100).toFixed(1)}%</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#666]">{(p.peakVolumeShare * 100).toFixed(1)}%</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#888]">{p.appearances}</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#888]">{p.models}</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#888]">#{p.bestRank}</td>
                <td className="px-4 py-2.5 hidden lg:table-cell">
                  <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                    <div className="bg-[#60a5fa] h-1.5 rounded-full" style={{ width: `${(p.totalTokens / max) * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#444] mt-3">
        Totals sum each month&apos;s top-{data.topN} rows only, so every month contributes equally.
        Volume share is measured against all models routed that week, not just the top {data.topN}.
      </p>
    </section>
  )
}
