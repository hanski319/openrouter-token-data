# Token Usage — OpenRouter

Top 15 models by token volume for **the last full week of each month**, rendered as a
month-by-month matrix and downloadable as a multi-sheet XLSX workbook.

## Where the numbers come from

OpenRouter's rankings page serves a *weekly* leaderboard: one row per model, holding
prompt + completion tokens aggregated over the trailing seven days. `scripts/fetch-rankings.js`
reads that leaderboard from two places:

| Order | Source | Used for | Depth |
| --- | --- | --- | --- |
| 1 | `api/frontend/v1/rankings/models?view=week` | the current month | full leaderboard |
| 2 | Wayback captures — rankings pages, and archived captures of that same endpoint | every earlier month | full leaderboard |
| 3 | `data/chart-weeks.json`, read from the site's Top Models chart | gaps under a year old | top ~9 + Others |

For each month the script picks the capture whose weekly window **ends inside that month**,
as late as possible — i.e. the last full week closest to month end.

The chart sits last rather than second because it names only the top ~9 models per week;
the archive fills all 15 ranks, so it is preferred wherever it has anything to offer.
The chart is what rescues months the archive cannot serve at all.

### Refreshing the chart source

The chart's data arrives through a Next.js server action that rejects non-browser callers,
so it cannot be fetched from a script. Open
[the chart](https://openrouter.ai/rankings#top-models), let it render, paste
`scripts/capture-chart.js` into the console, and drop the downloaded `chart-weeks.json`
into `data/`. It carries the trailing ~52 weeks, so it covers any gap under a year old —
which is exactly the window where Wayback tends to be thinnest.

### Known soft spots

- **January 2025** — the token leaderboard did not exist in the page payload before
  February 2025 (the page published only a request-count chart). The earliest capture
  carrying tokens is 5 Feb 2025, whose week runs 29 Jan – 4 Feb, so January is reported
  from that straddling week and flagged in the UI.
- **May 2026** — the page stopped server-rendering between 15 and 17 May 2026, and the
  JSON endpoint was not archived until 19 June, so nothing covers the end of the month.
  The 15 May capture is intact (385 models), so May is reported from the week ending
  14 May: a full top 15, just earlier in the month than the other columns. Flagged in
  the UI. The Top Models chart does cover the 25–31 May week, but names only 9 models,
  which is why the archive is preferred here.

### Counting rules

- Tokens are `total_prompt_tokens + total_completion_tokens`.
- Model variants (`standard`, `:free`, `:thinking`, …) are merged into one row per model.
- **Volume share** divides a model's tokens by the tokens of *every* model in that
  week's capture (200–530 of them), so it is share of total OpenRouter throughput
  rather than share of the top 15. Cross-checked against the site's own chart: for the
  week of 10 Aug 2026 it reports DeepSeek V4 Flash at 11.2T against a 75.3T total, and
  the same model reads 11.23T here.
- The provider summary aggregates each month's top-15 rows only, so every month
  contributes the same number of rows regardless of how deep that month's capture went.

## Regenerating the data

```bash
node scripts/fetch-rankings.js            # uses .cache/ for already-downloaded captures
node scripts/fetch-rankings.js --refresh  # re-download everything
```

Writes `data/rankings-monthly.json`.

## Workbook layout

`Download XLSX` produces three sheets:

1. **Top 15 by Month** — months across the columns, three columns each
   (Model | Tokens | % Share), ranks 1–15 down the rows, closing with the week's
   total tokens and what the top 15 add up to.
2. **Provider Summary** — aggregate ranking by provider, with average and peak volume share.
3. **Raw Data** — one row per (month, rank) for pivoting.

## Development

```bash
npm install
npm run dev
```
