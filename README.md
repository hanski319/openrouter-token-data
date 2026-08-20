# Token Usage — OpenRouter

Top 15 models by token volume for **the last full week of each month**, rendered as a
month-by-month matrix and downloadable as a multi-sheet XLSX workbook.

## Where the numbers come from

OpenRouter's rankings page serves a *weekly* leaderboard: one row per model, holding
prompt + completion tokens aggregated over the trailing seven days. `scripts/fetch-rankings.js`
reads that leaderboard from two places:

| Source | Used for | Notes |
| --- | --- | --- |
| `openrouter.ai/api/frontend/v1/rankings/models?view=week` | the current month | Live. Always describes *now*, so it can only ever supply the newest week. |
| Wayback Machine captures of `openrouter.ai/rankings` | every earlier month | Each capture embeds the weekly leaderboard as of its capture date. |

For each month the script picks the capture whose weekly window **ends inside that month**,
as late as possible — i.e. the last full week closest to month end.

### Coverage starts February 2025

Captures before roughly February 2025 contain no token data at all. The rankings page then
published only a request-count chart (eight models plus an "Others" bucket), and the
per-model token leaderboard did not yet exist in the page payload. December 2024 and
January 2025 therefore cannot be reconstructed from the archive.

### Counting rules

- Tokens are `total_prompt_tokens + total_completion_tokens`.
- Model variants (`standard`, `:free`, `:thinking`, …) are merged into one row per model.
- The provider summary aggregates each month's top-15 rows only, so every month
  contributes the same number of rows regardless of how deep that month's capture went.

## Regenerating the data

```bash
node scripts/fetch-rankings.js            # uses .cache/ for already-downloaded captures
node scripts/fetch-rankings.js --refresh  # re-download everything
```

Writes `data/rankings-monthly.json`.

## Workbook layout

`Download XLSX` produces four sheets:

1. **Top 15 by Month** — months across the columns, ranks 1–15 down the rows, model names in the cells.
2. **Tokens by Month** — the same grid with token counts.
3. **Provider Summary** — aggregate ranking by provider across the whole period.
4. **Raw Data** — one row per (month, rank) for pivoting.

## Development

```bash
npm install
npm run dev
```
