export type StatusColor = {
  bg: string;
  text: string;
  border: string;
};

export const STATUS_COLORS: Record<string, StatusColor> = {
  // Lead statuses
  new: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  contacted: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  qualified: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  lead: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  prospect: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  inactive: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  unqualified: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  converted: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },

  // Deal stages (`new` shares the lead-status color above)
  negotiations: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  inquiry: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  viewing: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  negotiation: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  offer: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  contract: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  closed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  won: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  lost: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },

  // Property statuses
  available: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  reserved: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  sold: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  rented: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  off_market: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },

  // Quotation statuses
  draft: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  pending_approval: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  sent: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  accepted: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  expired: { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },

  // Invoice statuses
  partially_paid: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  overdue: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  void: { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },

  // Cheque statuses
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  deposited: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  cleared: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  bounced: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  replaced: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  cancelled: { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },

  // Approval statuses
  approved_approval: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  rejected_approval: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export function getStatusColor(status: string): StatusColor {
  return STATUS_COLORS[status] ?? { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
}
