"use client";

import { useCart } from "@/contexts/CartContext";

interface TabletFloatingCartProps {
  onClick: () => void;
}

export function TabletFloatingCart({ onClick }: TabletFloatingCartProps) {
  const { cart } = useCart();

  if (cart.item_count === 0) {
    return null;
  }

  return (
    <div className="tablet-floating-cart">
      <button
        onClick={onClick}
        className="bg-baristas-brown text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 hover:bg-baristas-brown-dark transition-all transform hover:scale-105"
      >
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="absolute -top-2 -right-2 bg-white text-baristas-brown text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {cart.item_count}
          </span>
        </div>
        <div className="text-left">
          <div className="text-sm opacity-80">View Cart</div>
          <div className="text-lg font-bold">{cart.total.toFixed(2)} dh</div>
        </div>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
