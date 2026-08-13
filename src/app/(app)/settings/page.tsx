import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import Link from "next/link";
import { Users, Zap, Mail, ChevronRight, Route } from "lucide-react";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "settings") && !can(user.role, "user_management"))
    redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your company profile and system configuration.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/settings/leads" className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2">
                <Route className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Leads</p>
                <p className="text-xs text-slate-400">CRM activation flow</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
          </div>
        </Link>

        <Link href="/settings/users" className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Users</p>
                <p className="text-xs text-slate-400">Manage team & roles</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
          </div>
        </Link>

        <Link href="/settings/automations" className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Automations</p>
                <p className="text-xs text-slate-400">Workflow rules</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
          </div>
        </Link>

        <Link href="/settings/email-templates" className="group rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Email Templates</p>
                <p className="text-xs text-slate-400">Transactional emails</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
          </div>
        </Link>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input defaultValue={settings?.company_name ?? ""} placeholder="UrbanLuxe Real Estate" />
            </div>
            <div className="space-y-2">
              <Label>TRN (Tax Registration Number)</Label>
              <Input defaultValue={settings?.trn ?? ""} placeholder="100123456700003" />
            </div>
            <div className="space-y-2">
              <Label>RERA ORN</Label>
              <Input defaultValue={settings?.rera_orn ?? ""} placeholder="12345" />
            </div>
            <div className="space-y-2">
              <Label>VAT Rate (%)</Label>
              <Input type="number" defaultValue={settings?.vat_rate ?? 5} step="0.1" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue={settings?.phone ?? ""} placeholder="+971 4 123 4567" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={settings?.email ?? ""} placeholder="info@urbanluxe.ae" />
            </div>
            <div className="space-y-2">
              <Label>Quotation Prefix</Label>
              <Input defaultValue={settings?.quotation_prefix ?? "QT-"} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input defaultValue={settings?.invoice_prefix ?? "INV-"} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input defaultValue={settings?.address ?? ""} placeholder="Office 123, Business Bay, Dubai, UAE" />
          </div>
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
