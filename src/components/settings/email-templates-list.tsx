"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Save, Loader2, Mail } from "lucide-react";

type Template = {
  id: string;
  key: string;
  subject: string;
  body_html: string;
};

export function EmailTemplatesList({ templates }: { templates: Template[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function startEditing(t: Template) {
    setEditingId(t.id);
    setSubject(t.subject);
    setBody(t.body_html);
  }

  function handleSave() {
    if (!editingId) return;
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("email_templates")
        .update({ subject, body_html: body, updated_at: new Date().toISOString() })
        .eq("id", editingId);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Template saved");
        setEditingId(null);
      }
    });
  }

  if (editingId) {
    const template = templates.find((t) => t.id === editingId);
    return (
      <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 capitalize">
              {template?.key.replace(/_/g, " ")}
            </h3>
            <p className="text-xs text-slate-400 font-mono">{template?.key}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
            Cancel
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tpl_subject">Subject</Label>
          <Input
            id="tpl_subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tpl_body">Body (HTML)</Label>
          <Textarea
            id="tpl_body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />
          <p className="text-xs text-slate-400">
            Use <code className="bg-slate-100 px-1 rounded">{"{{placeholders}}"}</code> for dynamic content.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Template
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm border border-slate-200"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 capitalize">
                {t.key.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-slate-400 font-mono">{t.key}</p>
              <p className="mt-1 text-xs text-slate-500 truncate max-w-md">{t.subject}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => startEditing(t)}>
            Edit
          </Button>
        </div>
      ))}
    </div>
  );
}
