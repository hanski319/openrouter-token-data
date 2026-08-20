export interface ModelRow {
  model: string
  tokens: number
  date: string
}

export interface MonthRow {
  month: string
  weekEnding: string
  source: string
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
  share: number
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
  const acc = new Map<string, ProviderSummary & { modelSet: Set<string> }>()

  for (const m of data.months) {
    m.models.forEach((row, i) => {
      const provider = providerOf(row.model)
      let e = acc.get(provider)
      if (!e) {
        e = {
          provider, totalTokens: 0, share: 0, appearances: 0, models: 0,
          bestRank: Infinity, firstMonth: m.month, lastMonth: m.month,
          modelSet: new Set<string>(),
        }
        acc.set(provider, e)
      }
      e.totalTokens += row.tokens
      e.appearances += 1
      e.bestRank = Math.min(e.bestRank, i + 1)
      e.modelSet.add(row.model)
      if (m.month < e.firstMonth) e.firstMonth = m.month
      if (m.month > e.lastMonth) e.lastMonth = m.month
    })
  }

  const grand = [...acc.values()].reduce((s, e) => s + e.totalTokens, 0) || 1
  return [...acc.values()]
    .map(({ modelSet, ...e }) => ({ ...e, models: modelSet.size, share: e.totalTokens / grand }))
    .sort((a, b) => b.totalTokens - a.totalTokens)
}
