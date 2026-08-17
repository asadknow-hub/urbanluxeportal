"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importLeads } from "@/server/leads";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SAMPLE = `name,phone,email,source,interest,notes
Aisha Rahman,+971501234567,aisha@example.com,import,buy,Marina 2BR
Omar Haddad,+971509876543,omar@example.com,website,rent,`;

export function LeadImportForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [csv, setCsv] = useState("");
  const [summary, setSummary] = useState<{ created: number; skipped: number; failed: number; errors: string[] } | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    file.text().then(setCsv).catch(() => toast.error("Could not read that file"));
  }

  function handleImport() {
    startTransition(async () => {
      const result = await importLeads(csv);
      if (result.ok && result.data) {
        setSummary(result.data);
        toast.success(`${result.data.created} lead${result.data.created === 1 ? "" : "s"} imported`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Import failed");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl" style={{ fontFamily: "var(--font-display), serif" }}>
            Import leads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CSV with a header row. Required column: <code className="text-foreground">name</code>. Optional: phone, email, source, interest, notes. Max 500 rows. Unassigned rows go through round-robin.
          </p>
        </div>
        <Link
          href="/leads"
          className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium"
        >
          Back to board
        </Link>
      </div>

      <div className="space-y-3 rounded-[14px] border border-border bg-card p-5">
        <input
          type="file"
          accept=".csv,text/csv"
          className="block cursor-pointer text-sm"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={12}
          className="font-mono text-xs"
          placeholder={SAMPLE}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={pending || !csv.trim()} onClick={handleImport}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCsv(SAMPLE)}>
            Load sample
          </Button>
        </div>
      </div>

      {summary && (
        <div className="rounded-[14px] border border-border bg-card p-5 text-sm">
          <p>
            Created <b>{summary.created}</b> · skipped duplicates/blank <b>{summary.skipped}</b> · failed <b>{summary.failed}</b>
          </p>
          {summary.errors.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
              {summary.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
