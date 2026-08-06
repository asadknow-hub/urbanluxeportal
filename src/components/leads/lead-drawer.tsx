"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getStatusColor } from "@/lib/status-colors";
import { whatsappLink } from "@/lib/phone";
import { formatAED } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { convertLead, addLeadActivity, updateLead } from "@/server/leads";
import { toast } from "sonner";
import {
  MessageCircle,
  Phone,
  Mail,
  TrendingUp,
  UserPlus,
  XCircle,
  Activity,
} from "lucide-react";
import type { LeadRow } from "./leads-table";

export function LeadDrawer({ lead, onClose }: { lead: LeadRow; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const [converting, setConverting] = useState(false);
  const [activityText, setActivityText] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const colors = getStatusColor(lead.status);
  const waLink = whatsappLink(lead.phone);

  function handleClose() {
    setOpen(false);
    onClose();
  }

  function handleConvert() {
    setConverting(true);
  }

  function confirmConvert() {
    startTransition(async () => {
      const result = await convertLead(lead.id, {});
      if (result.ok) {
        toast.success("Lead converted to pipeline deal");
        handleClose();
        router.refresh();
      } else {
        toast.error(result.error ?? "Conversion failed");
      }
      setConverting(false);
    });
  }

  function handleAddActivity() {
    if (!activityText.trim()) return;
    startTransition(async () => {
      const result = await addLeadActivity(lead.id, activityType, activityText);
      if (result.ok) {
        toast.success("Activity logged");
        setActivityText("");
      } else {
        toast.error(result.error ?? "Failed to log activity");
      }
    });
  }

  function handleMarkUnqualified() {
    startTransition(async () => {
      const result = await updateLead(lead.id, { status: "unqualified" } as any);
      if (result.ok) {
        toast.success("Lead marked as unqualified");
        handleClose();
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update lead");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{lead.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
              {lead.status}
            </span>
            {lead.score !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <TrendingUp className="h-3 w-3" />
                Score: {lead.score}
              </span>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500">Contact</h3>
            <div className="space-y-1.5 text-sm">
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <a href={`tel:${lead.phone}`} className="text-slate-700 hover:text-slate-900">
                    {lead.phone}
                  </a>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a href={`mailto:${lead.email}`} className="text-slate-700 hover:text-slate-900">
                    {lead.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Lead details */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500">Details</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Source</dt>
                <dd className="font-medium text-slate-700 capitalize">{lead.source.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Interest</dt>
                <dd className="font-medium text-slate-700 capitalize">{lead.interest.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Budget</dt>
                <dd className="font-medium text-slate-700">
                  {lead.budget_min || lead.budget_max
                    ? `${lead.budget_min ? formatAED(lead.budget_min) : "?"} – ${lead.budget_max ? formatAED(lead.budget_max) : "?"}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Agent</dt>
                <dd className="font-medium text-slate-700">
                  {lead.assigned_to_profile?.full_name ?? "Unassigned"}
                </dd>
              </div>
              {lead.next_follow_up_at && (
                <div>
                  <dt className="text-xs text-slate-400">Next follow-up</dt>
                  <dd className="font-medium text-slate-700">{formatDate(lead.next_follow_up_at)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-400">Created</dt>
                <dd className="font-medium text-slate-700">{formatDate(lead.created_at)}</dd>
              </div>
            </dl>
          </div>

          {/* Quick add activity */}
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Activity className="h-4 w-4" />
              Add Activity
            </h3>
            <div className="flex gap-2">
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="viewing">Viewing</option>
              </select>
              <Input
                placeholder="Quick note..."
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddActivity}
                disabled={pending || !activityText.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          {lead.status !== "converted" && lead.status !== "unqualified" && (
            <div className="flex flex-col gap-2">
              {converting ? (
                <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-700">Convert to pipeline deal?</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                      onClick={() => confirmConvert()}
                      disabled={pending}
                    >
                      Confirm Conversion
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setConverting(false)}
                      disabled={pending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleConvert}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convert to Pipeline Deal
                </Button>
              )}
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleMarkUnqualified}
                disabled={pending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Mark Unqualified
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
