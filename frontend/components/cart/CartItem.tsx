"use client";

import Image from 'next/image';
import { CartItem as CartItemType } from '@/types/cart.types';
import { useCart } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
      {/* Item Image */}
      {item.menuItem.image && (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={item.menuItem.image}
            alt={item.menuItem.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 truncate">{item.menuItem.name}</h3>

        {/* Variant */}
        {item.variant && (
          <p className="text-sm text-gray-600">Size: {item.variant.name}</p>
        )}

        {/* Addons */}
        {item.addons.length > 0 && (
          <p className="text-sm text-gray-600">
            + {item.addons.map((a) => a.addon.name).join(', ')}
          </p>
        )}

        {/* Special Instructions */}
        {item.special_instructions && (
          <p className="text-xs text-gray-500 italic mt-1">
            Note: {item.special_instructions}
          </p>
        )}

        {/* Price and Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300"
            >
              -
            </button>
            <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300"
            >
              +
            </button>
          </div>

          <p className="font-bold text-gray-900">{item.total_price.toFixed(2)} dh</p>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => removeFromCart(item.id)}
        className="text-gray-400 hover:text-red-600 self-start"
        title="Remove from cart"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
