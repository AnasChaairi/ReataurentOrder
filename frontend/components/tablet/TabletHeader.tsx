"use client";

import { useTablet } from "@/contexts/TabletContext";
import { useCart } from "@/contexts/CartContext";

interface TabletHeaderProps {
  onCartClick?: () => void;
}

export function TabletHeader({ onCartClick }: TabletHeaderProps) {
  const { table } = useTablet();
  const { cart } = useCart();

  return (
    <header className="bg-baristas-brown-dark text-white px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-baristas-cream rounded-full flex items-center justify-center">
          <span className="text-baristas-brown-dark font-bold text-lg">B</span>
        </div>
        <span className="text-xl font-bold tracking-wide">BARISTAS</span>
      </div>

      {/* Table Badge */}
      {table && (
        <div className="flex items-center gap-4">
          <div className="bg-baristas-cream text-baristas-brown-dark px-4 py-2 rounded-full font-semibold">
            Table {table.number}
          </div>

          {/* Cart indicator (mobile only, for when floating cart is hidden) */}
          {onCartClick && cart.item_count > 0 && (
            <button
              onClick={onCartClick}
              className="relative bg-white text-baristas-brown-dark px-4 py-2 rounded-full font-semibold flex items-center gap-2 md:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{cart.item_count}</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
