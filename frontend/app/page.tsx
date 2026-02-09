import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ui/ProductCard";
import { LocationCard } from "@/components/ui/LocationCard";

export default function Home() {
  // Sample products data
  const todaysFavorites = [
    {
      name: "GAUFRE TROIX CHOCOLAT",
      description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
      price: "8$ dh",
      image: "/hero-image.webp", // Using placeholder - replace with actual product image
    },
    {
      name: "CRÊPE KUNAFA PISTACHE",
      description: "Creamy chocolate ou lait et chocolat blanc, Biscuit Oreo",
      price: "7$ dh",
      image: "/hero-image.webp", // Using placeholder
    },
    {
      name: "BROWNIE BARISTAS",
      description: "Caramel, chocolate ou lait et chocolat blanc, Biscuit Oreo",
      price: "6$ dh",
      image: "/hero-image.webp", // Using placeholder
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative h-screen section-dark">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-image.webp"
            alt="Restaurant ambiance"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <div className="max-w-4xl">
            <p className="text-white/90 text-lg md:text-xl mb-6 tracking-wide">
              Your daily dose of comfort.
            </p>
            <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight">
              BREWED, BAKED,
            </h1>
            <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-extrabold mb-12 leading-tight">
              AND BEAUTIFULLY SERVED.
            </h1>

            {/* Hero Product Image */}
            <div className="relative w-full max-w-2xl mx-auto mb-12 h-64 md:h-80">
              <Image
                src="/hero-image.webp"
                alt="Featured products"
                fill
                className="object-contain rounded-3xl"
              />
            </div>

            <Link href="/menu">
              <button className="btn-secondary text-lg px-8 py-4">
                🛒 Order Now
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Today's Favorites Section */}
      <section className="py-20 section-light">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-baristas-brown-dark mb-16 tracking-tight">
            TODAY&apos;S FAVORITES
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {todaysFavorites.map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Explore Full Menu Section */}
      <section className="py-20 section-light">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-baristas-brown-dark rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: Menu Options */}
              <div className="p-12 md:p-16 flex flex-col justify-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                  EXPLORE FULL MENU
                </h2>
                <p className="text-gray-300 mb-10 text-lg">
                  Discover the full menu for each of our outlets.
                </p>

                <div className="space-y-4">
                  <Link href="/menu">
                    <button className="w-full bg-baristas-cream text-baristas-brown-dark px-6 py-4 rounded-full font-semibold hover:bg-white transition-colors text-left">
                      Baristas Mall Menu
                    </button>
                  </Link>
                  <Link href="/menu">
                    <button className="w-full bg-baristas-cream text-baristas-brown-dark px-6 py-4 rounded-full font-semibold hover:bg-white transition-colors text-left">
                      Baristas Mohamedia Menu
                    </button>
                  </Link>
                  <Link href="/menu">
                    <button className="w-full bg-baristas-cream text-baristas-brown-dark px-6 py-4 rounded-full font-semibold hover:bg-white transition-colors text-left">
                      Baristas Qods Menu
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right: Food Images */}
              <div className="relative h-80 md:h-auto min-h-[400px]">
                <Image
                  src="/hero-image.webp"
                  alt="Delicious food"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Where to Enjoy Baristas Section */}
      <section className="py-20 section-light">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-baristas-brown-dark mb-16 tracking-tight">
            WHERE TO ENJOY BARISTAS
          </h2>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Location Image */}
            <div className="relative h-96 md:h-[500px] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/hero-image.webp"
                alt="Baristas location"
                fill
                className="object-cover"
              />
            </div>

            {/* Right: Location Cards */}
            <div className="space-y-6">
              {locations.map((location, index) => (
                <LocationCard key={index} {...location} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Baristas Events Section */}
      <section className="py-20 section-dark">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-8 tracking-tight">
            BARISTAS EVENTS
          </h2>
          <p className="text-center text-gray-300 max-w-3xl mx-auto mb-16 text-lg leading-relaxed">
            At Baristas, we believe every moment deserves to be celebrated. Whether it&apos;s for a
            brand launch, a birthday, a corporate cocktail party, or a private event, we offer
            elegant spaces, a refined atmosphere, and bespoke service to make your special
            occasions truly memorable.
          </p>

          {/* Event Images */}
          <div className="flex justify-center gap-6 mb-12 flex-wrap">
            <div className="relative w-48 h-72 rounded-3xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform">
              <Image
                src="/hero-image.webp"
                alt="Event 1"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative w-48 h-72 rounded-3xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform">
              <Image
                src="/hero-image.webp"
                alt="Event 2"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative w-48 h-72 rounded-3xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform">
              <Image
                src="/hero-image.webp"
                alt="Event 3"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
