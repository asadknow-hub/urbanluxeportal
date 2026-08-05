"use client";

import Link from "next/link";
import { formatAED } from "@/lib/money";
import { Building2, Phone, Mail, ChevronRight } from "lucide-react";

export type OwnerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  emirates_id: string | null;
  passport_no: string | null;
  property_count: number;
};

export function OwnersList({ owners }: { owners: OwnerRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Emirates ID</th>
              <th className="px-4 py-3">Passport</th>
              <th className="px-4 py-3 text-center">Properties</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {owners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No owners found. Add one to get started.
                </td>
              </tr>
            ) : (
              owners.map((owner) => (
                <tr key={owner.id} className="group hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{owner.name}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {owner.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {owner.phone}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {owner.email ? (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {owner.email}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{owner.emirates_id ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{owner.passport_no ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      <Building2 className="h-3 w-3" />
                      {owner.property_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/properties?owner=${owner.id}`}
                      className="inline-flex items-center text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
