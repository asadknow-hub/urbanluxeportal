import { Skeleton } from "@/components/ui/skeleton";

export default function ViewingsLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-20 w-full rounded-[14px]" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-[14px]" />
        ))}
      </div>
    </div>
  );
}
