#!/usr/bin/env node
/**
 * Build data/rankings-monthly.json: the last full week of each month, top 15 models.
 *
 * Sources, in the order they are preferred:
 *   1. Live API — https://openrouter.ai/api/frontend/v1/rankings/models?view=week
 *              One record per model aggregated over the trailing 7 days. Only ever
 *              describes *now*, so it covers the current month only.
 *   2. Wayback — archived rankings pages and archived captures of the same JSON
 *              endpoint. Both carry the full leaderboard, so both fill all 15 ranks.
 *   3. Top Models chart — data/chart-weeks.json, covering the trailing ~52 weeks.
 *              Used only where the archive comes up empty, because the chart names
 *              just the top ~9 models per week plus an "Others" bucket and so cannot
 *              fill 15 ranks. Refresh it with scripts/capture-chart.js.
 *
 * Token data only exists on the rankings page from ~Feb 2025 onward; earlier captures
 * carry a request-count chart with no per-model token totals. START_MONTH reflects that.
 *
 * Usage: node scripts/fetch-rankings.js [--refresh]
 */

const fs = require('fs')
const path = require('path')

const START_MONTH = '2025-01'
const TOP_N = 15
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const CACHE = path.join(__dirname, '..', '.cache', 'snapshots')
const OUT = path.join(__dirname, '..', 'data', 'rankings-monthly.json')
const REFRESH = process.argv.includes('--refresh')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ---------------------------------------------------------------- parsing */

/** Bracket-match a JSON array or object starting at `open`. */
function matchDelimited(text, open, chars) {
  const [oc, cc] = chars
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === oc) depth++
    else if (text[i] === cc) { depth--; if (depth === 0) return text.slice(open, i + 1) }
  }
  return null
}

/**
 * Archived pages embed view maps shaped `{"day":[…],"week":[…],"month":[…]}` — the same
 * rows repeated once per window. Only the weekly view is wanted; summing the map
 * wholesale inflates every total several-fold.
 *
 * The page carries more than one such map (models, apps, …), so take the first "week"
 * array that actually holds model rows rather than trusting position.
 */
function extractWeekView(text) {
  for (const m of text.matchAll(/"week":\s*\[/g)) {
    const arr = matchDelimited(text, text.indexOf('[', m.index), '[]')
    if (!arr || !arr.includes('"model_permaslug"')) continue
    try {
      const parsed = JSON.parse(arr)
      if (Array.isArray(parsed) && parsed.length) return parsed
    } catch { /* truncated chunk — keep looking */ }
  }
  return null
}

const toRecord = (obj) => {
  if (!obj || !obj.model_permaslug) return null
  const tokens = Number(obj.total_prompt_tokens || 0) + Number(obj.total_completion_tokens || 0)
  if (!tokens) return null
  return { model: obj.model_permaslug, date: (obj.date || '').slice(0, 10), tokens }
}

/** Pull the weekly leaderboard out of an archived page or an API response. */
function extractRecords(rawText) {
  const text = rawText.replace(/\\"/g, '"')

  const week = extractWeekView(text)
  if (week) return week.map(toRecord).filter(Boolean)

  // API responses (?view=week) are already a single view: {"data":[…]}.
  const out = []
  const re = /"model_permaslug":"/g
  let m
  while ((m = re.exec(text)) !== null) {
    let start = -1
    let depth = 0
    for (let i = m.index; i >= 0 && m.index - i < 4000; i--) {
      if (text[i] === '}') depth++
      else if (text[i] === '{') {
        if (depth === 0) { start = i; break }
        depth--
      }
    }
    if (start === -1) continue

    depth = 0
    let end = -1
    for (let i = start; i < text.length && i - start < 8000; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    if (end === -1) continue

    let obj
    try { obj = JSON.parse(text.slice(start, end + 1)) } catch { continue }
    const rec = toRecord(obj)
    if (rec) out.push(rec)
    re.lastIndex = end
  }
  return out
}

/** One row per model: variants (standard/free/thinking/…) are summed together. */
function aggregate(records) {
  const byModel = new Map()
  for (const r of records) {
    const prev = byModel.get(r.model)
    if (prev) {
      prev.tokens += r.tokens
      if (r.date > prev.date) prev.date = r.date
    } else {
      byModel.set(r.model, { model: r.model, tokens: r.tokens, date: r.date })
    }
  }
  return [...byModel.values()].sort((a, b) => b.tokens - a.tokens)
}

/* ------------------------------------------------------------------ dates */

function monthsBetween(startMonth, endMonth) {
  const out = []
  let [y, m] = startMonth.split('-').map(Number)
  const [ey, em] = endMonth.split('-').map(Number)
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    if (++m > 12) { m = 1; y++ }
  }
  return out
}

const lastDayOf = (month) => {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}
const addDays = (iso, n) =>
  new Date(new Date(iso + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)
const tsToIso = (ts) => `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`

/* --------------------------------------------------------------- fetching */

async function get(url, { json = false, retries = 3 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate, br' },
        signal: AbortSignal.timeout(90_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return json ? await res.json() : await res.text()
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(2000 * attempt)
    }
  }
}

const PAGE_URL = 'https://openrouter.ai/rankings'
const API_URL = 'https://openrouter.ai/api/frontend/v1/rankings/models?view=week'

async function getSnapshot(ts, kind) {
  fs.mkdirSync(CACHE, { recursive: true })
  const file = path.join(CACHE, kind === 'api' ? `api-${ts}.json` : `${ts}.html`)
  if (!REFRESH && fs.existsSync(file)) return fs.readFileSync(file, 'utf8')
  const body = await get(`https://web.archive.org/web/${ts}id_/${kind === 'api' ? API_URL : PAGE_URL}`)
  fs.writeFileSync(file, body)
  return body
}

async function cdx(url, extra = '') {
  const rows = await get(
    `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
    `&output=json&filter=statuscode:200&limit=500${extra}`,
    { json: true },
  )
  return rows.slice(1).map((r) => r[1]).sort()
}

/**
 * Two archived shapes exist. Up to ~Apr 2026 the rankings page server-rendered its
 * leaderboard, so the HTML carries the data. After that the page became client-rendered
 * and archived HTML is an empty shell — but the JSON endpoint it calls was archived too,
 * so fall back to that.
 */
async function listSnapshots() {
  const [pages, apis] = await Promise.all([
    cdx('openrouter.ai/rankings', '&from=20250101&to=20260901&collapse=timestamp:8'),
    cdx('openrouter.ai/api/frontend/v1/rankings/models?view=week').catch(() => []),
  ])
  return [
    ...pages.map((ts) => ({ ts, kind: 'page' })),
    ...apis.map((ts) => ({ ts, kind: 'api' })),
  ]
}

/* ------------------------------------------------------------------- main */

async function resolveMonth(month, snapshots, overhangDays = 0) {
  const monthEnd = lastDayOf(month)
  // Normally the week must end inside the month. `overhangDays` is a fallback for
  // months where no capture qualifies: Jan 2025 has no leaderboard until the 5 Feb
  // capture, whose week runs 29 Jan - 4 Feb.
  const latestEnd = addDays(monthEnd, overhangDays)
  // A capture taken shortly after the month ends still describes the final full
  // week of that month, so allow a few days of overhang.
  const candidates = snapshots
    .filter(({ ts }) => {
      const d = tsToIso(ts)
      return d >= addDays(monthEnd, -8) && d <= addDays(monthEnd, 5)
    })
    // The JSON endpoint is unambiguous, so exhaust those captures before falling back
    // to scraping pages; within each group take the newest window first.
    .sort((a, b) =>
      (a.kind === 'api' ? 0 : 1) - (b.kind === 'api' ? 0 : 1) || b.ts.localeCompare(a.ts))

  for (const { ts, kind } of candidates.slice(0, 12)) {
    let models
    try {
      models = aggregate(extractRecords(await getSnapshot(ts, kind)))
    } catch (err) {
      console.log(`    ${kind}:${ts}: fetch failed (${err.message})`)
      continue
    }
    if (models.length < TOP_N) {
      console.log(`    ${kind}:${ts}: only ${models.length} models, skipping`)
      continue
    }
    const windowEnd = models.reduce((mx, r) => (r.date > mx ? r.date : mx), '')
    if (!windowEnd || windowEnd > latestEnd || windowEnd < addDays(monthEnd, -13)) {
      console.log(`    ${kind}:${ts}: window ends ${windowEnd || '?'}, outside ${month}`)
      continue
    }
    return withShares({
      month,
      weekEnding: windowEnd,
      source: `wayback-${kind}:${ts}`,
      ...(windowEnd > monthEnd ? { straddles: true } : {}),
    }, models)
  }
  return null
}

/**
 * The Top Models chart on the live site holds the trailing ~52 weeks, so it can cover
 * gaps under a year old. It names only the top ~9 models per week plus an "Others"
 * bucket, which is why it sits behind the archive rather than in front of it: the
 * archive fills all 15 ranks and this cannot. Refresh with scripts/capture-chart.js.
 */
function fromChart(month) {
  const file = path.join(__dirname, '..', 'data', 'chart-weeks.json')
  if (!fs.existsSync(file)) return null
  const chart = JSON.parse(fs.readFileSync(file, 'utf8'))
  const monthEnd = lastDayOf(month)

  // Latest week that finished inside the month.
  const week = (chart.weeks || [])
    .filter((w) => w.weekEnding <= monthEnd && w.weekEnding >= addDays(monthEnd, -13))
    .sort((a, b) => b.weekEnding.localeCompare(a.weekEnding))[0]
  if (!week) return null

  console.log(`    -> week ending ${week.weekEnding} via ${chart.source} ` +
    `(${week.models.length} of ${TOP_N} ranks available)`)
  return {
    month,
    weekEnding: week.weekEnding,
    source: chart.source,
    partial: week.models.length < TOP_N,
    weekTotal: week.total,
    modelsCounted: null,
    models: week.models.slice(0, TOP_N).map((r) => ({
      ...r, date: week.weekEnding, share: week.total ? r.tokens / week.total : 0,
    })),
  }
}

/**
 * Volume share is measured against every model in the capture, not just the top N,
 * so the denominator is total OpenRouter throughput for that week.
 */
function withShares(meta, models) {
  const weekTotal = models.reduce((s, r) => s + r.tokens, 0)
  return {
    ...meta,
    weekTotal,
    modelsCounted: models.length,
    models: models.slice(0, TOP_N).map((r) => ({ ...r, share: weekTotal ? r.tokens / weekTotal : 0 })),
  }
}

async function liveWeek(month) {
  const data = await get('https://openrouter.ai/api/frontend/v1/rankings/models?view=week', { json: true })
  const models = aggregate(extractRecords(JSON.stringify(data)))
  if (models.length < TOP_N) return null
  const weekEnding = models.reduce((mx, r) => (r.date > mx ? r.date : mx), '')
  return withShares({ month, weekEnding, source: 'live:api?view=week' }, models)
}

async function main() {
  const today = new Date().toISOString().slice(0, 10)
  const currentMonth = today.slice(0, 7)
  const months = monthsBetween(START_MONTH, currentMonth)
  console.log(`Building ${months.length} months: ${months[0]} … ${months[months.length - 1]}`)

  console.log('Listing Wayback snapshots…')
  const snapshots = await listSnapshots()
  console.log(`  ${snapshots.length} captures available\n`)

  const results = []
  const missing = []
  for (const month of months) {
    process.stdout.write(`${month}: `)
    let row = null

    // Prefer live data — but it only ever describes the current week.
    if (month === currentMonth) {
      try {
        row = await liveWeek(month)
        if (row) console.log(`live week ending ${row.weekEnding} (${row.models.length} models)`)
      } catch (err) {
        console.log(`live failed (${err.message}), falling back to archive`)
      }
    }
    if (!row) {
      console.log('')
      row = await resolveMonth(month, snapshots)
      // Retry allowing a week that runs a few days past month end.
      if (!row) row = await resolveMonth(month, snapshots, 5)
      if (!row) row = fromChart(month)
      if (row) {
        console.log(`    -> week ending ${row.weekEnding} via ${row.source}` +
          (row.straddles ? ' (straddles into the next month)' : ''))
      }
    }

    if (row) results.push(row)
    else {
      missing.push(month)
      console.log(`    !! no usable capture for ${month}`)
    }
    await sleep(400)
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(
    { generatedAt: today, topN: TOP_N, missing, months: results }, null, 2))
  console.log(`\nWrote ${results.length} months -> ${path.relative(process.cwd(), OUT)}`)
  if (missing.length) console.log(`Gaps (no archived data): ${missing.join(', ')}`)
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1) })
module.exports = { extractRecords, aggregate }
