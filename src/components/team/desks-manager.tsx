"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { archiveDesk, saveDesk } from "@/server/team";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, UsersRound } from "lucide-react";

export type DeskRow = {
  id: string;
  name: string;
  is_active?: boolean;
};

export function DesksManager({
  desks,
  memberCounts,
  canEdit,
}: {
  desks: DeskRow[];
  memberCounts: Record<string, number>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveDesk({ name: newName });
      if (result.ok) {
        toast.success("Desk created");
        setCreateOpen(false);
        setNewName("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not create desk");
      }
    });
  }

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    startTransition(async () => {
      const result = await saveDesk({ id: editingId, name: editName });
      if (result.ok) {
        toast.success("Desk renamed");
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not rename");
      }
    });
  }

  function handleArchive(id: string, name: string) {
    startTransition(async () => {
      const result = await archiveDesk(id);
      if (result.ok) {
        toast.success(`${name} archived`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not archive");
      }
    });
  }

  return (
    <section className="rounded-[18px] border border-[#e9e5dc] bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <UsersRound className="h-4 w-4 text-muted-foreground" />
            Desks
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Org grouping for round-robin. Unassigned staff still share the house pool.
          </p>
        </div>
        {canEdit ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={(props) => (
                <Button {...props} size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add desk
                </Button>
              )}
            />
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>New desk</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="desk_name">Name</Label>
                  <Input
                    id="desk_name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Secondary"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={pending || !newName.trim()}>
                    {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Create
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {desks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No desks yet. Add Secondary or Off-plan to start routing by team.</p>
      ) : (
        <ul className="divide-y divide-border">
          {desks.map((desk) => (
            <li key={desk.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              {editingId === desk.id ? (
                <form onSubmit={handleRename} className="flex min-w-0 flex-1 items-center gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" required />
                  <Button type="submit" size="sm" disabled={pending}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{desk.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {memberCounts[desk.id] ?? 0} staff
                    </p>
                  </div>
                  {canEdit ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(desk.id);
                          setEditName(desk.name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        disabled={pending}
                        onClick={() => handleArchive(desk.id, desk.name)}
                      >
                        Archive
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
