"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, isExpiringSoon, isOverdue } from "@/lib/dates";
import { deleteDocument, getSignedUrl } from "@/server/documents";
import { toast } from "sonner";
import { Search, Trash2, FileText, Image as ImageIcon, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";

export type DocumentRow = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  category: string;
  entity_type: string | null;
  entity_id: string | null;
  expiry_date: string | null;
  created_at: string;
};

const CATEGORIES = [
  "emirates_id",
  "passport",
  "title_deed",
  "noc",
  "contract",
  "permit",
  "invoice",
  "receipt",
  "other",
];

const ENTITY_TYPES = ["customer", "property", "deal", "invoice", "expense"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsList({
  documents,
  currentFilters,
}: {
  documents: DocumentRow[];
  currentFilters: { q?: string; category?: string; entity_type?: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentFilters.q ?? "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/documents?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", searchValue);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-56 pl-9"
          />
        </form>

        <Select
          value={currentFilters.category ?? "all"}
          onValueChange={(v) => updateFilter("category", v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.entity_type ?? "all"}
          onValueChange={(v) => updateFilter("entity_type", v ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {ENTITY_TYPES.map((e) => (
              <SelectItem key={e} value={e}>
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <DocumentRowItem key={doc.id} doc={doc} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DocumentRowItem({ doc }: { doc: DocumentRow }) {
  const [pending, startTransition] = useTransition();
  const isImage = doc.mime_type.startsWith("image/");

  function handleView() {
    startTransition(async () => {
      const result = await getSignedUrl(doc.storage_path);
      if (result.ok && result.data) {
        window.open(result.data.url, "_blank");
      } else {
        toast.error(result.error ?? "Failed to get URL");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDocument(doc.id);
      if (result.ok) {
        toast.success("Document deleted");
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  const overdue = doc.expiry_date && isOverdue(doc.expiry_date);
  const expiringSoon = doc.expiry_date && isExpiringSoon(doc.expiry_date);

  return (
    <tr className="group hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isImage ? (
            <ImageIcon className="h-4 w-4 text-slate-400" />
          ) : (
            <FileText className="h-4 w-4 text-slate-400" />
          )}
          <span className="font-medium text-slate-900">{doc.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 capitalize">
          {doc.category.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-500 capitalize">
        {doc.entity_type ?? "—"}
      </td>
      <td className="px-4 py-3 text-slate-400">{formatBytes(doc.size_bytes)}</td>
      <td className="px-4 py-3 text-slate-500">{formatDate(doc.created_at)}</td>
      <td className="px-4 py-3">
        {doc.expiry_date ? (
          <div className="flex items-center gap-1">
            <span className={overdue ? "text-red-600 font-medium" : expiringSoon ? "text-amber-600 font-medium" : "text-slate-500"}>
              {formatDate(doc.expiry_date)}
            </span>
            {(overdue || expiringSoon) && (
              <AlertTriangle className={`h-3.5 w-3.5 ${overdue ? "text-red-500" : "text-amber-500"}`} />
            )}
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button size="sm" variant="ghost" onClick={handleView} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4 text-slate-400" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete} disabled={pending}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
