import Skeleton from "./Skeleton";

export default function ExploreSkeleton() {
  return (
    <div className="mt-5 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col justify-between rounded-[30px] border border-[var(--forsa-border)] bg-white p-5 shadow-sm min-h-[460px] transition-all"
        >
          {/* Top Section: Profile Header info */}
          <div>
            <div className="flex items-start gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />

              <div className="flex-1">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="mt-2.5 h-5 w-5/6 rounded-md" />
                <Skeleton className="mt-2 h-4 w-3/5 rounded-md" />
              </div>

              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            </div>

            {/* Sub-Header Grid Metrics */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Skeleton className="h-11 rounded-2xl" />
              <Skeleton className="h-11 rounded-2xl" />
              <Skeleton className="h-11 rounded-2xl" />
            </div>

            {/* Description Paragraph Blocks */}
            <div className="mt-5 space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-[92%] rounded-md" />
              <Skeleton className="h-4 w-[75%] rounded-md" />
            </div>
          </div>

          {/* Bottom Section: Interactive Grid & Call to Actions */}
          <div className="mt-6 space-y-4">
            {/* Middle Feature Banner Placeholder */}
            <Skeleton className="h-14 rounded-[22px]" />

            {/* Lower Grid Details */}
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-9 rounded-xl" />
              <Skeleton className="h-9 rounded-xl" />
            </div>

            {/* Main Primary Action Footer Buttons */}
            <div className="grid grid-cols-[1fr_42px_1fr] gap-2 pt-2 border-t border-neutral-50">
              <Skeleton className="h-11 rounded-full" />
              <Skeleton className="h-11 rounded-full" />
              <Skeleton className="h-11 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}