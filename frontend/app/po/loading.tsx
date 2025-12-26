export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
        <div className="h-4 w-96 bg-slate-100 animate-pulse rounded" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-lg" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse rounded-lg border border-slate-200"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {/* Table header skeleton */}
        <div className="h-10 bg-slate-100 animate-pulse rounded mb-4" />

        {/* Table rows skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className="h-12 bg-slate-50 animate-pulse rounded"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="h-8 w-48 bg-slate-100 animate-pulse rounded" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-8 w-8 bg-slate-100 animate-pulse rounded"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
