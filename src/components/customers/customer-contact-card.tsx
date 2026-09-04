"use client";

import { useEffect, useState, useTransition } from "react";
import { updateCustomer } from "@/server/customers";
import { whatsappLink } from "@/lib/phone";
import { toast } from "sonner";
import { Mail, MapPin, MessageCircle, Phone, Plus, User, X } from "lucide-react";
import { CustomerEditDialog } from "@/components/customers/customer-edit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ContactCustomer = {
  id: string;
  type: "individual" | "company";
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  emirates_id: string | null;
  passport_no: string | null;
  trn: string | null;
  address: string | null;
  notes: string | null;
  call_numbers: string[];
  assigned_to: string | null;
  assigned_to_profile: { id: string; full_name: string } | null;
};

export function CustomerContactCard({
  customer,
  agents,
  canEdit,
  nationalities = [],
}: {
  customer: ContactCustomer;
  agents: { id: string; full_name: string; role: string }[];
  canEdit: boolean;
  nationalities?: string[];
}) {
  const [draft, setDraft] = useState({
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    nationality: customer.nationality ?? "",
    call_numbers: customer.call_numbers ?? [],
  });
  const [callDraft, setCallDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const waLink = whatsappLink(draft.phone || null);

  useEffect(() => {
    setDraft({
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      nationality: customer.nationality ?? "",
      call_numbers: customer.call_numbers ?? [],
    });
  }, [customer.phone, customer.email, customer.nationality, customer.call_numbers]);

  function saveField(patch: {
    phone?: string | null;
    email?: string | null;
    nationality?: string | null;
    call_numbers?: string[];
  }) {
    if (!canEdit) return;
    startTransition(async () => {
      const result = await updateCustomer(customer.id, {
        ...patch,
        email: patch.email === null ? "" : patch.email,
      });
      if (result.ok) toast.success("Saved");
      else {
        setDraft({
          phone: customer.phone ?? "",
          email: customer.email ?? "",
          nationality: customer.nationality ?? "",
          call_numbers: customer.call_numbers ?? [],
        });
        toast.error(result.error ?? "Could not save");
      }
    });
  }

  function addCallNumber() {
    const next = callDraft.trim();
    if (!next) return;
    if (draft.call_numbers.includes(next) || draft.phone.trim() === next) {
      setCallDraft("");
      return;
    }
    const call_numbers = [...draft.call_numbers, next];
    setDraft((d) => ({ ...d, call_numbers }));
    setCallDraft("");
    saveField({ call_numbers });
  }

  function removeCallNumber(num: string) {
    const call_numbers = draft.call_numbers.filter((n) => n !== num);
    setDraft((d) => ({ ...d, call_numbers }));
    saveField({ call_numbers });
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card p-4">
      <div className="-mx-4 -mt-4 mb-4 h-0.5 bg-primary" />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Contact</h2>
        <CustomerEditDialog
          customer={{
            id: customer.id,
            type: customer.type,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            nationality: customer.nationality,
            emirates_id: customer.emirates_id,
            passport_no: customer.passport_no,
            trn: customer.trn,
            address: customer.address,
            notes: customer.notes,
            call_numbers: customer.call_numbers,
            assigned_to: customer.assigned_to,
          }}
          agents={agents}
          canEdit={canEdit}
        />
      </div>
      <div className="space-y-1 text-sm">
        <ContactEditRow
          icon={Phone}
          label="Phone"
          value={draft.phone}
          placeholder="Add phone"
          canEdit={canEdit}
          trailing={
            waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </a>
            ) : null
          }
          onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
          onSave={(v) => {
            const next = v.trim() || null;
            if ((customer.phone ?? null) === next) return;
            saveField({ phone: next });
          }}
        />

        <div className="border-b border-border/60 py-2.5">
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Other numbers
              </p>
              {draft.call_numbers.length > 0 ? (
                <ul className="mt-1.5 space-y-1.5">
                  {draft.call_numbers.map((num) => {
                    const link = whatsappLink(num);
                    return (
                      <li key={num} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 text-foreground">{num}</span>
                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </a>
                        ) : null}
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => removeCallNumber(num)}
                            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                            aria-label={`Remove ${num}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-0.5 text-muted-foreground">—</p>
              )}
              {canEdit ? (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={callDraft}
                    placeholder="Add number"
                    className="h-8"
                    onChange={(e) => setCallDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCallNumber();
                      }
                    }}
                  />
                  <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={addCallNumber}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <ContactEditRow
          icon={Mail}
          label="Email"
          value={draft.email}
          placeholder="Add email"
          canEdit={canEdit}
          inputType="email"
          onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
          onSave={(v) => {
            const next = v.trim() || null;
            if ((customer.email ?? null) === next) return;
            saveField({ email: next });
          }}
        />
        <ContactEditRow
          icon={User}
          label="Nationality"
          value={draft.nationality}
          placeholder="Add nationality"
          canEdit={canEdit}
          suggestions={nationalities}
          onChange={(v) => setDraft((d) => ({ ...d, nationality: v }))}
          onSave={(v) => {
            const next = v.trim() || null;
            if ((customer.nationality ?? null) === next) return;
            saveField({ nationality: next });
          }}
        />
        {customer.address ? (
          <div className="flex items-start gap-2 border-t border-border/60 py-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Address</p>
              <p className="text-foreground">{customer.address}</p>
            </div>
          </div>
        ) : null}
        {customer.assigned_to_profile ? (
          <div className="flex items-center gap-2 border-t border-border/60 py-2.5">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Agent</p>
              <p className="text-foreground">{customer.assigned_to_profile.full_name}</p>
            </div>
          </div>
        ) : null}
        {pending ? <p className="pt-1 text-[11px] text-muted-foreground">Saving…</p> : null}
      </div>
    </div>
  );
}

function ContactEditRow({
  icon: Icon,
  label,
  value,
  placeholder,
  canEdit,
  inputType = "text",
  trailing,
  suggestions,
  onChange,
  onSave,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  placeholder: string;
  canEdit: boolean;
  inputType?: string;
  trailing?: React.ReactNode;
  suggestions?: string[];
  onChange: (value: string) => void;
  onSave: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/60 py-2 last:border-b-0">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        {canEdit ? (
          suggestions && suggestions.length > 0 ? (
            <input
              list={`contact-${label}`}
              type={inputType}
              value={value}
              placeholder={placeholder}
              className="h-7 w-full rounded-md bg-transparent px-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 hover:bg-muted/40 focus:bg-muted/50"
              onChange={(e) => onChange(e.target.value)}
              onBlur={(e) => onSave(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
              }}
            />
          ) : (
            <input
              type={inputType}
              value={value}
              placeholder={placeholder}
              className="h-7 w-full rounded-md bg-transparent px-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 hover:bg-muted/40 focus:bg-muted/50"
              onChange={(e) => onChange(e.target.value)}
              onBlur={(e) => onSave(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
              }}
            />
          )
        ) : (
          <p className="text-foreground">{value.trim() || "—"}</p>
        )}
        {suggestions && suggestions.length > 0 ? (
          <datalist id={`contact-${label}`}>
            {suggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}
