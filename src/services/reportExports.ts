import * as XLSX from 'xlsx';
import {
  downloadCsv,
  responseTimesCsvRows,
  usageCsvRows,
  type ResponseTimesReport,
  type UsageReport,
} from './adminReports';

type ReportData =
  { type: 'usage'; report: UsageReport } | { type: 'response-times'; report: ResponseTimesReport };

function getReportRows(data: ReportData) {
  return data.type === 'usage' ? usageCsvRows(data.report) : responseTimesCsvRows(data.report);
}

function getFilename(data: ReportData) {
  const prefix = data.type === 'usage' ? 'usage-report' : 'response-times-report';

  return `${prefix}-${data.report.rangeDays}-days`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function exportReportCsv(data: ReportData) {
  downloadCsv(`${getFilename(data)}.csv`, getReportRows(data));
}

export function exportReportExcel(data: ReportData) {
  const rows = getReportRows(data);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet['!cols'] = rows.reduce<{ wch: number }[]>((widths, row) => {
    row.forEach((cell, index) => {
      const width = String(cell ?? '').length + 3;
      widths[index] = {
        wch: Math.min(Math.max(widths[index]?.wch ?? 12, width), 40),
      };
    });
    return widths;
  }, []);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    data.type === 'usage' ? 'Usage Report' : 'Response Times',
  );

  XLSX.writeFile(workbook, `${getFilename(data)}.xlsx`);
}

export function previewReportPdf(data: ReportData): boolean {
  const rows = getReportRows(data);
  const title = data.type === 'usage' ? 'Usage Report' : 'Response Times Report';

  const reportRows = rows
    .filter((row) => row.length > 0)
    .map(
      (row, index) => `
        <tr>
          ${row
            .map((cell) =>
              index === 0 ? `<th>${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`,
            )
            .join('')}
        </tr>
      `,
    )
    .join('');

  const previewWindow = window.open('', '_blank');

  if (!previewWindow) {
    return false;
  }

  previewWindow.document.open();
  previewWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 40px;
            color: #242044;
            font-family: Arial, sans-serif;
            background: #f5f5fc;
          }
          .report {
            max-width: 900px;
            margin: auto;
            padding: 40px;
            background: white;
          }
          h1 { margin: 0 0 8px; color: #382c77; }
          .subtitle { color: #747b9a; margin-bottom: 28px; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th, td {
            padding: 11px 13px;
            border: 1px solid #e4e7f2;
            text-align: left;
            overflow-wrap: anywhere;
          }
          th {
            color: #382c77;
            background: #f1f0fb;
          }
          .actions {
            max-width: 900px;
            margin: 0 auto 16px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }
          button {
            padding: 10px 18px;
            border: 0;
            border-radius: 8px;
            color: white;
            background: #382c77;
            cursor: pointer;
            font-size: 14px;
          }
          button.secondary { color: #382c77; background: #eae8f8; }
          @media print {
            body { padding: 0; background: white; }
            .report { padding: 0; }
            .actions { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="actions">
          <button class="secondary" onclick="window.close()">Close preview</button>
          <button onclick="window.print()">Export PDF / Print</button>
        </div>
        <main class="report">
          <h1>${escapeHtml(title)}</h1>
          <p class="subtitle">
            Reporting period: Last ${data.report.rangeDays} days
            <br />
            Generated: ${escapeHtml(new Date().toLocaleString('en-GB'))}
          </p>
          <table>
            <tbody>${reportRows}</tbody>
          </table>
        </main>
      </body>
    </html>
  `);
  previewWindow.document.close();

  return true;
}
