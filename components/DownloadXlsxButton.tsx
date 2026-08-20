'use client'

import { useState } from 'react'
import { Workbook, type Row } from 'exceljs'
import {
  type RankingsData, monthLabel, providerOf, shortModel, summarizeProviders,
} from '@/lib/rankings'

const HEADER_FILL = 'FF1F2937'
const BORDER = 'FFD1D5DB'

function styleHeader(row: Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
  row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  row.height = 30
}

export default function DownloadXlsxButton({ data }: { data: RankingsData }) {
  const [busy, setBusy] = useState(false)

  async function handleDownload() {
    setBusy(true)
    try {
      const wb = new Workbook()
      wb.creator = 'token-usage-open-router'
      wb.created = new Date()

      const months = data.months
      const ranks = Array.from({ length: data.topN }, (_, i) => i + 1)

      /* ---------- Sheet 1: models, months going across ---------- */
      const s1 = wb.addWorksheet('Top 15 by Month', { views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }] })
      s1.addRow(['', ...months.map((m) => monthLabel(m.month))])
      s1.addRow(['Rank', ...months.map((m) => `week ending ${m.weekEnding}`)])
      styleHeader(s1.getRow(1))
      const sub = s1.getRow(2)
      sub.font = { italic: true, size: 9, color: { argb: 'FFFFFFFF' } }
      sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
      sub.alignment = { horizontal: 'center' }

      for (const r of ranks) {
        s1.addRow([r, ...months.map((m) => {
          const row = m.models[r - 1]
          return row ? shortModel(row.model) : ''
        })])
      }
      s1.getColumn(1).width = 6
      months.forEach((_, i) => { s1.getColumn(i + 2).width = 30 })

      /* ---------- Sheet 2: the same grid, token values ---------- */
      const s2 = wb.addWorksheet('Tokens by Month', { views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }] })
      s2.addRow(['', ...months.map((m) => monthLabel(m.month))])
      s2.addRow(['Rank', ...months.map((m) => `week ending ${m.weekEnding}`)])
      styleHeader(s2.getRow(1))
      const sub2 = s2.getRow(2)
      sub2.font = { italic: true, size: 9, color: { argb: 'FFFFFFFF' } }
      sub2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
      sub2.alignment = { horizontal: 'center' }

      for (const r of ranks) {
        s2.addRow([r, ...months.map((m) => m.models[r - 1]?.tokens ?? null)])
      }
      s2.getColumn(1).width = 6
      months.forEach((_, i) => {
        const col = s2.getColumn(i + 2)
        col.width = 18
        col.numFmt = '#,##0'
      })

      /* ---------- Sheet 3: provider aggregates ---------- */
      const s3 = wb.addWorksheet('Provider Summary', { views: [{ state: 'frozen', ySplit: 1 }] })
      s3.columns = [
        { header: 'Rank', key: 'rank', width: 7 },
        { header: 'Provider', key: 'provider', width: 18 },
        { header: 'Total Tokens', key: 'total', width: 20 },
        { header: 'Share of Top 15', key: 'share', width: 16 },
        { header: 'Top-15 Slots', key: 'slots', width: 14 },
        { header: 'Distinct Models', key: 'models', width: 16 },
        { header: 'Best Rank', key: 'best', width: 11 },
        { header: 'First Month', key: 'first', width: 13 },
        { header: 'Last Month', key: 'last', width: 13 },
      ]
      styleHeader(s3.getRow(1))
      summarizeProviders(data).forEach((p, i) => {
        s3.addRow({
          rank: i + 1,
          provider: p.provider,
          total: p.totalTokens,
          share: p.share,
          slots: p.appearances,
          models: p.models,
          best: p.bestRank,
          first: monthLabel(p.firstMonth),
          last: monthLabel(p.lastMonth),
        })
      })
      s3.getColumn('total').numFmt = '#,##0'
      s3.getColumn('share').numFmt = '0.0%'

      /* ---------- Sheet 4: flat data, for pivoting ---------- */
      const s4 = wb.addWorksheet('Raw Data')
      s4.columns = [
        { header: 'Month', key: 'month', width: 12 },
        { header: 'Week Ending', key: 'week', width: 14 },
        { header: 'Rank', key: 'rank', width: 7 },
        { header: 'Provider', key: 'provider', width: 18 },
        { header: 'Model', key: 'model', width: 46 },
        { header: 'Tokens', key: 'tokens', width: 20 },
        { header: 'Source', key: 'source', width: 26 },
      ]
      styleHeader(s4.getRow(1))
      for (const m of months) {
        m.models.forEach((row, i) => {
          s4.addRow({
            month: monthLabel(m.month),
            week: m.weekEnding,
            rank: i + 1,
            provider: providerOf(row.model),
            model: row.model,
            tokens: row.tokens,
            source: m.source,
          })
        })
      }
      s4.getColumn('tokens').numFmt = '#,##0'

      for (const ws of [s1, s2, s3, s4]) {
        ws.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: BORDER } },
              left: { style: 'thin', color: { argb: BORDER } },
              bottom: { style: 'thin', color: { argb: BORDER } },
              right: { style: 'thin', color: { argb: BORDER } },
            }
          })
        })
      }

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `openrouter-top${data.topN}-by-month.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={busy}
      className="bg-[#111] border border-[#222] text-[#e5e5e5] text-sm rounded-lg px-3 py-1.5 hover:border-[#444] transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
    >
      {busy ? 'Building…' : 'Download XLSX'}
    </button>
  )
}
