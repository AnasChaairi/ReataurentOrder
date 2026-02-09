import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar skeleton */}
      <div className="w-64 bg-[#3B2316] p-4 space-y-4">
        <Skeleton variant="rectangular" className="w-full h-12 bg-white/10 rounded-lg" />
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} variant="rectangular" className="w-full h-10 bg-white/10 rounded-lg" />
        ))}
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 p-8 space-y-6">
        <Skeleton variant="text" className="w-64 h-8" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton variant="rectangular" className="w-full h-64 rounded-xl" />
      </div>
    </div>
  );
}
