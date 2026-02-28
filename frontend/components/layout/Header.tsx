"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingCart, User, Menu, X, LogOut, MapPin } from "lucide-react";
import { useTable } from "@/contexts/TableContext";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { cart, toggleCart } = useCart();
  const { user, logout } = useAuth();
  const { selectedTable } = useTable();

  // Only show cart count after client hydration to avoid SSR mismatch
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-baristas-brown-dark/95 backdrop-blur-md shadow-xl"
            : "bg-transparent"
        }`}
      >
        <nav className="container mx-auto px-6 py-4" aria-label="Main navigation">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-baristas-cream/30 group-hover:ring-baristas-cream/60 transition-all">
                <Image
                  src="/baristas-logo.png"
                  alt="Baristas Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-white text-xl font-bold tracking-widest uppercase hidden sm:block">
                BARISTAS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center bg-white/10 backdrop-blur-sm rounded-full px-2 py-2 space-x-1 border border-white/10">
              {[
                { href: "/", label: "Home" },
                { href: "/menu", label: "Menu" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-5 py-2 rounded-full text-white/85 hover:text-white hover:bg-white/15 font-medium transition-all text-sm tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center space-x-2">
              {user ? (
                <>
                  {user.role === 'CUSTOMER' && (
                    <Link href="/settings">
                      <span className={`flex items-center space-x-1.5 px-3 py-2 rounded-full text-sm transition-colors ${
                        selectedTable
                          ? 'text-baristas-cream/90 hover:text-white hover:bg-white/10'
                          : 'text-yellow-300/90 hover:text-yellow-200 hover:bg-white/10'
                      }`}>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{selectedTable ? `Table ${selectedTable.number}` : 'Set table'}</span>
                      </span>
                    </Link>
                  )}
                  <span className="flex items-center space-x-2 text-white/85 px-4 py-2 rounded-full text-sm font-medium">
                    <User className="w-4 h-4" />
                    <span>{user.first_name}</span>
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1.5 text-white/60 hover:text-white/90 transition-colors px-3 py-2 rounded-full hover:bg-white/10 text-sm"
                    aria-label="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link href="/auth/login">
                  <button className="flex items-center space-x-2 text-white/85 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/10">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign In</span>
                  </button>
                </Link>
              )}

              {/* Cart Button */}
              <button
                onClick={toggleCart}
                className="relative flex items-center space-x-2 bg-baristas-cream text-baristas-brown-dark px-5 py-2.5 rounded-full font-semibold hover:bg-white transition-all shadow-md hover:shadow-lg text-sm"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Order</span>
                {mounted && cart.item_count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cart.item_count}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile: Cart + hamburger */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleCart}
                className="relative text-white p-2"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {mounted && cart.item_count > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cart.item_count}
                  </span>
                )}
              </button>
              <button
                id="mobile-menu-button"
                className="text-white p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div
              className="md:hidden mt-4 pb-4 space-y-1 bg-baristas-brown-dark/95 rounded-2xl p-4 border border-white/10"
              id="mobile-menu"
              role="menu"
              aria-labelledby="mobile-menu-button"
            >
              {[
                { href: "/", label: "Home" },
                { href: "/menu", label: "Menu" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-white/85 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/10 space-y-1">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-white/50 text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {user.first_name} {user.last_name}
                    </div>
                    <button
                      onClick={() => { setIsMenuOpen(false); logout(); }}
                      className="w-full text-left text-white/75 hover:text-white px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link href="/auth/login" className="block" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full text-left text-white/85 hover:text-white px-4 py-3 rounded-xl hover:bg-white/10 transition-colors font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Sign In
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
