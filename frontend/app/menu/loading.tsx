import { MenuItemSkeleton } from "@/components/ui/Skeleton";

export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero placeholder */}
      <div className="bg-[#3B2316] py-32 pt-40">
        <div className="container mx-auto px-4 text-center">
          <div className="h-12 bg-white/10 rounded-lg w-80 mx-auto mb-6 animate-pulse" />
          <div className="h-6 bg-white/10 rounded-lg w-96 mx-auto animate-pulse" />
        </div>
      </div>

      {/* Menu grid skeleton */}
      <div className="py-16 bg-[#F5F0EB]">
        <div className="container mx-auto px-4">
          {/* Category tabs skeleton */}
          <div className="flex gap-3 mb-8 overflow-x-auto">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
