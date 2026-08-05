"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleAutomation } from "@/server/automations";
import { toast } from "sonner";
import { Zap, Bell, RefreshCw, FileWarning } from "lucide-react";

type Rule = {
  id: string;
  name: string;
  is_active: boolean;
  trigger: string;
  conditions: Record<string, unknown> | null;
  actions: Array<{ type: string; role?: string }> | null;
};

const TRIGGER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  lead_created: Zap,
  deal_stage_changed: Zap,
  cheque_due_in_7d: Bell,
  doc_expiring_30d: FileWarning,
};

export function AutomationsList({ rules }: { rules: Rule[] }) {
  const [pending, startTransition] = useTransition();

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleAutomation(id, !current);
      if (result.ok) {
        toast.success(`Rule ${!current ? "enabled" : "disabled"}`);
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm border border-slate-200">
          <Zap className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-400">No automation rules found.</p>
        </div>
      ) : (
        rules.map((rule) => {
          const Icon = TRIGGER_ICONS[rule.trigger] ?? Zap;
          const actionSummary = (rule.actions ?? [])
            .map((a) => {
              if (a.type === "notify") return `Notify ${a.role ?? "team"}`;
              if (a.type === "assign_round_robin") return "Round-robin assign";
              if (a.type === "send_email") return "Send email";
              if (a.type === "create_followup") return "Create follow-up";
              return a.type;
            })
            .join(" · ");

          return (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm border border-slate-200"
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 ${rule.is_active ? "bg-emerald-50" : "bg-slate-100"}`}>
                  <Icon className={`h-5 w-5 ${rule.is_active ? "text-emerald-600" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                  <p className="text-xs text-slate-400">
                    Trigger: <span className="font-mono">{rule.trigger}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Actions: {actionSummary || "—"}
                  </p>
                </div>
              </div>
              <Switch
                checked={rule.is_active}
                onCheckedChange={() => handleToggle(rule.id, rule.is_active)}
                disabled={pending}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
