/**
 * CSV-injection safe field encoder.
 * Prefixes a leading `=`, `+`, `-`, `@`, `\t` or `\r` with `'` so spreadsheet
 * apps won't interpret the cell as a formula. Then quotes the field if it
 * contains delimiters.
 */
export function csvField(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build a CSV string from a header row + array of value arrays.
 *  Starts with a UTF-8 BOM so Excel shows Arabic text correctly. */
export function buildCsv(header: string[], rows: unknown[][]): string {
  const lines = [header.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvField).join(","));
  }
  return "\uFEFF" + lines.join("\n");
}
