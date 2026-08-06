export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 rounded-lg bg-slate-200" />
      <div className="h-32 rounded-2xl bg-slate-100" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-slate-100" />
    </div>
  );
}
