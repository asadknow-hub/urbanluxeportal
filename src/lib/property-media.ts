export function propertyMediaPublicUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return storagePath;
  return `${base}/storage/v1/object/public/property-media/${storagePath.replace(/^\//, "")}`;
}
