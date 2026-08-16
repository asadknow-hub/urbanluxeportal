export default function Loading() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse space-y-7">
      <div className="space-y-2">
        <div className="h-10 w-36 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted/70" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[126px] rounded-[18px] border border-[#e9e5dc] bg-muted/50" />
        ))}
      </div>
      <div className="h-[66px] rounded-[17px] border border-[#e9e5dc] bg-muted/50" />
      <div className="h-96 rounded-[18px] border border-[#e9e5dc] bg-muted/40" />
    </div>
  );
}
