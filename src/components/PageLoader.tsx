import { Skeleton } from "@/components/ui/skeleton";

/** Full-page loading skeleton used while API calls are in-flight */
const PageLoader = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-6 animate-in fade-in">
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-52 rounded-xl" />
    ))}
  </div>
);

export default PageLoader;
