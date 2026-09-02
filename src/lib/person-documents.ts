import type { SupabaseClient } from "@supabase/supabase-js";

export type PersonDocumentRow = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  category: string;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
};

const DOC_SELECT =
  "id, name, storage_path, mime_type, category, expiry_date, notes, created_at";

/**
 * Merge document lists deduped by storage_path (one physical file).
 * Later batches win — pass lead, then deal, then customer so customer rows are preferred.
 */
export function mergePersonDocumentsByStoragePath<
  T extends { storage_path: string; created_at: string },
>(...sources: T[][]): T[] {
  const byPath = new Map<string, T>();
  for (const batch of sources) {
    for (const doc of batch) {
      const path = doc.storage_path?.trim();
      if (!path) continue;
      byPath.set(path, doc);
    }
  }
  return Array.from(byPath.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function fetchEntityDocuments(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string
): Promise<PersonDocumentRow[]> {
  const { data } = await supabase
    .from("documents")
    .select(DOC_SELECT)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return (data ?? []) as PersonDocumentRow[];
}

/** Merged deal view: lead + deal + customer references, deduped by storage_path. */
export async function fetchMergedDealDocuments(
  supabase: SupabaseClient,
  deal: { id: string; lead_id: string | null; customer_id: string | null }
): Promise<PersonDocumentRow[]> {
  const [leadDocs, dealDocs, customerDocs] = await Promise.all([
    deal.lead_id ? fetchEntityDocuments(supabase, "lead", deal.lead_id) : Promise.resolve([]),
    fetchEntityDocuments(supabase, "deal", deal.id),
    deal.customer_id
      ? fetchEntityDocuments(supabase, "customer", deal.customer_id)
      : Promise.resolve([]),
  ]);
  return mergePersonDocumentsByStoragePath(leadDocs, dealDocs, customerDocs);
}

/** Merged customer view: lead + deals + customer, deduped by storage_path. */
export async function fetchMergedCustomerDocuments(
  supabase: SupabaseClient,
  input: { customerId: string; leadId: string | null; dealIds: string[] }
): Promise<PersonDocumentRow[]> {
  const { customerId, leadId, dealIds } = input;
  const [leadDocs, dealDocs, customerDocs] = await Promise.all([
    leadId ? fetchEntityDocuments(supabase, "lead", leadId) : Promise.resolve([]),
    dealIds.length > 0
      ? supabase
          .from("documents")
          .select(DOC_SELECT)
          .eq("entity_type", "deal")
          .in("entity_id", dealIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .then(({ data }) => (data ?? []) as PersonDocumentRow[])
      : Promise.resolve([]),
    fetchEntityDocuments(supabase, "customer", customerId),
  ]);
  return mergePersonDocumentsByStoragePath(leadDocs, dealDocs, customerDocs);
}
