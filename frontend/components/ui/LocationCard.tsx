import Link from "next/link";
import { MapPin, Clock, ExternalLink } from "lucide-react";

interface LocationCardProps {
  name: string;
  hours: string;
  mapsUrl: string;
}

export function LocationCard({ name, hours, mapsUrl }: LocationCardProps) {
  return (
    <div className="group bg-white border border-baristas-beige rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-baristas-brown flex-shrink-0" />
            <h3 className="text-sm font-bold text-baristas-brown-dark uppercase tracking-wide">
              {name}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-gray-500 ml-6">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm">{hours}</span>
          </div>
        </div>

        <Link
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-baristas-brown-dark text-white px-4 py-2 rounded-full font-medium hover:bg-baristas-brown transition-colors text-xs whitespace-nowrap flex-shrink-0"
          aria-label={`View ${name} on Google Maps`}
        >
          <ExternalLink className="w-3 h-3" />
          Maps
        </Link>
      </div>
    </div>
  );
}
