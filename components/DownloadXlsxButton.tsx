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
      wb.creator = 'openrouter-token-data'
      wb.created = new Date()

      const months = data.months
      const ranks = Array.from({ length: data.topN }, (_, i) => i + 1)

      /* ---------- Sheet 1: months going across, 3 columns each ---------- */
      const s1 = wb.addWorksheet('Top 15 by Month', { views: [{ state: 'frozen', xSplit: 1, ySplit: 3 }] })

      // Row 1: month name spanning its three columns. Row 2: the week it covers.
      // Row 3: the per-month column labels.
      const head1: (string | null)[] = ['']
      const head2: (string | null)[] = ['']
      const head3: string[] = ['Rank']
      for (const m of months) {
        head1.push(monthLabel(m.month), null, null)
        head2.push(`week ending ${m.weekEnding}`, null, null)
        head3.push('Model', 'Tokens', '% Share')
      }
      s1.addRow(head1)
      s1.addRow(head2)
      s1.addRow(head3)
      months.forEach((_, i) => {
        const c = 2 + i * 3
        s1.mergeCells(1, c, 1, c + 2)
        s1.mergeCells(2, c, 2, c + 2)
      })
      styleHeader(s1.getRow(1))
      const sub = s1.getRow(2)
      sub.font = { italic: true, size: 9, color: { argb: 'FFFFFFFF' } }
      sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
      sub.alignment = { horizontal: 'center' }
      styleHeader(s1.getRow(3))
      s1.getRow(3).height = 18

      for (const r of ranks) {
        const row: (string | number | null)[] = [r]
        for (const m of months) {
          const e = m.models[r - 1]
          row.push(e ? shortModel(e.model) : '', e ? e.tokens : null, e ? e.share : null)
        }
        s1.addRow(row)
      }
      // Closing row: what the top 15 add up to against the week's whole volume.
      const totalRow: (string | number | null)[] = ['Total']
      for (const m of months) {
        totalRow.push('', m.weekTotal, m.models.reduce((s, e) => s + (e.share ?? 0), 0))
      }
      s1.addRow(totalRow)
      s1.getRow(s1.rowCount).font = { bold: true }

      s1.getColumn(1).width = 7
      months.forEach((_, i) => {
        const c = 2 + i * 3
        s1.getColumn(c).width = 30
        s1.getColumn(c + 1).width = 17
        s1.getColumn(c + 1).numFmt = '#,##0'
        s1.getColumn(c + 2).width = 10
        s1.getColumn(c + 2).numFmt = '0.0%'
      })

      /* ---------- Sheet 2: provider aggregates ---------- */
      const s3 = wb.addWorksheet('Provider Summary', { views: [{ state: 'frozen', ySplit: 1 }] })
      s3.columns = [
        { header: 'Rank', key: 'rank', width: 7 },
        { header: 'Provider', key: 'provider', width: 18 },
        { header: 'Total Tokens', key: 'total', width: 20 },
        { header: 'Share of Top 15', key: 'share', width: 16 },
        { header: 'Avg Volume Share', key: 'avgShare', width: 18 },
        { header: 'Peak Volume Share', key: 'peakShare', width: 18 },
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
          avgShare: p.avgVolumeShare,
          peakShare: p.peakVolumeShare,
          slots: p.appearances,
          models: p.models,
          best: p.bestRank,
          first: monthLabel(p.firstMonth),
          last: monthLabel(p.lastMonth),
        })
      })
      s3.getColumn('total').numFmt = '#,##0'
      for (const k of ['share', 'avgShare', 'peakShare']) s3.getColumn(k).numFmt = '0.0%'

      /* ---------- Sheet 3: flat data, for pivoting ---------- */
      const s4 = wb.addWorksheet('Raw Data')
      s4.columns = [
        { header: 'Month', key: 'month', width: 12 },
        { header: 'Week Ending', key: 'week', width: 14 },
        { header: 'Rank', key: 'rank', width: 7 },
        { header: 'Provider', key: 'provider', width: 18 },
        { header: 'Model', key: 'model', width: 46 },
        { header: 'Tokens', key: 'tokens', width: 20 },
        { header: 'Volume Share', key: 'share', width: 14 },
        { header: 'Week Total Tokens', key: 'weekTotal', width: 20 },
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
            share: row.share,
            weekTotal: m.weekTotal,
            source: m.source,
          })
        })
      }
      s4.getColumn('tokens').numFmt = '#,##0'
      s4.getColumn('weekTotal').numFmt = '#,##0'
      s4.getColumn('share').numFmt = '0.00%'

      for (const ws of [s1, s3, s4]) {
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
