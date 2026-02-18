import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsLoading() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="flex flex-col gap-6">
        {/* Page title + subtitle */}
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>

        {/* Separator */}
        <Skeleton className="h-px w-full" />

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-9 rounded-md"
              style={{ width: `${60 + (i % 3) * 20}px` }}
            />
          ))}
        </div>

        {/* Settings form content */}
        <div className="rounded-lg border border-default-200 p-6 space-y-6">
          <Skeleton className="h-5 w-36" />

          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton
                className="h-4"
                style={{ width: `${80 + (i % 3) * 24}px` }}
              />
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}

          {/* Save button */}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>
    </>
  );
}
