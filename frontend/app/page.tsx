import Image from "next/image";
import Link from "next/link";
import { Coffee, ShieldCheck, Tablet, ChevronRight, MapPin, Clock } from "lucide-react";

const locations = [
  { name: "Morocco Mall, Casablanca", hours: "08:00 – 23:00" },
  { name: "Mohammedia Park", hours: "07:00 – 18:00" },
  { name: "Boulevard El Qods, Casablanca", hours: "07:00 – 19:00" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* ─── HERO / BRAND ───────────────────────────────────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center min-h-screen overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/baristas-background.png"
            alt="Baristas café"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-baristas-brown-dark/90 via-baristas-brown-dark/75 to-baristas-brown-dark/95" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">

          {/* Logo */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-baristas-cream/30 mb-8 shadow-2xl">
            <Image src="/baristas-logo.png" alt="Baristas Logo" fill className="object-cover" />
          </div>

          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-baristas-cream/10 border border-baristas-cream/25 text-baristas-cream px-4 py-2 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            <Coffee className="w-4 h-4" />
            Your daily dose of comfort
          </div>

          {/* Brand name */}
          <h1 className="text-white text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight leading-none mb-4">
            BARISTAS
          </h1>
          <p className="text-baristas-cream/70 text-lg md:text-xl mb-4 tracking-widest uppercase font-light">
            Brewed · Baked · Beautiful
          </p>
          <p className="text-white/50 text-base max-w-md mb-16 leading-relaxed">
            Rich espresso, indulgent pastries, and warm hospitality —
            crafted with passion, served with elegance.
          </p>

          {/* ── Login chooser ── */}
          <div className="w-full max-w-2xl">
            <p className="text-white/40 text-xs tracking-[0.25em] uppercase font-medium mb-6">
              Access the platform
            </p>

            <div className="grid sm:grid-cols-2 gap-4">

              {/* Admin login */}
              <Link href="/auth/login" className="group">
                <div className="relative flex flex-col items-start gap-4 p-6 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-md hover:bg-white/15 hover:border-baristas-cream/40 transition-all duration-200 cursor-pointer shadow-xl hover:shadow-baristas-cream/10 hover:-translate-y-0.5 text-left">
                  <div className="w-12 h-12 rounded-xl bg-baristas-cream/15 flex items-center justify-center group-hover:bg-baristas-cream/25 transition-colors">
                    <ShieldCheck className="w-6 h-6 text-baristas-cream" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-lg mb-1">Admin Login</h2>
                    <p className="text-white/50 text-sm leading-relaxed">
                      Manage menus, orders, staff, and restaurant settings
                    </p>
                  </div>
                  <div className="self-end flex items-center gap-1 text-baristas-cream/60 text-xs font-medium group-hover:text-baristas-cream transition-colors">
                    Sign in with email
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Device login */}
              <Link href="/device-login" className="group">
                <div className="relative flex flex-col items-start gap-4 p-6 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-md hover:bg-white/15 hover:border-baristas-cream/40 transition-all duration-200 cursor-pointer shadow-xl hover:shadow-baristas-cream/10 hover:-translate-y-0.5 text-left">
                  <div className="w-12 h-12 rounded-xl bg-baristas-cream/15 flex items-center justify-center group-hover:bg-baristas-cream/25 transition-colors">
                    <Tablet className="w-6 h-6 text-baristas-cream" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-lg mb-1">Device Login</h2>
                    <p className="text-white/50 text-sm leading-relaxed">
                      Activate a tablet or kiosk with your device ID and PIN
                    </p>
                  </div>
                  <div className="self-end flex items-center gap-1 text-baristas-cream/60 text-xs font-medium group-hover:text-baristas-cream transition-colors">
                    Enter device credentials
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>

            </div>
          </div>

          {/* Locations strip */}
          <div className="mt-20 w-full max-w-2xl">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {locations.map((loc) => (
                <div key={loc.name} className="flex items-center gap-2 text-white/35 text-xs">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{loc.name}</span>
                  <span className="text-white/20">·</span>
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{loc.hours}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-baristas-brown-dark to-transparent pointer-events-none z-10" />
      </section>

    </div>
  );
}
