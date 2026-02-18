import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main>
      {/* Page title */}
      <Skeleton className="h-8 w-48" />

      {/* Stat cards */}
      <div className="mt-4 sm:mt-6 md:mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-default-200 p-6 space-y-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="mt-4 sm:mt-6 md:mt-8">
        <div className="rounded-lg border border-default-200 p-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </main>
  );
}
