import { OrderCardSkeleton } from "@/components/ui/Skeleton";

export default function KitchenLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#3B2316] px-6 py-4">
        <div className="h-8 bg-white/10 rounded w-48 animate-pulse" />
      </div>
      <div className="p-4 grid grid-cols-4 gap-4 h-[calc(100vh-72px)]">
        {['Pending', 'Confirmed', 'Preparing', 'Ready'].map(label => (
          <div key={label} className="flex flex-col">
            <div className="bg-gray-300 h-10 rounded-t-lg animate-pulse" />
            <div className="flex-1 bg-gray-50 rounded-b-lg p-3 space-y-3">
              {[1, 2].map(i => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
