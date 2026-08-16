export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse space-y-5">
      <div className="space-y-2">
        <div className="h-7 w-28 rounded-md bg-muted" />
        <div className="h-4 w-64 rounded-md bg-muted/70" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[88px] rounded-xl bg-muted/80 ring-1 ring-border" />
        ))}
      </div>
      <div className="h-10 rounded-xl bg-muted/80 ring-1 ring-border" />
      <div className="h-80 rounded-xl bg-muted/60 ring-1 ring-border" />
    </div>
  );
}
