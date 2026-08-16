"use client";

import { useState, useTransition } from "react";
import { deleteDocument, getSignedUrl, updateDocument } from "@/server/documents";
import { DOC_CATEGORIES, formatDocCategory } from "@/lib/document-storage";
import { toast } from "sonner";
import { ExternalLink, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type LeadDocument = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  category: string;
  created_at: string;
};

export function LeadDocumentsList({
  documents,
  onChange,
}: {
  documents: LeadDocument[];
  onChange: (next: LeadDocument[]) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<LeadDocument | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");

  function openEdit(doc: LeadDocument) {
    setEditing(doc);
    setEditName(doc.name);
    setEditCategory(doc.category);
  }

  async function openFile(path: string) {
    const result = await getSignedUrl(path);
    if (result.ok && result.data?.url) window.open(result.data.url, "_blank");
    else toast.error(result.error ?? "Could not open file");
  }

  function saveEdit() {
    if (!editing || !editName.trim() || !editCategory) return;
    const id = editing.id;
    const name = editName.trim();
    const category = editCategory;
    onChange(documents.map((doc) => (doc.id === id ? { ...doc, name, category } : doc)));
    setEditing(null);
    startTransition(async () => {
      const result = await updateDocument(id, { name, category });
      if (!result.ok) toast.error(result.error ?? "Could not update document");
    });
  }

  function remove(doc: LeadDocument) {
    onChange(documents.filter((row) => row.id !== doc.id));
    startTransition(async () => {
      const result = await deleteDocument(doc.id);
      if (!result.ok) {
        onChange(documents);
        toast.error(result.error ?? "Could not delete document");
      }
    });
  }

  if (documents.length === 0) return null;

  return (
    <>
      <ul className="mt-3 divide-y divide-border/60 border-t border-border/60">
        {documents.map((doc) => (
          <li key={doc.id} className="group flex items-center gap-2 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{formatDocCategory(doc.category)}</p>
              <p className="truncate text-[0.78rem] text-muted-foreground">{doc.name}</p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <button type="button" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Edit document" onClick={() => openEdit(doc)}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Open document" onClick={() => openFile(doc.storage_path)}>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-red-700" aria-label="Delete document" disabled={pending} onClick={() => remove(doc)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
            <Select value={editCategory} onValueChange={(v) => setEditCategory(v ?? "")}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {DOC_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatDocCategory(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" disabled={!editName.trim() || !editCategory || pending} onClick={saveEdit}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
