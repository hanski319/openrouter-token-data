export interface ModelRow {
  model: string
  tokens: number
  date: string
  /** Fraction of that week's total OpenRouter tokens. */
  share: number
}

export interface MonthRow {
  month: string
  weekEnding: string
  source: string
  /** Tokens across every model in the capture — the share denominator. */
  weekTotal: number
  /** How many models the capture contained; null when the source is the chart. */
  modelsCounted: number | null
  /** Source could not fill all 15 ranks. */
  partial?: boolean
  /** The week runs past month end (used when nothing lands inside the month). */
  straddles?: boolean
  /** The week sits well before month end, because captures stop partway through. */
  earlyWeek?: boolean
  models: ModelRow[]
}

export interface RankingsData {
  generatedAt: string
  topN: number
  /** Months in range with no recoverable capture. */
  missing?: string[]
  months: MonthRow[]
}

const PROVIDER_NAMES: Record<string, string> = {
  'anthropic': 'Anthropic',
  'google': 'Google',
  'openai': 'OpenAI',
  'deepseek': 'DeepSeek',
  'meta-llama': 'Meta',
  'mistralai': 'Mistral',
  'qwen': 'Qwen',
  'x-ai': 'xAI',
  'z-ai': 'Z-AI',
  'moonshotai': 'Moonshot',
  'nvidia': 'NVIDIA',
  'microsoft': 'Microsoft',
  'nousresearch': 'Nous Research',
  'openrouter': 'OpenRouter',
  'tencent': 'Tencent',
  'xiaomi': 'Xiaomi',
  'minimax': 'MiniMax',
  'stepfun': 'StepFun',
  'bytedance': 'ByteDance',
  'baidu': 'Baidu',
  'cohere': 'Cohere',
  'liquid': 'Liquid',
  'gryphe': 'Gryphe',
  'perplexity': 'Perplexity',
  'amazon': 'Amazon',
  'inflection': 'Inflection',
  'ai21': 'AI21',
}

/** Provider is the author segment of an OpenRouter permaslug ("anthropic/claude-…"). */
export function providerOf(model: string): string {
  const slug = model.split('/')[0]
  return PROVIDER_NAMES[slug] ?? slug.replace(/(^|[-_])([a-z])/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase())
}

/** Drop the author prefix and the trailing date stamp for a compact display name. */
export function shortModel(model: string): string {
  return model.split('/').slice(1).join('/').replace(/-\d{8}$/, '')
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[m - 1]} ${y}`
}

export function fmtTokens(v: number): string {
  if (v >= 1e12) return (v / 1e12).toFixed(2) + 'T'
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(0) + 'M'
  return String(v)
}

export interface ProviderSummary {
  provider: string
  totalTokens: number
  /** Share of the top-15 tokens in this table. */
  share: number
  /** Mean share of total OpenRouter volume across the months it appears in. */
  avgVolumeShare: number
  /** Its best single-month share of total OpenRouter volume. */
  peakVolumeShare: number
  appearances: number
  models: number
  bestRank: number
  firstMonth: string
  lastMonth: string
}

/**
 * Aggregate the top-N sets by provider. Deliberately computed from the displayed
 * top-15 only, so every month contributes the same number of rows regardless of
 * how deep that month's capture went.
 */
export function summarizeProviders(data: RankingsData): ProviderSummary[] {
  type Acc = ProviderSummary & { modelSet: Set<string>; monthShares: Map<string, number> }
  const acc = new Map<string, Acc>()

  for (const m of data.months) {
    m.models.forEach((row, i) => {
      const provider = providerOf(row.model)
      let e = acc.get(provider)
      if (!e) {
        e = {
          provider, totalTokens: 0, share: 0, avgVolumeShare: 0, peakVolumeShare: 0,
          appearances: 0, models: 0, bestRank: Infinity,
          firstMonth: m.month, lastMonth: m.month,
          modelSet: new Set<string>(), monthShares: new Map<string, number>(),
        }
        acc.set(provider, e)
      }
      e.totalTokens += row.tokens
      e.appearances += 1
      e.bestRank = Math.min(e.bestRank, i + 1)
      e.modelSet.add(row.model)
      // A provider can hold several slots in one month; its share for that month is the sum.
      e.monthShares.set(m.month, (e.monthShares.get(m.month) ?? 0) + (row.share ?? 0))
      if (m.month < e.firstMonth) e.firstMonth = m.month
      if (m.month > e.lastMonth) e.lastMonth = m.month
    })
  }

  const grand = [...acc.values()].reduce((s, e) => s + e.totalTokens, 0) || 1
  return [...acc.values()]
    .map(({ modelSet, monthShares, ...e }) => {
      const shares = [...monthShares.values()]
      return {
        ...e,
        models: modelSet.size,
        share: e.totalTokens / grand,
        avgVolumeShare: shares.length ? shares.reduce((s, v) => s + v, 0) / shares.length : 0,
        peakVolumeShare: shares.length ? Math.max(...shares) : 0,
      }
    })
    .sort((a, b) => b.totalTokens - a.totalTokens)
}
