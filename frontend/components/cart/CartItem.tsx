"use client";

import Image from 'next/image';
import { CartItem as CartItemType } from '@/types/cart.types';
import { useCart } from '@/hooks/useCart';
import { X, Plus, Minus } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <article className="flex gap-3 p-4 bg-white rounded-2xl border border-baristas-beige shadow-sm">
      {/* Image */}
      {item.menuItem.image && (
        <div className="relative w-18 h-18 rounded-xl overflow-hidden flex-shrink-0 w-[72px] h-[72px]">
          <Image
            src={item.menuItem.image}
            alt={`${item.menuItem.name} in cart`}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-baristas-brown-dark text-sm truncate leading-tight">
            {item.menuItem.name}
          </h3>
          <button
            onClick={() => removeFromCart(item.id)}
            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
            aria-label={`Remove ${item.menuItem.name} from cart`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {item.variant && (
          <p className="text-xs text-gray-400 mt-0.5">Size: {item.variant.name}</p>
        )}
        {item.addons.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">
            + {item.addons.map((a) => a.addon.name).join(', ')}
          </p>
        )}
        {item.special_instructions && (
          <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">
            "{item.special_instructions}"
          </p>
        )}

        {/* Price + Quantity */}
        <div className="flex items-center justify-between mt-3">
          <div
            className="flex items-center gap-1.5 bg-baristas-cream rounded-full px-2 py-1"
            role="group"
            aria-label={`Quantity for ${item.menuItem.name}`}
          >
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-5 h-5 rounded-full bg-white text-baristas-brown flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-40"
              aria-label="Decrease quantity"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span
              className="w-5 text-center font-bold text-baristas-brown-dark text-xs"
              aria-live="polite"
              aria-atomic="true"
            >
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-5 h-5 rounded-full bg-white text-baristas-brown flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
              aria-label="Increase quantity"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          <p
            className="font-bold text-baristas-brown-dark text-sm"
            aria-label={`Item price: ${item.total_price.toFixed(2)} dirhams`}
          >
            {item.total_price.toFixed(2)} dh
          </p>
        </div>
      </div>
    </article>
  );
}
