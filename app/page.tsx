import rankingsData from '@/data/rankings-history.json'
import TableSection from '@/components/TableSection'
import DownloadXlsxButton from '@/components/DownloadXlsxButton'

export default function Home() {
  const weeks = rankingsData as Array<{ date: string; models: Array<{ model: string; tokens: number }> }>
  const latest = weeks[weeks.length - 1]

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Token Usage — OpenRouter
          </h1>
          <p className="text-sm text-[#888]">
            Weekly token volume for top models · {weeks[0].date} to {latest.date} · source:{' '}
            <a href="https://openrouter.ai/rankings" target="_blank" rel="noreferrer" className="underline hover:text-white transition-colors">
              openrouter.ai/rankings
            </a>
          </p>
        </div>
        <DownloadXlsxButton weeks={weeks} />
      </div>

      <TableSection weeks={weeks} />
    </main>
  )
}
