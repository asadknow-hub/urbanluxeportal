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
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              System Configuration
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Settings & Preferences
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
              Manage your company profile, team access, and CRM automation rules.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/settings/leads" className="group rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-[1.5rem] bg-emerald-50/50 border border-emerald-100 p-3 transition-transform group-hover:scale-110">
              <Route className="h-6 w-6 text-emerald-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-auto">
            <p className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Leads</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">CRM activation flow</p>
          </div>
        </Link>

        <Link href="/settings/users" className="group rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-[1.5rem] bg-blue-50/50 border border-blue-100 p-3 transition-transform group-hover:scale-110">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-auto">
            <p className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Users & Roles</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Manage team access</p>
          </div>
        </Link>

        <Link href="/settings/automations" className="group rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 hover:border-amber-200 transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-[1.5rem] bg-amber-50/50 border border-amber-100 p-3 transition-transform group-hover:scale-110">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-auto">
            <p className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Automations</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Workflow rules</p>
          </div>
        </Link>

        <Link href="/settings/email-templates" className="group rounded-[2rem] bg-white p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 hover:border-purple-200 transition-all duration-300 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-[1.5rem] bg-purple-50/50 border border-purple-100 p-3 transition-transform group-hover:scale-110">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-auto">
            <p className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Email Templates</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Transactional emails</p>
          </div>
        </Link>
      </div>

      <div className="rounded-[2rem] bg-white p-8 shadow-sm border border-slate-200/60 mt-8">
        <div className="mb-8">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Company Profile</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Official details used in documents</p>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Company Name</Label>
              <Input 
                defaultValue={settings?.company_name ?? ""} 
                placeholder="UrbanLuxe Real Estate" 
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">TRN (Tax Registration Number)</Label>
              <Input 
                defaultValue={settings?.trn ?? ""} 
                placeholder="100123456700003" 
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">RERA ORN</Label>
              <Input 
                defaultValue={settings?.rera_orn ?? ""} 
                placeholder="12345" 
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">VAT Rate (%)</Label>
              <Input 
                type="number" 
                defaultValue={settings?.vat_rate ?? 5} 
                step="0.1" 
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Phone</Label>
              <Input 
                defaultValue={settings?.phone ?? ""} 
                placeholder="+971 4 123 4567" 
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</Label>
              <Input 
                defaultValue={settings?.email ?? ""} 
                placeholder="info@urbanluxe.ae" 
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quotation Prefix</Label>
              <Input 
                defaultValue={settings?.quotation_prefix ?? "QT-"} 
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20 font-mono text-emerald-700"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Invoice Prefix</Label>
              <Input 
                defaultValue={settings?.invoice_prefix ?? "INV-"} 
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20 font-mono text-emerald-700"
              />
            </div>
          </div>
          
          <div className="space-y-2.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Address</Label>
            <Input 
              defaultValue={settings?.address ?? ""} 
              placeholder="Office 123, Business Bay, Dubai, UAE" 
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500/20"
            />
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <Button size="lg" className="rounded-full px-8 bg-emerald-500 hover:bg-emerald-600 font-bold shadow-sm">
              Save Profile Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
