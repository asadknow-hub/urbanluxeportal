"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md rounded-2xl bg-white p-5 shadow-sm border border-slate-200 text-center">
        <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate-500">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-slate-400">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
