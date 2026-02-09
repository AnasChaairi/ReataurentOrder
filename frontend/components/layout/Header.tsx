"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth.service";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    authService.checkAuthStatus().then((data) => {
      if (data) setUser(data);
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    window.location.href = '/auth/login';
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-baristas-brown rounded-full flex items-center justify-center border-2 border-baristas-cream">
              <span className="text-baristas-cream text-xl font-bold">B</span>
            </div>
            <span className="text-baristas-cream text-2xl font-bold tracking-wide">BARISTAS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center bg-baristas-brown/80 backdrop-blur-sm rounded-full px-2 py-2 space-x-1">
            <Link href="/" className="px-6 py-2.5 rounded-full bg-baristas-cream text-baristas-brown-dark font-medium transition-colors">
              Home
            </Link>
            <Link href="/about" className="px-6 py-2.5 rounded-full text-white/90 hover:bg-baristas-brown-light transition-colors">
              About
            </Link>
            <Link href="/menu" className="px-6 py-2.5 rounded-full text-white/90 hover:bg-baristas-brown-light transition-colors">
              Menu
            </Link>
            <Link href="/events" className="px-6 py-2.5 rounded-full text-white/90 hover:bg-baristas-brown-light transition-colors">
              Events
            </Link>
            <Link href="/contact" className="px-6 py-2.5 rounded-full text-white/90 hover:bg-baristas-brown-light transition-colors">
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link href="/auth/login">
                  <button className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors px-4 py-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{user.first_name}</span>
                  </button>
                </Link>
                <Link href="/menu">
                  <button className="bg-baristas-cream text-baristas-brown-dark px-6 py-2.5 rounded-full font-semibold hover:bg-white transition-colors flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Order Now</span>
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <button className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors px-4 py-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Your account</span>
                  </button>
                </Link>
                <Link href="/menu">
                  <button className="bg-baristas-cream text-baristas-brown-dark px-6 py-2.5 rounded-full font-semibold hover:bg-white transition-colors flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Order Now</span>
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4">
            <Link href="/" className="block text-white/90 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/about" className="block text-white/90 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/menu" className="block text-white/90 hover:text-white transition-colors">
              Menu
            </Link>
            <Link href="/events" className="block text-white/90 hover:text-white transition-colors">
              Events
            </Link>
            <Link href="/contact" className="block text-white/90 hover:text-white transition-colors">
              Contact
            </Link>
            <div className="pt-4 space-y-2">
              <Link href="/auth/login" className="block">
                <Button variant="ghost" size="sm" className="w-full">
                  Your Account
                </Button>
              </Link>
              <Link href="/menu" className="block">
                <Button variant="primary" size="sm" className="w-full">
                  Order Now
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
