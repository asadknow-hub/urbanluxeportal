"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { shortTimeAgo, formatDateTime } from "@/lib/dates";
import { toast } from "sonner";
import { ChevronDown, Mail, MessageCircle, Phone, UserRound } from "lucide-react";

export type ContactAttemptItem = {
  id: string;
  type: string;
  summary: string | null;
  occurred_at: string;
};

const METHODS = [
  { key: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
  { key: "call" as const, label: "Call", icon: Phone },
  { key: "email" as const, label: "Email", icon: Mail },
  { key: "in_person" as const, label: "In Person", icon: UserRound },
];

const CONTACT_TYPES = new Set(["whatsapp", "call", "email", "in_person", "phone"]);

export function isContactAttemptType(type: string) {
  return CONTACT_TYPES.has(type.toLowerCase());
}

export function ContactAttemptsPanel({
  canEdit,
  items,
  onSave,
  highlight = false,
  title = "Contact Attempts",
  description = "Log how you reached out on this deal.",
  emptyLabel = "No attempts logged yet.",
  successToast = "Contact attempt logged",
}: {
  canEdit: boolean;
  items: ContactAttemptItem[];
  onSave: (type: string, summary: string) => Promise<{ ok: boolean; error?: string }>;
  highlight?: boolean;
  title?: string;
  description?: string;
  emptyLabel?: string;
  successToast?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [contactMethod, setContactMethod] = useState<(typeof METHODS)[number]["key"] | null>(null);
  const [contactNote, setContactNote] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [optimistic, setOptimistic] = useState<ContactAttemptItem[] | null>(null);

  const attempts = useMemo(() => {
    const source = optimistic ?? items;
    return source
      .filter((item) => isContactAttemptType(item.type))
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  }, [items, optimistic]);

  const visible = historyOpen ? attempts : attempts.slice(0, 3);

  return (
    <section
      id="contact-attempts-section"
      className={`rounded-[14px] border px-4 py-5 text-[#7c2d12] transition-shadow ${
        highlight
          ? "border-[#ea580c] bg-[#fff7ed] ring-2 ring-[#fb923c]/40"
          : "border-[#fdba74] bg-[#fff7ed]"
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2
          className="font-heading text-[1.12rem] text-[#9a3412]"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {title}
        </h2>
        <span className="rounded-full bg-[#ea580c] px-2.5 py-0.5 text-[0.72rem] font-bold tabular-nums text-white">
          {attempts.length}
        </span>
      </div>
      <p className="mb-4 text-[0.78rem] text-[#9a3412]/75">{description}</p>

      {canEdit ? (
        <>
          <div className="flex gap-2">
            {METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  type="button"
                  title={m.label}
                  onClick={() => setContactMethod(contactMethod === m.key ? null : m.key)}
                  className={`grid h-11 w-11 place-items-center rounded-[10px] border transition-colors ${
                    contactMethod === m.key
                      ? "border-[#ea580c] bg-[#ea580c] text-white"
                      : "border-[#fdba74] bg-white text-[#c2410c] hover:border-[#ea580c] hover:bg-[#ffedd5]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
          <Textarea
            rows={2}
            value={contactNote}
            onChange={(e) => setContactNote(e.target.value)}
            placeholder="What happened? e.g. Left voicemail, scheduled callback…"
            className="mt-3 min-h-[60px] resize-none border-[#fdba74] bg-white text-sm text-foreground"
          />
          <Button
            size="sm"
            className="mt-3 w-full bg-[#ea580c] text-white hover:bg-[#c2410c]"
            disabled={!contactMethod || pending}
            onClick={() => {
              if (!contactMethod) return;
              const label =
                contactMethod === "in_person"
                  ? "In-person"
                  : contactMethod.charAt(0).toUpperCase() + contactMethod.slice(1);
              const summary = contactNote.trim()
                ? `${label}: ${contactNote.trim()}`
                : `${label} contact attempt`;
              const now = new Date().toISOString();
              const prev = attempts;
              setOptimistic([
                {
                  id: `opt_ca_${Date.now()}`,
                  type: contactMethod,
                  summary,
                  occurred_at: now,
                },
                ...prev,
              ]);
              startTransition(async () => {
                const result = await onSave(contactMethod, summary);
                if (result.ok) {
                  toast.success(successToast);
                  setContactMethod(null);
                  setContactNote("");
                  setOptimistic(null);
                  router.refresh();
                } else {
                  setOptimistic(null);
                  toast.error(result.error ?? "Failed");
                }
              });
            }}
          >
            Save
          </Button>
        </>
      ) : null}

      <div className={`${canEdit ? "mt-4 border-t border-[#fdba74] pt-3" : ""}`}>
        <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#9a3412]/70">
          History
        </p>
        {attempts.length === 0 ? (
          <p className="text-[0.8rem] text-[#9a3412]/65">{emptyLabel}</p>
        ) : (
          <>
            <ul className="space-y-2">
              {visible.map((item) => (
                <li key={item.id} className="rounded-lg border border-[#fed7aa] bg-white px-2.5 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[0.78rem] font-semibold capitalize text-[#9a3412]">
                      {item.type === "in_person" ? "In person" : item.type}
                    </span>
                    <span
                      className="shrink-0 text-[0.68rem] text-[#c2410c]/80"
                      title={formatDateTime(item.occurred_at)}
                    >
                      {shortTimeAgo(item.occurred_at)}
                    </span>
                  </div>
                  {item.summary ? (
                    <p className="mt-0.5 text-[0.78rem] leading-snug text-foreground/80">
                      {item.summary}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {attempts.length > 3 ? (
              <button
                type="button"
                className="mt-2 inline-flex w-full items-center justify-center gap-1 text-[0.75rem] font-semibold text-[#c2410c] hover:text-[#9a3412]"
                onClick={() => setHistoryOpen((v) => !v)}
              >
                {historyOpen ? "Show less" : `Show ${attempts.length - 3} more`}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${historyOpen ? "rotate-180" : ""}`}
                />
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
