export function parseAreaNames(raw: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of raw.split(/[\n\r,;|\t]+/)) {
    const name = part.replace(/^["']+|["']+$/g, "").trim();
    if (!name) continue;
    if (/^(area|areas|name|community|communities)$/i.test(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

export async function parseAreaFile(file: File): Promise<string[]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(workbook.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: "",
    });
    const cells = rows.flatMap((row) => (Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : []));
    return parseAreaNames(cells.join("\n"));
  }
  return parseAreaNames(await file.text());
}
