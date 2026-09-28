import ExcelJS from 'exceljs';

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2247' } };

/**
 * Ustunlar ta'rifidan xlsx bufer yasaydi.
 *
 * @param {{ sheetName: string, columns: { header: string, key: string, width: number }[], rows: object[] }} options
 */
export async function buildWorkbook({ sheetName, columns, rows }) {
  const workbook = new ExcelJS.Workbook();

  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = columns;

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: 'middle' };
  header.height = 22;

  for (const row of rows) {
    sheet.addRow(row);
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  for (const row of sheet.getRows(2, sheet.rowCount) ?? []) {
    row.alignment = { vertical: 'top', wrapText: true };
  }

  return workbook.xlsx.writeBuffer();
}

/**
 * Yuklab olinadigan fayl nomi: nom-2026-09-28.xlsx
 *
 * @param {string} prefix
 */
export function exportFileName(prefix) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  return `${prefix}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.xlsx`;
}

/**
 * Javobga xlsx faylni yuboradi.
 *
 * @param {import('express').Response} res
 * @param {ArrayBuffer} buffer
 * @param {string} fileName
 */
export function sendWorkbook(res, buffer, fileName) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(Buffer.from(buffer));
}

/**
 * `from` / `to` (YYYY-MM-DD) dan createdAt filtri yasaydi.
 * Kunlar mahalliy vaqt mintaqasi bo'yicha to'liq olinadi.
 *
 * @param {string | undefined} from
 * @param {string | undefined} to
 */
export function dateRangeFilter(from, to) {
  const range = {};

  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (!Number.isNaN(start.valueOf())) range.$gte = start;
  }

  if (to) {
    const end = new Date(`${to}T00:00:00`);

    if (!Number.isNaN(end.valueOf())) {
      end.setDate(end.getDate() + 1);
      range.$lt = end;
    }
  }

  return Object.keys(range).length ? { createdAt: range } : {};
}
