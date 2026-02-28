import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-baristas-brown-dark text-white">
      {/* Main footer content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-baristas-cream/20">
                <Image
                  src="/baristas-logo.png"
                  alt="Baristas Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-white text-lg font-bold tracking-widest uppercase">BARISTAS</span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">
              A place where taste, elegance, and the coffee experience come together.
              Prepared with passion, served with expertise.
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-6">
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
                aria-label="Baristas on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
                aria-label="Baristas on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </Link>
              {/* TikTok */}
              <Link
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
                aria-label="Baristas on TikTok"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-baristas-cream font-bold tracking-widest uppercase text-xs mb-6">Navigate</h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/menu", label: "Menu" },
                { href: "/events", label: "Events" },
                { href: "/contact", label: "Contact" },
                { href: "/auth/login", label: "My Account" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/55 hover:text-baristas-cream transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-baristas-cream font-bold tracking-widest uppercase text-xs mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-white/55">
                <Phone className="w-4 h-4 text-baristas-cream/60 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Mohammedia: 05 20 03 78 20</p>
                  <p>Morocco Mall: 05 23 30 73 14</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/55">
                <Mail className="w-4 h-4 text-baristas-cream/60 flex-shrink-0" />
                <a href="mailto:contact@baristas.ma" className="hover:text-baristas-cream transition-colors">
                  contact@baristas.ma
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/55">
                <MapPin className="w-4 h-4 text-baristas-cream/60 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Morocco Mall, Casablanca</p>
                  <p>Mohammedia Park</p>
                  <p>Boulevard El Qods, Casablanca</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="container mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/35 text-xs">
            © 2025 BARISTAS Coffee & Restaurant. All rights reserved.
          </p>
          <p className="text-white/25 text-xs">
            Made with ☕ in Morocco
          </p>
        </div>
      </div>
    </footer>
  );
}
