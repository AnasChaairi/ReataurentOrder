import Link from "next/link";

interface LocationCardProps {
  name: string;
  hours: string;
  mapsUrl: string;
}

export function LocationCard({ name, hours, mapsUrl }: LocationCardProps) {
  return (
    <div className="bg-[#E5D4C1] border-2 border-[#4A3428] rounded-3xl p-6">
      <h3 className="text-lg font-bold text-gray-900 uppercase mb-2">
        {name}
      </h3>
      <div className="flex items-center text-gray-700 mb-4">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm">{hours}</span>
      </div>
      <Link
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-[#4A3428] text-white px-6 py-2 rounded-full font-medium hover:bg-[#3d2b20] transition-colors text-sm"
      >
        📍 VIEW ON GOOGLE MAPS
      </Link>
    </div>
  );
}
