import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import Link from "next/link";
import { Users, Mail, ChevronRight, Route } from "lucide-react";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { getPublicBrand } from "@/server/company-settings";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "settings") && !can(user.role, "user_management"))
    redirect("/dashboard");

  const brand = await getPublicBrand();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              System Configuration
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Settings & Preferences
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-xl">
              Manage company branding, contact details, team access, and CRM rules. Logo, phone, and
              address update the public site and admin portal together.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/settings/leads"
          className="group flex flex-col rounded-[1.5rem] border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/50 p-3 transition-transform group-hover:scale-110">
              <Route className="h-6 w-6 text-emerald-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-emerald-500" />
          </div>
          <div className="mt-auto">
            <p className="text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-600">
              Leads
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              CRM activation flow
            </p>
          </div>
        </Link>

        <Link
          href="/settings/users"
          className="group flex flex-col rounded-[1.5rem] border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-3 transition-transform group-hover:scale-110">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500" />
          </div>
          <div className="mt-auto">
            <p className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
              Users & Roles
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Manage team access
            </p>
          </div>
        </Link>

        <Link
          href="/settings/email-templates"
          className="group flex flex-col rounded-[1.5rem] border border-slate-200/60 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-[1.5rem] border border-purple-100 bg-purple-50/50 p-3 transition-transform group-hover:scale-110">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-purple-500" />
          </div>
          <div className="mt-auto">
            <p className="text-lg font-bold text-slate-900 transition-colors group-hover:text-purple-600">
              Email Templates
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Transactional emails
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-slate-200/60 bg-white p-5 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Company Profile</h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Logos, phone, address — synced to public site &amp; admin
          </p>
        </div>
        <CompanyProfileForm initial={brand} />
      </div>
    </div>
  );
}
