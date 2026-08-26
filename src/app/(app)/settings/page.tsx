import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import Link from "next/link";
import { ArrowRight, Mail, Route, Users } from "lucide-react";
import { CompanyProfileForm } from "@/components/settings/company-profile-form";
import { getPublicBrand } from "@/server/company-settings";
import { PageHeader } from "@/components/primitives/page-header";

const SHORTCUTS = [
  {
    href: "/settings/leads",
    label: "Leads",
    hint: "CRM activation flow, fields, and stages",
    icon: Route,
  },
  {
    href: "/settings/users",
    label: "Users & roles",
    hint: "Team access and permissions",
    icon: Users,
  },
  {
    href: "/settings/email-templates",
    label: "Email templates",
    hint: "Transactional subjects and bodies",
    icon: Mail,
  },
] as const;

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, "settings") && !can(user.role, "user_management"))
    redirect("/dashboard");

  const brand = await getPublicBrand();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Settings"
        description="Company branding, contact details, team access, and CRM rules. Logos and contact details sync to the public site and this portal."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group overflow-hidden rounded-xl bg-card p-5 ring-1 ring-border transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
            </Link>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Company profile</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Primary logo is for light backgrounds. White logo is used on the admin sidebar, login, and footer.
          </p>
        </div>
        <div className="p-5">
          <CompanyProfileForm initial={brand} />
        </div>
      </section>
    </div>
  );
}
