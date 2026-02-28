import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ui/ProductCard";
import { LocationCard } from "@/components/ui/LocationCard";
import { MapPin, Clock, ChevronRight, Star, Coffee, UtensilsCrossed, Sparkles } from "lucide-react";

export default function Home() {
  const todaysFavorites = [
    {
      name: "GAUFRE TROIX CHOCOLAT",
      description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
      price: "8$ dh",
      image: "/baristas-food.png",
    },
    {
      name: "CRÊPE KUNAFA PISTACHE",
      description: "Creamy chocolate ou lait et chocolat blanc, Biscuit Oreo",
      price: "7$ dh",
      image: "/baristas-food.png",
    },
    {
      name: "BROWNIE BARISTAS",
      description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
      price: "6$ dh",
      image: "/baristas-food.png",
    },
  ];

  const locations = [
    {
      name: "MOROCCO MALL, CASABLANCA",
      hours: "08:00 - 23:00",
      mapsUrl: "https://maps.google.com",
    },
    {
      name: "MOHAMMEDIA PARK",
      hours: "07:00 - 18:00",
      mapsUrl: "https://maps.google.com",
    },
    {
      name: "BOULEVARD EL GODS, CASABLANCA",
      hours: "07:00 - 19:00",
      mapsUrl: "https://maps.google.com",
    },
  ];

  const menuLinks = [
    { label: "Baristas Mall Menu", href: "/menu" },
    { label: "Baristas Mohammedia Menu", href: "/menu" },
    { label: "Baristas Qods Menu", href: "/menu" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/baristas-background.png"
            alt="Baristas café ambiance"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlay: darker at top for nav readability, warm brown at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-baristas-brown-dark/80 via-baristas-brown-dark/50 to-baristas-brown-dark/75" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 pt-28 pb-20">
          <div className="max-w-3xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 bg-baristas-cream/15 border border-baristas-cream/30 text-baristas-cream px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
              <Coffee className="w-4 h-4" />
              Your daily dose of comfort
            </div>

            <h1 className="text-white text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] mb-6 tracking-tight">
              BREWED,<br />
              BAKED &amp;<br />
              <span className="text-baristas-cream">BEAUTIFUL.</span>
            </h1>

            <p className="text-white/70 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
              Discover a world of rich espresso, indulgent pastries, and warm
              hospitality — crafted with passion, served with elegance.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/menu">
                <button className="bg-baristas-cream text-baristas-brown-dark px-8 py-4 rounded-full font-bold text-base hover:bg-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                  Order Now
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/menu">
                <button className="bg-transparent border-2 border-baristas-cream/50 text-baristas-cream px-8 py-4 rounded-full font-semibold text-base hover:bg-baristas-cream/10 hover:border-baristas-cream transition-all">
                  View Menu
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50 text-xs tracking-widest">
          <span>SCROLL</span>
          <div className="w-px h-10 bg-white/30 animate-pulse" />
        </div>
      </section>

      {/* ─── STATS STRIP ────────────────────────────────────────── */}
      <section className="bg-baristas-brown-dark py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "3+", label: "Locations" },
              { value: "50+", label: "Menu Items" },
              { value: "10K+", label: "Happy Customers" },
              { value: "5★", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-white">
                <p className="text-3xl font-extrabold text-baristas-cream mb-1">{stat.value}</p>
                <p className="text-sm text-white/60 tracking-wide uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TODAY'S FAVORITES ──────────────────────────────────── */}
      <section className="py-24 bg-baristas-cream">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-baristas-brown text-sm font-semibold tracking-widest uppercase mb-4">
              <Star className="w-4 h-4 fill-baristas-brown" />
              Fan Favourites
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-baristas-brown-dark tracking-tight">
              TODAY&apos;S FAVORITES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {todaysFavorites.map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/menu">
              <button className="inline-flex items-center gap-2 border-2 border-baristas-brown-dark text-baristas-brown-dark px-8 py-3 rounded-full font-semibold hover:bg-baristas-brown-dark hover:text-white transition-all">
                See Full Menu
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── EXPLORE FULL MENU ──────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto bg-baristas-brown-dark rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left */}
              <div className="p-12 md:p-16 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 text-baristas-cream/70 text-sm font-semibold tracking-widest uppercase mb-6">
                  <UtensilsCrossed className="w-4 h-4" />
                  Our Menus
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                  EXPLORE<br />FULL MENU
                </h2>
                <p className="text-white/60 mb-10 text-base leading-relaxed">
                  Discover the full menu for each of our outlets — fresh, seasonal, crafted daily.
                </p>

                <div className="space-y-3">
                  {menuLinks.map((link) => (
                    <Link key={link.label} href={link.href}>
                      <button className="w-full bg-baristas-cream/10 border border-baristas-cream/20 text-baristas-cream px-6 py-4 rounded-2xl font-semibold hover:bg-baristas-cream hover:text-baristas-brown-dark transition-all text-left flex items-center justify-between group">
                        <span>{link.label}</span>
                        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right: Food image */}
              <div className="relative h-80 md:h-auto min-h-[400px]">
                <Image
                  src="/baristas-food.png"
                  alt="Baristas delicious food"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-baristas-brown-dark/40 to-transparent md:bg-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHERE TO ENJOY ─────────────────────────────────────── */}
      <section className="py-24 bg-baristas-cream">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-baristas-brown text-sm font-semibold tracking-widest uppercase mb-4">
              <MapPin className="w-4 h-4" />
              Find Us
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-baristas-brown-dark tracking-tight">
              WHERE TO ENJOY BARISTAS
            </h2>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div className="relative h-96 md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/baristas-background.png"
                alt="Baristas location"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-baristas-brown-dark/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-sm font-semibold tracking-widest uppercase text-baristas-cream/80 mb-1">Open Daily</p>
                <p className="text-2xl font-bold">3 Locations</p>
              </div>
            </div>

            {/* Right: Cards */}
            <div className="space-y-5">
              {locations.map((location, index) => (
                <LocationCard key={index} {...location} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── EVENTS ─────────────────────────────────────────────── */}
      <section className="py-24 bg-baristas-brown-dark">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-baristas-cream/70 text-sm font-semibold tracking-widest uppercase mb-4">
              <Sparkles className="w-4 h-4" />
              Special Occasions
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
              BARISTAS EVENTS
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto text-base leading-relaxed">
              At Baristas, every moment deserves to be celebrated. Whether it&apos;s a brand launch,
              a birthday, a corporate cocktail, or a private gathering — we offer elegant spaces,
              a refined atmosphere, and bespoke service to make it truly memorable.
            </p>
          </div>

          {/* Event image mosaic */}
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`relative rounded-3xl overflow-hidden shadow-xl hover:scale-105 transition-transform duration-300 ${
                  i === 1 ? "row-span-2 h-96" : "h-44"
                }`}
              >
                <Image
                  src="/baristas-food.png"
                  alt={`Baristas event ${i + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-baristas-brown-dark/20 hover:bg-transparent transition-colors" />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/contact">
              <button className="inline-flex items-center gap-2 bg-baristas-cream text-baristas-brown-dark px-8 py-4 rounded-full font-bold hover:bg-white transition-all shadow-lg">
                Book an Event
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
