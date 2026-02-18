import * as XLSX from "xlsx";

/**
 * Column definition for export.
 * `key` is the field name on the data object.
 * `header` is the human-readable column header.
 */
export interface ExportColumn {
  key: string;
  header: string;
}

/**
 * Supported export formats.
 */
export type ExportFormat = "csv" | "xlsx";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatCellValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().split("T")[0];
  if (typeof value === "object") return JSON.stringify(value);
  return value as string | number | boolean;
}

function buildRows(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
): (string | number | boolean | null)[][] {
  return data.map((row) =>
    columns.map((col) => formatCellValue(row[col.key])),
  );
}

// ---------------------------------------------------------------------------
// CSV generation
// ---------------------------------------------------------------------------

function generateCSV(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
): string {
  const headers = columns.map((c) => c.header);
  const rows = buildRows(data, columns);

  return [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// XLSX generation
// ---------------------------------------------------------------------------

function generateXLSX(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  sheetName = "Export",
): Uint8Array {
  const headers = columns.map((c) => c.header);
  const rows = buildRows(data, columns);
  const aoaData = [headers, ...rows];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);

  // Auto-size columns based on header widths (simple heuristic)
  worksheet["!cols"] = columns.map((col) => ({
    wch: Math.max(col.header.length, 15),
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer;

  return new Uint8Array(buffer);
}

// ---------------------------------------------------------------------------
// Public API: build a downloadable Response
// ---------------------------------------------------------------------------

/**
 * Creates a Response for file download in either CSV or XLSX format.
 *
 * @param data      Array of objects to export
 * @param columns   Column definitions (key + header)
 * @param format    "csv" or "xlsx"
 * @param filename  Base filename without extension (e.g. "assets-export")
 * @param sheetName Optional sheet name for XLSX (defaults to "Export")
 */
export function buildExportResponse(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  format: ExportFormat,
  filename: string,
  sheetName?: string,
): Response {
  if (format === "xlsx") {
    const uint8 = generateXLSX(data, columns, sheetName);
    const buffer = Buffer.from(uint8);
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  // Default: CSV
  const csv = generateCSV(data, columns);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
