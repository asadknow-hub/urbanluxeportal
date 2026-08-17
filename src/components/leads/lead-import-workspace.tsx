"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { importLeads } from "@/server/leads";
import {
  LEAD_IMPORT_FIELDS,
  SKIP_MAPPING,
  applyImportMapping,
  buildLeadImportSampleCsv,
  guessImportMapping,
  mappingConflicts,
  type LeadImportFieldKey,
  type LeadImportMapping,
  type ParsedLeadSheet,
} from "@/lib/lead-import";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

async function parseLeadSpreadsheet(file: File): Promise<ParsedLeadSheet> {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv") && !name.endsWith(".xlsx")) {
    throw new Error("Upload a .csv or .xlsx file");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("File must be 2 MB or smaller");
  }

  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("That file has no sheets");
  const sheet = workbook.Sheets[sheetName];
  const table = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  const matrix = table
    .map((row) => (Array.isArray(row) ? row.map((cell) => stringifyCell(cell)) : []))
    .filter((row) => row.some((cell) => cell.trim()));

  if (matrix.length < 2) {
    throw new Error("File needs a header row and at least one data row");
  }

  const rawHeaders = matrix[0];
  const headers: string[] = [];
  const headerIndex: number[] = [];
  rawHeaders.forEach((header, index) => {
    if (!header.trim()) return;
    headers.push(header.trim());
    headerIndex.push(index);
  });

  if (headers.length === 0) throw new Error("Could not read column headers");

  const rows = matrix.slice(1, 501).map((row) => headerIndex.map((index) => (row[index] ?? "").trim()));
  return { headers, rows };
}

function stringifyCell(cell: string | number | boolean | Date | null | undefined) {
  if (cell == null) return "";
  if (cell instanceof Date) return cell.toISOString();
  return String(cell).trim();
}

export function LeadImportWorkspace() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState<ParsedLeadSheet | null>(null);
  const [mapping, setMapping] = useState<LeadImportMapping>({});
  const [mapperOpen, setMapperOpen] = useState(false);
  const [summary, setSummary] = useState<{
    created: number;
    skipped: number;
    failed: number;
    errors: string[];
  } | null>(null);

  function downloadSample() {
    const csv = buildLeadImportSampleCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "urbanluxe-leads-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setParsing(true);
    setSummary(null);
    try {
      const parsed = await parseLeadSpreadsheet(file);
      const nextMapping = guessImportMapping(parsed.headers);
      setSheet(parsed);
      setMapping(nextMapping);
      setFileName(file.name);
      setMapperOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that file");
      setSheet(null);
      setFileName("");
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function setHeaderMapping(header: string, value: string | null) {
    const next = (value ?? SKIP_MAPPING) as LeadImportFieldKey | typeof SKIP_MAPPING;
    setMapping((prev) => ({ ...prev, [header]: next }));
  }

  function handleImport() {
    if (!sheet) return;
    const conflicts = mappingConflicts(mapping);
    if (conflicts.length > 0) {
      toast.error("Each CRM field can only be mapped once");
      return;
    }
    const nameMapped = Object.values(mapping).includes("name");
    if (!nameMapped) {
      toast.error("Map a column to Name");
      return;
    }
    const rows = applyImportMapping(sheet.headers, sheet.rows, mapping);
    startTransition(async () => {
      const result = await importLeads(rows);
      if (result.ok && result.data) {
        setSummary(result.data);
        setMapperOpen(false);
        toast.success(`${result.data.created} lead${result.data.created === 1 ? "" : "s"} imported`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Import failed");
      }
    });
  }

  const conflicts = mappingConflicts(mapping);
  const conflictedFields = new Set(conflicts.map(([field]) => field));
  const nameMapped = Object.values(mapping).includes("name");
  const previewRows = sheet?.rows.slice(0, 5) ?? [];

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
        <div className="-mx-5 -mt-5 mb-5 h-0.5 bg-primary" />
        <h2 className="text-base font-semibold text-foreground">Import leads</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Upload a CSV or Excel file. Map each file column to a field from Lead Settings, then import.
          Unassigned leads go through round-robin. Max 500 rows.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="cursor-pointer" onClick={downloadSample}>
            <Download className="mr-2 h-4 w-4" />
            Download sample CSV
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <button
          type="button"
          disabled={parsing}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mt-5 flex w-full cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors duration-200",
            "hover:border-primary/40 hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            "disabled:cursor-wait disabled:opacity-70"
          )}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFile(event.dataTransfer.files?.[0]);
          }}
        >
          {parsing ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="mt-3 text-sm font-medium text-foreground">
            {parsing ? "Reading file…" : "Choose a .csv or .xlsx file"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">First sheet, first row as headers. 2 MB max.</p>
        </button>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
        <div className="-mx-5 -mt-5 mb-5 h-0.5 bg-primary" />
        <h3 className="text-sm font-semibold text-foreground">Fields in the sample</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Same catalog as Fields. Preferred areas and tags can be separated with a semicolon.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {LEAD_IMPORT_FIELDS.map((field) => (
            <span
              key={field.key}
              className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground"
            >
              {field.label}
              {field.key === "name" ? " *" : ""}
            </span>
          ))}
        </div>
      </div>

      {summary && (
        <div className="overflow-hidden rounded-[14px] border border-border bg-card p-5">
          <div className="-mx-5 -mt-5 mb-5 h-0.5 bg-primary" />
          <h3 className="text-sm font-semibold text-foreground">Last import</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Created <span className="font-medium text-foreground">{summary.created}</span>
            {" · "}
            skipped duplicates or blank names{" "}
            <span className="font-medium text-foreground">{summary.skipped}</span>
            {" · "}
            failed <span className="font-medium text-foreground">{summary.failed}</span>
          </p>
          {summary.errors.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {summary.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={mapperOpen} onOpenChange={setMapperOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl md:max-w-4xl">
          <DialogHeader className="border-b border-border bg-card p-5">
            <DialogTitle>Map columns</DialogTitle>
            <DialogDescription>
              {fileName ? (
                <span className="inline-flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  {fileName} · {sheet?.rows.length ?? 0} rows
                </span>
              ) : (
                "Attach each file column to a CRM field."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 p-5">
            <div className="overflow-hidden rounded-[14px] border border-border">
              <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                <span>File column</span>
                <span>CRM field</span>
              </div>
              <div className="divide-y divide-border">
                {sheet?.headers.map((header, headerIndex) => {
                  const target = mapping[header] ?? SKIP_MAPPING;
                  const conflicted = target !== SKIP_MAPPING && conflictedFields.has(target);
                  return (
                    <div key={`${header}-${headerIndex}`} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{header}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {previewRows.map((row) => row[headerIndex] || "—").slice(0, 3).join(" · ")}
                        </p>
                      </div>
                      <Select value={target} onValueChange={(value) => setHeaderMapping(header, value)}>
                        <SelectTrigger
                          className={cn(
                            "h-9 w-full min-w-0 cursor-pointer",
                            conflicted && "border-destructive"
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72" alignItemWithTrigger={false}>
                          <SelectItem value={SKIP_MAPPING}>Skip column</SelectItem>
                          {LEAD_IMPORT_FIELDS.map((field) => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label}
                              {field.key === "name" ? " *" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>

            {conflicts.length > 0 && (
              <p className="text-sm text-destructive">
                These fields are mapped more than once: {conflicts.map(([field]) => field).join(", ")}.
              </p>
            )}
            {!nameMapped && (
              <p className="text-sm text-destructive">Map one column to Name before importing.</p>
            )}

            {sheet && previewRows.length > 0 && (
              <div className="overflow-x-auto rounded-[14px] border border-border">
                <table className="w-full min-w-[32rem] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                      {sheet.headers.map((header) => (
                        <th key={header} className="px-3 py-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-border last:border-b-0">
                        {row.map((cell, cellIndex) => (
                          <td key={`${rowIndex}-${cellIndex}`} className="max-w-[10rem] truncate px-3 py-2 text-foreground">
                            {cell || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => setMapperOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="cursor-pointer"
              disabled={pending || !nameMapped || conflicts.length > 0}
              onClick={handleImport}
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {sheet?.rows.length ?? 0} rows
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
