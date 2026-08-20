import rankings from '@/data/rankings-monthly.json'
import MonthMatrix from '@/components/MonthMatrix'
import ProviderSummary from '@/components/ProviderSummary'
import DownloadXlsxButton from '@/components/DownloadXlsxButton'
import { type RankingsData, monthLabel } from '@/lib/rankings'

export default function Home() {
  const data = rankings as RankingsData
  const first = data.months[0]
  const last = data.months[data.months.length - 1]
  const liveMonths = data.months.filter((m) => m.source.startsWith('live')).length

  return (
    <main className="max-w-[1600px] mx-auto px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Token Usage — OpenRouter
          </h1>
          <p className="text-sm text-[#888]">
            Top {data.topN} models by tokens for the last full week of each month ·{' '}
            {monthLabel(first?.month ?? '')} – {monthLabel(last?.month ?? '')} · source:{' '}
            <a
              href="https://openrouter.ai/rankings"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white transition-colors"
            >
              openrouter.ai/rankings
            </a>
          </p>
        </div>
        <DownloadXlsxButton data={data} />
      </div>

      <MonthMatrix data={data} />
      <ProviderSummary data={data} />

      <footer className="text-xs text-[#444] border-t border-[#1a1a1a] pt-4 space-y-1">
        {data.missing && data.missing.length > 0 && (
          <p className="text-[#7a6a3a]">
            No archived data for {data.missing.map(monthLabel).join(', ')} — the rankings page
            was client-rendered then, so those captures contain no leaderboard.
          </p>
        )}
        <p>
          Weekly totals combine prompt + completion tokens and merge model variants
          (standard / free / thinking) into one row per model.
        </p>
        <p>
          {liveMonths > 0 && <>Current month pulled live from the OpenRouter rankings API; </>}
          earlier months reconstructed from Wayback Machine captures of the rankings page.
          Regenerate with <code className="text-[#666]">node scripts/fetch-rankings.js</code>.
        </p>
        <p>Generated {data.generatedAt}.</p>
      </footer>
    </main>
  )
}
