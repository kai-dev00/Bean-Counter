// Shown by Next.js while any dashboard page's server data is loading
function Block({ className }: { className: string }) {
  return <div className={`rounded-md bg-muted animate-pulse ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <Block className="h-3 w-24" />
            <Block className="h-7 w-32" />
            <Block className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Block className="h-8 w-64" />
            <Block className="h-8 w-24" />
          </div>
          <Block className="h-8 w-28" />
        </div>
        <Block className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Block key={i} className="h-8 w-full opacity-70" />
        ))}
      </div>
    </div>
  );
}
