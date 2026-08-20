/**
 * Paste this into the browser console on https://openrouter.ai/rankings#top-models
 * (wait for the "Top Models" chart to finish loading first), then move the downloaded
 * chart-weeks.json into data/.
 *
 * Why a console snippet rather than a fetch: the chart's data arrives through a Next.js
 * server action that rejects non-browser callers, so it can only be read from a page
 * that has actually rendered. The chart holds the trailing ~52 weeks, which is what
 * makes it the right source for gaps under a year old.
 *
 * It names roughly the top 9 models per week plus an aggregated "Others" bucket, so
 * weeks taken from here cannot fill all 15 ranks.
 */
;(() => {
  const wrapper = document.querySelector('.recharts-wrapper')
  if (!wrapper) throw new Error('Chart not rendered yet — scroll to Top Models and let it load.')

  const fiberKey = Object.keys(wrapper).find((k) => k.startsWith('__reactFiber$'))
  if (!fiberKey) throw new Error('No React fiber on the chart wrapper.')

  let fiber = wrapper[fiberKey]
  let data = null
  for (let hops = 0; fiber && hops < 60; hops++, fiber = fiber.return) {
    const props = fiber.memoizedProps
    if (props && Array.isArray(props.data) && props.data.length > 10) { data = props.data; break }
  }
  if (!data) throw new Error('Could not locate the chart series.')

  const addDays = (iso, n) =>
    new Date(new Date(iso + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)

  const weeks = data.map((point) => {
    const entries = Object.entries(point).filter(
      ([k]) => k !== '__RECHARTS_X_LABEL__' && !k.startsWith('forecast'),
    )
    const weekStart = point.__RECHARTS_X_LABEL__
    return {
      weekStart,
      weekEnding: addDays(weekStart, 6),
      total: entries.reduce((sum, [, v]) => sum + v, 0),
      others: point.Others || 0,
      models: entries
        .filter(([k]) => k !== 'Others')
        .sort((a, b) => b[1] - a[1])
        .map(([model, tokens]) => ({ model, tokens })),
    }
  })

  const payload = {
    _comment:
      'Weeks read from the Top Models chart on openrouter.ai/rankings. The chart names only the top ~9 models per week plus an aggregated Others bucket, so weeks sourced from here cannot fill all 15 ranks.',
    capturedAt: new Date().toISOString().slice(0, 10),
    source: 'live:top-models-chart',
    weeks,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart-weeks.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  console.log(`captured ${weeks.length} weeks: ${weeks[0].weekStart} -> ${weeks[weeks.length - 1].weekStart}`)
  return payload
})()
