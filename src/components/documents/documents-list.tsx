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
  notes: string | null;
  created_at: string;
};

const ENTITY_TYPES = ["lead", "customer", "deal", "profile"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsList({
  documents,
  currentFilters,
  categories = [],
}: {
  documents: DocumentRow[];
  currentFilters: { q?: string; category?: string; entity_type?: string };
  categories?: { value: string; label: string }[];
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
      <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-100/80 backdrop-blur-md rounded-[1.25rem] w-fit border border-slate-200/60 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-56 pl-10 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus-visible:ring-emerald-500/20"
          />
        </form>

        <Select
          value={currentFilters.category ?? "all"}
          onValueChange={(v) => updateFilter("category", v ?? "all")}
        >
          <SelectTrigger className="w-36 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-emerald-500/20">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.entity_type ?? "all"}
          onValueChange={(v) => updateFilter("entity_type", v ?? "all")}
        >
          <SelectTrigger className="w-36 h-10 rounded-xl bg-white border-slate-200 shadow-sm focus:ring-emerald-500/20">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl">
            <SelectItem value="all">All Entities</SelectItem>
            {ENTITY_TYPES.map((e) => (
              <SelectItem key={e} value={e}>
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm border border-slate-200/60 p-2">
        <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3 rounded-tl-[1.5rem]">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Expiry / note</th>
                <th className="px-4 py-3 rounded-tr-[1.5rem]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
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
    <tr className="group hover:bg-slate-50/50 transition-colors duration-200">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isImage ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
            {isImage ? (
              <ImageIcon className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </div>
          <span className="font-semibold text-slate-900 line-clamp-1">{doc.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {doc.category.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-500 font-medium capitalize">
        {doc.entity_type ?? "—"}
      </td>
      <td className="px-4 py-3 text-slate-400 font-medium">{formatBytes(doc.size_bytes)}</td>
      <td className="px-4 py-3 text-slate-500 font-medium">{formatDate(doc.created_at)}</td>
      <td className="px-4 py-3">
        {doc.expiry_date ? (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${overdue ? "bg-red-50 text-red-600 border border-red-100" : expiringSoon ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-slate-50 text-slate-500 border border-slate-100"}`}>
              {formatDate(doc.expiry_date)}
            </span>
            {(overdue || expiringSoon) && (
              <AlertTriangle className={`h-4 w-4 ${overdue ? "text-red-500" : "text-amber-500"}`} />
            )}
          </div>
        ) : doc.notes?.trim() ? (
          <span className="line-clamp-2 text-xs font-medium text-slate-500">{doc.notes}</span>
        ) : (
          <span className="text-slate-300 font-medium">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-slate-200/50 hover:text-slate-900 rounded-full" onClick={handleView} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-full" onClick={handleDelete} disabled={pending}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
