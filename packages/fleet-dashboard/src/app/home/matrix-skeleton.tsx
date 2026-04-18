export function MatrixSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
        ))}
      </div>
      <div className="h-10 w-64 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900" />
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-3 ${i > 0 ? "border-t border-zinc-800/60" : ""}`}
          >
            <div className="h-3.5 w-3.5 rounded bg-zinc-800" />
            <div className="h-2 w-2 rounded-full bg-zinc-800" />
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
            <div className="ml-8 h-4 w-16 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-800" />
            <div className="ml-auto h-4 w-12 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
