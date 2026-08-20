'use client'

import ExcelJS from 'exceljs'

interface Week {
  date: string
  models: Array<{ model: string; tokens: number }>
}

export default function DownloadXlsxButton({ weeks }: { weeks: Week[] }) {
  async function handleDownload() {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Token Usage')

    sheet.columns = [
      { header: 'Week', key: 'date', width: 14 },
      { header: 'Rank', key: 'rank', width: 8 },
      { header: 'Model', key: 'model', width: 44 },
      { header: 'Tokens', key: 'tokens', width: 16 },
    ]
    sheet.getRow(1).font = { bold: true }

    for (const week of weeks) {
      week.models.forEach((m, i) => {
        sheet.addRow({
          date: week.date.slice(0, 10),
          rank: i + 1,
          model: m.model,
          tokens: m.tokens,
        })
      })
    }
    sheet.getColumn('tokens').numFmt = '#,##0'

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'openrouter-token-usage.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className="bg-[#111] border border-[#222] text-[#e5e5e5] text-sm rounded-lg px-3 py-1.5 hover:border-[#444] transition-colors cursor-pointer"
    >
      Download XLSX
    </button>
  )
}
