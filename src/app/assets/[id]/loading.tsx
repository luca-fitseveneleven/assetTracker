import { Skeleton } from "@/components/ui/skeleton";

export default function AssetDetailLoading() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="flex flex-col w-full h-full overflow-hidden">
        {/* Header: title + status + actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Separator */}
        <Skeleton className="h-px w-full my-4" />

        {/* Three-column detail cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Summary */}
          <section className="col-span-1 rounded-lg border border-default-200 p-4">
            <Skeleton className="h-4 w-20 mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </section>

          {/* Specifications */}
          <section className="col-span-1 rounded-lg border border-default-200 p-4">
            <Skeleton className="h-4 w-28 mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </section>

          {/* Procurement */}
          <section className="col-span-1 rounded-lg border border-default-200 p-4">
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Second row: assigned user + identifiers */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="col-span-1 rounded-lg border border-default-200 p-4">
            <Skeleton className="h-4 w-28 mb-3" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          </section>

          <section className="col-span-2 rounded-lg border border-dashed border-default-200 p-4">
            <Skeleton className="h-4 w-20 mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </section>
        </div>

        {/* Third row: warranty + depreciation + maintenance */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <section
              key={i}
              className="col-span-1 rounded-lg border border-default-200 p-4"
            >
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Lifecycle section */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="col-span-1 md:col-span-3 rounded-lg border border-default-200 p-4">
            <Skeleton className="h-4 w-28 mb-4" />
            <Skeleton className="h-24 w-full" />
          </section>
        </div>

        {/* History */}
        <div className="mt-10">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-px w-full my-3" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
