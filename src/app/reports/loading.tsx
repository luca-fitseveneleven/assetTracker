import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="space-y-6">
        {/* Header: title + export buttons */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>

        {/* Separator */}
        <Skeleton className="h-px w-full" />

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-default-200 p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-7 w-16" />
              {i >= 3 && <Skeleton className="h-3 w-20" />}
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-9 rounded-md"
              style={{ width: `${70 + (i % 3) * 16}px` }}
            />
          ))}
        </div>

        {/* Chart area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="rounded-lg border border-default-200 p-6">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="rounded-lg border border-default-200 p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    </>
  );
}
